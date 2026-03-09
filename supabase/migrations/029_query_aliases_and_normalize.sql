-- ============================================
-- 029: Query normalization layer
--
-- 1. query_aliases table: maps user typos/concatenations to canonical forms
-- 2. normalize_query() function: applies aliases + generic cleanup
-- 3. search_products_v2 rebuilt to normalize before searching
-- ============================================

-- 1. Alias table
CREATE TABLE query_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias text NOT NULL UNIQUE,
  canonical text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_query_aliases_alias ON query_aliases (alias);

-- 2. Populate with known patterns
INSERT INTO query_aliases (alias, canonical) VALUES
  -- Brand concatenations (most common user behavior)
  ('cocacola',      'coca cola'),
  ('coca-cola',     'coca cola'),
  ('cocacola zero', 'coca cola zero'),
  ('coca-cola zero','coca cola zero'),
  ('redbull',       'red bull'),
  ('red-bull',      'red bull'),
  ('sanpellegrino', 'san pellegrino'),
  ('san-pellegrino','san pellegrino'),
  ('sanbenedetto',  'san benedetto'),
  ('san-benedetto', 'san benedetto'),
  ('jackdaniels',   'jack daniel'),
  ('jack-daniels',  'jack daniel'),
  ('jack daniels',  'jack daniel'),
  ('johnniewalker', 'johnnie walker'),
  ('johnnie-walker','johnnie walker'),
  ('johny walker',  'johnnie walker'),
  ('johnny walker', 'johnnie walker'),
  ('gingerbeer',    'ginger beer'),
  ('ginger-beer',   'ginger beer'),
  ('gingerale',     'ginger ale'),
  ('ginger-ale',    'ginger ale'),
  ('schwepps',      'schweppes'),
  ('shweppes',      'schweppes'),
  ('pepsicola',     'pepsi cola'),
  ('pepsi-cola',    'pepsi cola'),
  ('granmarnier',   'gran marnier'),
  ('gran-marnier',  'gran marnier'),
  -- Common Italian misspellings / shortcuts
  ('proseco',       'prosecco'),
  ('prosciuto',     'prosciutto'),
  ('mozzarela',     'mozzarella'),
  ('parmigiano',    'parmigiano'),
  ('gorgonzola',    'gorgonzola'),
  ('mascarpone',    'mascarpone'),
  ('bruschetta',    'bruschetta'),
  ('focaccia',      'focaccia'),
  ('limoncello',    'limoncello'),
  ('amaretto',      'amaretto'),
  -- Abbreviations hotel staff use
  ('olio evo',      'olio extravergine'),
  ('aceto bals',    'aceto balsamico')
ON CONFLICT (alias) DO NOTHING;

-- 3. Normalize function
CREATE OR REPLACE FUNCTION normalize_query(raw_text text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_alias text;
BEGIN
  -- Lowercase and trim
  v_clean := lower(trim(raw_text));

  -- Collapse multiple spaces
  v_clean := regexp_replace(v_clean, '\s+', ' ', 'g');

  -- Check alias table (exact match on cleaned input)
  SELECT qa.canonical INTO v_alias
  FROM query_aliases qa
  WHERE qa.alias = v_clean
  LIMIT 1;

  IF v_alias IS NOT NULL THEN
    RETURN v_alias;
  END IF;

  -- No alias found, return cleaned input
  RETURN v_clean;
END;
$$;

-- 4. Rebuild search_products_v2 with normalization
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
  v_normalized text;
  v_has_search boolean;
  v_tsquery tsquery;
  v_like_pattern text;
BEGIN
  -- Normalize the query (alias lookup + cleanup)
  v_normalized := normalize_query(search_text);
  v_has_search := (v_normalized IS NOT NULL AND v_normalized <> '');

  -- strict_word_similarity threshold
  PERFORM set_config('pg_trgm.strict_word_similarity_threshold', '0.45', true);

  IF v_has_search THEN
    v_like_pattern := '%' || replace(replace(replace(
      v_normalized, '\', '\\'), '%', '\%'), '_', '\_') || '%';

    BEGIN
      v_tsquery := websearch_to_tsquery('italian', v_normalized);
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
      CASE
        WHEN NOT v_has_search OR v_tsquery IS NULL THEN 0::real
        ELSE COALESCE(ts_rank(p.fts_vector, v_tsquery), 0)::real
      END AS fts_score,
      CASE
        WHEN NOT v_has_search THEN 0::real
        WHEN p.description %>> v_normalized THEN strict_word_similarity(v_normalized, p.description)::real
        ELSE 0::real
      END AS wsim_score,
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
        OR p.description %>> v_normalized
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
          CASE WHEN MAX(m.fts_score) OVER () > 0
            THEN (m.fts_score / MAX(m.fts_score) OVER ()) * 0.40
            ELSE 0
          END
          + m.wsim_score * 0.35
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
