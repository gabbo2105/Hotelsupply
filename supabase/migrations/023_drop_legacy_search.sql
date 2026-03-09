-- ============================================
-- 023: Drop legacy search functions
--
-- search_products_hybrid is kept for now (used by ai_chat semantic tool)
-- search_products_catalog is fully replaced by search_products_v2
-- ============================================

DROP FUNCTION IF EXISTS search_products_catalog(text, uuid, uuid, numeric, numeric, text, int, int);
