-- 030: Recreate embedding_cache (dropped in 026 with categories)
-- Used by ai_chat Edge Function's search_products_semantic tool
-- to cache OpenAI query embeddings and avoid repeated API calls.

CREATE TABLE IF NOT EXISTS embedding_cache (
  query_hash text PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE embedding_cache IS 'Cache for OpenAI query embeddings used by semantic search in ai_chat Edge Function';
