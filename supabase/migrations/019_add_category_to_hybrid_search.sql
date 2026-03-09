-- UPGRADE: search_products_hybrid with category fields + trigram fuzzy layer.
-- Three matching layers: FTS + pg_trgm fuzzy + pgvector semantic.
-- "cocacolazero" → trigram matches "COCA COLA ZERO" without needing embeddings.
-- Semantic threshold raised from 0.3 to 0.45 to filter out noise.

-- Drop old overload with unit_price_min/max args.
DROP FUNCTION IF EXISTS public.search_products_hybrid(text, vector, uuid, numeric, numeric, numeric, numeric, double precision, double precision, integer);
-- Drop previous version without trigram.
DROP FUNCTION IF EXISTS public.search_products_hybrid(text, vector, uuid, numeric, numeric, double precision, double precision, integer);

CREATE OR REPLACE FUNCTION search_products_hybrid(
  search_text text,
  query_embedding vector(1536) DEFAULT NULL,
  supplier_filter uuid DEFAULT NULL,
  price_min numeric DEFAULT NULL,
  price_max numeric DEFAULT NULL,
  fts_weight float DEFAULT 0.4,
  semantic_weight float DEFAULT 0.6,
  result_limit int DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  supplier_name text,
  supplier_code text,
  description text,
  selling_uom text,
  pricing_uom text,
  price numeric,
  category_id uuid,
  category_name text,
  category_slug text,
  fts_rank real,
  semantic_similarity float,
  combined_score float
)
LANGUAGE plpgsql STABLE
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH fts_hits AS (
    SELECT p.id,
           ts_rank(p.fts_vector, websearch_to_tsquery('italian', search_text)) AS rank
    FROM products p
    WHERE p.fts_vector @@ websearch_to_tsquery('italian', search_text)
      AND (supplier_filter IS NULL OR p.supplier_id = supplier_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
    ORDER BY rank DESC
    LIMIT result_limit
  ),
  -- Trigram fuzzy matching: catches typos, concatenated words, partial matches
  trigram_hits AS (
    SELECT p.id,
           similarity(p.description, search_text)::real AS trgm_sim
    FROM products p
    WHERE similarity(p.description, search_text) > 0.15
      AND (supplier_filter IS NULL OR p.supplier_id = supplier_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
    ORDER BY trgm_sim DESC
    LIMIT result_limit
  ),
  semantic_hits AS (
    SELECT p.id,
           (1 - (p.embedding <=> query_embedding))::float AS sim
    FROM products p
    WHERE query_embedding IS NOT NULL
      AND p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> query_embedding)) > 0.45
      AND (supplier_filter IS NULL OR p.supplier_id = supplier_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
    ORDER BY p.embedding <=> query_embedding
    LIMIT result_limit
  ),
  combined AS (
    SELECT
      COALESCE(f.id, t.id, s.id) AS product_id,
      COALESCE(f.rank, 0::real) AS fts_r,
      COALESCE(t.trgm_sim, 0::real) AS trgm_r,
      COALESCE(s.sim, 0::float) AS sem_s
    FROM fts_hits f
    FULL OUTER JOIN trigram_hits t ON f.id = t.id
    FULL OUTER JOIN semantic_hits s ON COALESCE(f.id, t.id) = s.id
  ),
  normalized AS (
    SELECT
      product_id,
      CASE
        WHEN MAX(fts_r) OVER () > 0
        THEN (fts_r / MAX(fts_r) OVER ())::real
        ELSE 0::real
      END AS fts_norm,
      trgm_r AS trgm_norm,
      fts_r AS fts_raw,
      sem_s
    FROM combined
  )
  SELECT
    p.id,
    sup.name AS supplier_name,
    p.supplier_code,
    p.description,
    p.selling_uom,
    p.pricing_uom,
    p.price,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    n.fts_raw AS fts_rank,
    n.sem_s AS semantic_similarity,
    GREATEST(
      (n.fts_norm * fts_weight + n.sem_s * semantic_weight)::float,
      n.trgm_norm::float
    ) AS combined_score
  FROM normalized n
  JOIN products p ON p.id = n.product_id
  JOIN suppliers sup ON sup.id = p.supplier_id
  LEFT JOIN categories c ON c.id = p.category_id
  ORDER BY GREATEST(
    (n.fts_norm * fts_weight + n.sem_s * semantic_weight)::float,
    n.trgm_norm::float
  ) DESC
  LIMIT result_limit;
END;
$$;
