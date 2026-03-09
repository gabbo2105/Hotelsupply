-- ============================================
-- 026: Remove categories system entirely
--
-- Drops: category_keywords, categories, classify_product(),
--        trg_auto_classify trigger, validate_classification_knn(),
--        embedding_cache, products.category_id column
-- Updates: search_products_v2 to remove category params/joins
-- ============================================

-- 1. Drop trigger first (depends on function)
DROP TRIGGER IF EXISTS trg_auto_classify ON products;

-- 2. Drop functions
DROP FUNCTION IF EXISTS classify_product(text);
DROP FUNCTION IF EXISTS auto_classify_product();
DROP FUNCTION IF EXISTS validate_classification_knn(uuid, int);

-- 3. Drop category_keywords (FK to categories)
DROP TABLE IF EXISTS category_keywords;

-- 4. Drop embedding_cache
DROP TABLE IF EXISTS embedding_cache;

-- 5. Drop category_id from products (removes FK + index)
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- 6. Drop categories table
DROP TABLE IF EXISTS categories;

-- 7. Drop old search_products_v2 (return type changed — cannot use CREATE OR REPLACE)
DROP FUNCTION IF EXISTS search_products_v2(text, uuid, uuid, numeric, numeric, text, int, int);

-- 8. Recreate search_products_v2 without category columns
--    + improved ranking: word_similarity (not similarity), ILIKE substring layer,
--      threshold 0.35, scoring blend 0.40/0.35/0.25, post-filter >= 0.10
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
  -- word_similarity threshold: 0.35 blocks false positives like "pepsi"->"PEPERONI"
  PERFORM set_config('pg_trgm.word_similarity_threshold', '0.35', true);

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
      -- Word similarity (compares query against best-matching window in description)
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN p.description %> search_text THEN word_similarity(search_text, p.description)::real
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
        OR p.description %> search_text
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
          -- Word similarity already 0-1, weight 0.35
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
    -- Post-filter: remove rows that only matched via weak FTS stem
    NOT v_has_search OR sc.relevance >= 0.10
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
