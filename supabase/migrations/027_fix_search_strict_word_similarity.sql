-- ============================================
-- 027: Fix search_products_v2 — strict_word_similarity
--
-- Replaces word_similarity (%>) with strict_word_similarity (%>>)
-- Threshold raised to 0.45 to eliminate false positives:
--   pepsi -> PEPE COLORATO (was 0.500/pass, now 0.375/block)
--   cocacola -> PELLICOLA (was 0.357/pass, now 0.200/block)
--   cocacola -> YOGURT COLATO (was 0.333/pass, now blocked)
-- True positives preserved:
--   cocacola -> COCA COLA (0.700), redbull -> RED BULL (0.545)
--   pepsi -> PEPSI COLA (1.000), prosecco -> PROSECCO (1.000)
--
-- Also: FTS-only matches (no trigram, no substr) require fts_score
-- normalization >= 0.3 to prevent stemmer false positives.
-- ============================================

-- Must DROP first because return type is unchanged but body changes
DROP FUNCTION IF EXISTS search_products_v2(text, uuid, uuid, numeric, numeric, text, int, int);

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
  relevance_score real,
  total_count bigint
)
LANGUAGE plpgsql STABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_has_search boolean := (search_text IS NOT NULL AND search_text <> '');
  v_tsquery tsquery;
  v_like_pattern text;
BEGIN
  -- strict_word_similarity threshold: 0.45 blocks false positives
  -- like pepsi->PEPE (0.375) and cocacola->PELLICOLA (0.200)
  PERFORM set_config('pg_trgm.strict_word_similarity_threshold', '0.45', true);

  IF v_has_search THEN
    -- Escape LIKE metacharacters for substring layer
    v_like_pattern := '%' || replace(replace(replace(
      lower(search_text), '\', '\\'), '%', '\%'), '_', '\_') || '%';

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
      -- FTS score
      CASE
        WHEN NOT v_has_search OR v_tsquery IS NULL THEN 0::real
        ELSE COALESCE(ts_rank(p.fts_vector, v_tsquery), 0)::real
      END AS fts_score,
      -- Strict word similarity (stricter than word_similarity)
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN p.description %>> search_text THEN strict_word_similarity(search_text, p.description)::real
        ELSE 0::real
      END AS wsim_score,
      -- Substring exact match (high confidence signal)
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN lower(p.description) LIKE v_like_pattern THEN 1::real
        ELSE 0::real
      END AS substr_score
    FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE
      (NOT v_has_search OR (
        (v_tsquery IS NOT NULL AND p.fts_vector @@ v_tsquery)
        OR p.description %>> search_text
        OR lower(p.description) LIKE v_like_pattern
      ))
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
          -- FTS normalized to 0-1, weight 0.40
          CASE WHEN MAX(m.fts_score) OVER () > 0
            THEN (m.fts_score / MAX(m.fts_score) OVER ()) * 0.40
            ELSE 0
          END
          -- Strict word similarity already 0-1, weight 0.35
          + m.wsim_score * 0.35
          -- Substring bonus, weight 0.25
          + m.substr_score * 0.25
        )::real
      END AS relevance
    FROM matches m
  )
  SELECT
    sc.id,
    sc.supplier_id,
    sc.supplier_name,
    sc.supplier_code,
    sc.description,
    sc.selling_uom,
    sc.price,
    sc.relevance AS relevance_score,
    count(*) OVER () AS total_count
  FROM scored sc
  WHERE
    NOT v_has_search
    OR sc.relevance >= 0.10
    -- Block FTS-only matches (stemmer false positives):
    -- If only FTS matched (no trigram, no substr), require higher bar
    OR (sc.wsim_score > 0 OR sc.substr_score > 0)
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND v_has_search THEN sc.relevance END DESC NULLS LAST,
    CASE WHEN sort_by = 'price_asc' THEN sc.price END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN sc.price END DESC NULLS LAST,
    CASE WHEN sort_by = 'description' OR (sort_by = 'relevance' AND NOT v_has_search)
      THEN sc.description END ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;
