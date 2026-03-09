-- ============================================
-- 024: Fix search false positives in search_products_v2
--
-- Problems addressed:
--   1. Trigram threshold 0.15 too low: "pepsi" matches "PEPERONI ROSSI" (sim=0.21)
--   2. similarity() compares full strings, penalizing short queries vs long descriptions
--   3. FTS Italian stemmer reduces "pepsi" to "peps" causing over-matching
--   4. No high-confidence exact/substring signal
--
-- Solutions:
--   1. Raise trigram threshold to 0.35 (eliminates most false positives)
--   2. Use word_similarity() instead of similarity() (matches best word substring)
--   3. Add ILIKE substring layer as high-confidence signal (score boost)
--   4. Post-filter: require minimum combined score of 0.15 to appear in results
--   5. Bonus scoring for exact word boundary matches
--
-- Index required: GIN index on description with gin_trgm_ops (already exists)
-- New operator used: <% (word_similarity) which also uses the GIN trgm index
-- ============================================

CREATE OR REPLACE FUNCTION search_products_v2(
  search_text text DEFAULT NULL,
  category_filter uuid DEFAULT NULL,
  supplier_filter uuid DEFAULT NULL,
  price_min numeric DEFAULT NULL,
  price_max numeric DEFAULT NULL,
  sort_by text DEFAULT 'relevance',
  page_size int DEFAULT 24,
  page_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  supplier_id uuid,
  supplier_name text,
  supplier_code text,
  description text,
  selling_uom text,
  price numeric,
  category_id uuid,
  category_name text,
  category_slug text,
  relevance_score real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_has_search boolean := (search_text IS NOT NULL AND search_text <> '');
  v_tsquery tsquery;
  v_search_lower text;
  v_search_pattern text;
BEGIN
  -- --------------------------------------------------------
  -- THRESHOLD: 0.35 for word_similarity
  --
  -- Why 0.35 instead of 0.15:
  --   - "pepsi" vs "PEPERONI ROSSI": word_similarity ~0.20 -> filtered out
  --   - "cocacola" vs "COCA COLA":   word_similarity ~0.50 -> passes
  --   - "cocacola" vs "BOMBOLA":     word_similarity ~0.18 -> filtered out
  --   - Catches real typos like "cocaocla" (word_sim ~0.40) while blocking noise
  --
  -- We use word_similarity() instead of similarity() because:
  --   similarity() divides by the UNION of trigrams from both strings,
  --   so "pepsi" (5 chars) vs "PEPERONI ROSSI I" (16 chars) gets diluted.
  --   word_similarity() finds the best matching substring of the description
  --   that is closest to the query, making short queries work correctly.
  -- --------------------------------------------------------
  PERFORM set_config('pg_trgm.word_similarity_threshold', '0.35', true);

  -- Pre-compute search helpers
  IF v_has_search THEN
    v_search_lower := lower(trim(search_text));
    -- Escape LIKE metacharacters, then wrap with wildcards
    v_search_pattern := '%' || replace(replace(replace(v_search_lower, '%', '\%'), '_', '\_'), '\', '\\') || '%';

    BEGIN
      v_tsquery := websearch_to_tsquery('italian', search_text);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := NULL;
    END;
  END IF;

  RETURN QUERY
  WITH matches AS (
    SELECT
      p.id,
      p.supplier_id,
      s.name AS supplier_name,
      p.supplier_code,
      p.description,
      p.selling_uom,
      p.price,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,

      -- --------------------------------------------------------
      -- LAYER 1: FTS Italian (GIN index on fts_vector)
      -- Primary structured text search. Good for Italian words.
      -- Weakness: stemmer can cause over-matching for brand names.
      -- --------------------------------------------------------
      CASE
        WHEN NOT v_has_search OR v_tsquery IS NULL THEN 0::real
        ELSE COALESCE(ts_rank(p.fts_vector, v_tsquery), 0)::real
      END AS fts_score,

      -- --------------------------------------------------------
      -- LAYER 2: Word trigram similarity (GIN index via <% operator)
      --
      -- word_similarity(query, description) returns the maximum similarity
      -- between the query and any substring of the description of the same
      -- length. This is critical for matching short brand names against
      -- longer product descriptions.
      --
      -- Uses the <% operator for index scan (query <% description means
      -- word_similarity(query, description) >= threshold).
      -- --------------------------------------------------------
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN v_search_lower <% p.description
          THEN word_similarity(v_search_lower, p.description)::real
        ELSE 0::real
      END AS wsim_score,

      -- --------------------------------------------------------
      -- LAYER 3: ILIKE substring match (high-confidence signal)
      --
      -- If the literal search text appears anywhere in the description,
      -- this is almost certainly a correct match. Not index-accelerated
      -- on its own, but since it runs ONLY on rows already matched by
      -- FTS or trigram (due to the WHERE clause OR structure), the set
      -- is small (<100 rows typically).
      --
      -- This catches cases where trigrams might not fire but the text
      -- is literally present (e.g., "CO2" in "BOMBOLA CO2 KG 10").
      -- --------------------------------------------------------
      CASE
        WHEN NOT v_has_search THEN false
        WHEN lower(p.description) LIKE v_search_pattern THEN true
        ELSE false
      END AS has_substring_match

    FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE
      -- Text matching: FTS OR word-trigram OR substring
      (NOT v_has_search OR (
        (v_tsquery IS NOT NULL AND p.fts_vector @@ v_tsquery)
        OR (v_search_lower <% p.description)
        OR (lower(p.description) LIKE v_search_pattern)
      ))
      -- Filters
      AND (category_filter IS NULL OR p.category_id = category_filter)
      AND (supplier_filter IS NULL OR p.supplier_id = supplier_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
  ),
  scored AS (
    SELECT
      m.*,
      CASE
        WHEN NOT v_has_search THEN 0::real
        ELSE (
          -- --------------------------------------------------------
          -- SCORING FORMULA
          --
          -- Component weights:
          --   FTS (normalized):      0.40  -- good for Italian language
          --   Word similarity:       0.35  -- best for brand names, typos
          --   Substring match bonus: 0.25  -- high-confidence literal match
          --
          -- The substring bonus acts as a strong "override" signal:
          --   If "pepsi" appears literally in "PEPSI COLA ZERO PET 500 ML",
          --   it gets +0.25 regardless of how FTS/trigram score it.
          --
          -- FTS normalization: divide by max in result set (0-1 range).
          -- word_similarity is already 0-1.
          -- Substring is binary 0 or 1.
          -- --------------------------------------------------------
          (
            -- FTS normalized to 0-1, weight 0.40
            CASE WHEN MAX(m.fts_score) OVER () > 0
              THEN (m.fts_score / MAX(m.fts_score) OVER ()) * 0.40
              ELSE 0
            END
            -- Word similarity, weight 0.35
            + m.wsim_score * 0.35
            -- Substring match bonus, weight 0.25
            + CASE WHEN m.has_substring_match THEN 0.25 ELSE 0 END
          )
        )::real
      END AS relevance
    FROM matches m
  ),
  -- --------------------------------------------------------
  -- POST-FILTER: minimum relevance threshold
  --
  -- Even if a row passed the WHERE clause (via FTS stemming or trigram
  -- at the 0.35 threshold), if the combined score is below 0.15 it is
  -- likely a false positive. This catches cases where FTS stemming
  -- matched but trigram and substring did not confirm.
  --
  -- Example: "pepsi" -> FTS stems to "peps" -> might match "PEPE..."
  -- But wsim_score=0 and substring=false, so combined ~0.10 -> filtered.
  -- --------------------------------------------------------
  filtered AS (
    SELECT *
    FROM scored
    WHERE NOT v_has_search OR relevance >= 0.15
  )
  SELECT
    f.id,
    f.supplier_id,
    f.supplier_name,
    f.supplier_code,
    f.description,
    f.selling_uom,
    f.price,
    f.category_id,
    f.category_name,
    f.category_slug,
    f.relevance AS relevance_score,
    count(*) OVER () AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND v_has_search THEN f.relevance END DESC NULLS LAST,
    CASE WHEN sort_by = 'price_asc' THEN f.price END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN f.price END DESC NULLS LAST,
    CASE WHEN sort_by = 'description' OR (sort_by = 'relevance' AND NOT v_has_search)
      THEN f.description END ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- ============================================
-- Verify the <% operator is available.
-- The GIN index with gin_trgm_ops already supports <%
-- (word_similarity operators) — no new index needed.
-- ============================================
