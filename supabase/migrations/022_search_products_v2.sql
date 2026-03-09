-- ============================================
-- 022: Unified search function — search_products_v2
--
-- Replaces both search_products_hybrid and search_products_catalog
-- with a single, fast, embedding-free search function.
--
-- Layers:
--   1. FTS italiano (GIN index) — primary signal
--   2. Trigram with % operator (GIN index) — fuzzy fallback
--   No embeddings = instant results (~50-100ms)
--
-- Scoring: FTS normalized * 0.7 + trigram * 0.3
-- Supports: pagination, sorting, category/supplier/price filters
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
BEGIN
  -- Lower trigram threshold to catch typos on short product descriptions
  PERFORM set_config('pg_trgm.similarity_threshold', '0.15', true);

  -- Pre-compute tsquery once (avoid repeated parsing)
  IF v_has_search THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('italian', search_text);
    EXCEPTION WHEN OTHERS THEN
      -- If search_text can't be parsed as websearch query, fallback to trigram only
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
      -- FTS score (0 if no search or no FTS match)
      CASE
        WHEN NOT v_has_search OR v_tsquery IS NULL THEN 0::real
        ELSE COALESCE(ts_rank(p.fts_vector, v_tsquery), 0)::real
      END AS fts_score,
      -- Trigram score (uses GIN index via % operator)
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN p.description % search_text THEN similarity(p.description, search_text)::real
        ELSE 0::real
      END AS trgm_score
    FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE
      -- Text matching: FTS OR trigram (both use GIN indexes)
      (NOT v_has_search OR (
        (v_tsquery IS NOT NULL AND p.fts_vector @@ v_tsquery)
        OR p.description % search_text
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
          -- FTS normalized to 0-1 range, weighted 70%
          CASE WHEN MAX(m.fts_score) OVER () > 0
            THEN (m.fts_score / MAX(m.fts_score) OVER ()) * 0.7
            ELSE 0
          END
          -- Trigram already 0-1 range, weighted 30%
          + m.trgm_score * 0.3
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
    sc.category_id,
    sc.category_name,
    sc.category_slug,
    sc.relevance AS relevance_score,
    count(*) OVER () AS total_count
  FROM scored sc
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
