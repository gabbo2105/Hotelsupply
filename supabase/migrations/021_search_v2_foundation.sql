-- ============================================
-- 021: Search V2 Foundation
--
-- 1. category_keywords table (replaces regex classification)
-- 2. classify_product() function + auto-classify trigger
-- 3. embedding_cache table (for AI agent)
-- 4. Backfill products with new classification
-- 5. Drop dead search functions
-- ============================================

-- ══════════════════════════════════════════════
-- 1. CATEGORY KEYWORDS TABLE
-- ══════════════════════════════════════════════

CREATE TABLE category_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  priority int NOT NULL DEFAULT 100,
  match_type text NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('exact_word', 'contains', 'prefix')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catkey_priority_keyword ON category_keywords(priority, keyword);
CREATE INDEX idx_catkey_category ON category_keywords(category_id);

ALTER TABLE category_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY catkey_read ON category_keywords
  FOR SELECT USING (true);

CREATE POLICY catkey_admin ON category_keywords
  FOR ALL USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

-- ══════════════════════════════════════════════
-- POPULATE KEYWORDS
-- Priority: lower = checked first (brands/specific before generic)
-- match_type: exact_word = \y boundary, contains = LIKE, prefix = starts with
-- ══════════════════════════════════════════════

-- Helper: get category id by slug
CREATE OR REPLACE FUNCTION _cat(slug_val text) RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT id FROM categories WHERE slug = slug_val;
$$;

-- ── PULIZIA E MONOUSO (priority 10: very specific, no ambiguity) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('pulizia-monouso'), 'detersiv', 10, 'contains'),
  (_cat('pulizia-monouso'), 'detergent', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sapone', 10, 'contains'),
  (_cat('pulizia-monouso'), 'soap', 10, 'contains'),
  (_cat('pulizia-monouso'), 'igienizz', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sanific', 10, 'contains'),
  (_cat('pulizia-monouso'), 'disinfett', 10, 'contains'),
  (_cat('pulizia-monouso'), 'candeggina', 10, 'contains'),
  (_cat('pulizia-monouso'), 'bleach', 10, 'contains'),
  (_cat('pulizia-monouso'), 'ammorbid', 10, 'contains'),
  (_cat('pulizia-monouso'), 'brillant', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sgrassat', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sgrassatore', 10, 'contains'),
  (_cat('pulizia-monouso'), 'anticalc', 10, 'contains'),
  (_cat('pulizia-monouso'), 'pulito', 10, 'contains'),
  (_cat('pulizia-monouso'), 'cleaner', 10, 'contains'),
  (_cat('pulizia-monouso'), 'spugna', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sponge', 10, 'contains'),
  (_cat('pulizia-monouso'), 'straccio', 10, 'contains'),
  (_cat('pulizia-monouso'), 'scopa', 10, 'contains'),
  (_cat('pulizia-monouso'), 'paletta', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sacchetto', 10, 'contains'),
  (_cat('pulizia-monouso'), 'pellicola', 10, 'contains'),
  (_cat('pulizia-monouso'), 'alluminio', 10, 'contains'),
  (_cat('pulizia-monouso'), 'tovagliolo', 10, 'contains'),
  (_cat('pulizia-monouso'), 'napkin', 10, 'contains'),
  (_cat('pulizia-monouso'), 'posata', 10, 'contains'),
  (_cat('pulizia-monouso'), 'forchetta', 10, 'contains'),
  (_cat('pulizia-monouso'), 'cucchiaio', 10, 'contains'),
  (_cat('pulizia-monouso'), 'cannuccia', 10, 'contains'),
  (_cat('pulizia-monouso'), 'straw', 10, 'contains'),
  (_cat('pulizia-monouso'), 'guanto', 10, 'contains'),
  (_cat('pulizia-monouso'), 'glove', 10, 'contains'),
  (_cat('pulizia-monouso'), 'cuffia', 10, 'contains'),
  (_cat('pulizia-monouso'), 'retina', 10, 'contains'),
  (_cat('pulizia-monouso'), 'grembiule', 10, 'contains'),
  (_cat('pulizia-monouso'), 'monouso', 10, 'contains'),
  (_cat('pulizia-monouso'), 'disposab', 10, 'contains'),
  (_cat('pulizia-monouso'), 'tork', 10, 'contains'),
  (_cat('pulizia-monouso'), 'pattumier', 10, 'contains'),
  (_cat('pulizia-monouso'), 'sottobicchier', 10, 'contains'),
  (_cat('pulizia-monouso'), 'velina', 10, 'contains'),
  (_cat('pulizia-monouso'), 'tovagliett', 10, 'contains'),
  (_cat('pulizia-monouso'), 'lavastoviglie', 10, 'contains'),
  (_cat('pulizia-monouso'), 'lavapaviment', 10, 'contains'),
  (_cat('pulizia-monouso'), 'multiuso', 10, 'contains'),
  (_cat('pulizia-monouso'), 'panno', 10, 'exact_word'),
  (_cat('pulizia-monouso'), 'busta', 10, 'exact_word'),
  (_cat('pulizia-monouso'), 'wc', 10, 'exact_word'),
  (_cat('pulizia-monouso'), 'clor', 10, 'exact_word'),
  (_cat('pulizia-monouso'), 'coltello', 10, 'contains'),
  (_cat('pulizia-monouso'), 'mop', 10, 'exact_word');

-- ── UOVA (priority 15: very specific) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('uova'), 'uova', 15, 'exact_word'),
  (_cat('uova'), 'uovo', 15, 'exact_word'),
  (_cat('uova'), 'eggs', 15, 'contains'),
  (_cat('uova'), 'frittata', 15, 'contains'),
  (_cat('uova'), 'omelette', 15, 'contains'),
  (_cat('uova'), 'albume', 15, 'contains'),
  (_cat('uova'), 'tuorlo', 15, 'contains');

-- ── DOLCI E PASTICCERIA (priority 18: before carne to catch "Manzoni" brand) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('dolci-pasticceria'), 'manzoni', 5, 'contains'),
  (_cat('dolci-pasticceria'), 'dolce', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'dessert', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'torta', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'cake', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'gelato', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'sorbetto', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'biscott', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'cookie', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'cioccolat', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'chocol', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'cacao', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'budino', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'tiramisu', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'profiterol', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'mousse', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'meringh', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'macaron', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'cannolo', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'sfogliatella', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'pastiera', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'colomba', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'panettone', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'pandoro', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'pralin', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'fondente', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'gianduja', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'zucchero', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'sugar', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'marmellata', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'confettura', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'wafer', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'nutella', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'glassa', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'topping', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'granella', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'candito', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'amaretti', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'pasticceri', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'ciambellone', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'crostata', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'plumcake', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'crostatina', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'merendina', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'miele', 18, 'exact_word'),
  (_cat('dolci-pasticceria'), 'honey', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'jam', 18, 'exact_word'),
  (_cat('dolci-pasticceria'), 'panna cotta', 18, 'contains'),
  (_cat('dolci-pasticceria'), 'ice cream', 18, 'contains');

-- ── VINI E SPUMANTI (priority 20) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('vini-spumanti'), 'vino', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'wine', 20, 'contains'),
  (_cat('vini-spumanti'), 'chianti', 20, 'contains'),
  (_cat('vini-spumanti'), 'barolo', 20, 'contains'),
  (_cat('vini-spumanti'), 'brunello', 20, 'contains'),
  (_cat('vini-spumanti'), 'prosecco', 20, 'contains'),
  (_cat('vini-spumanti'), 'champagne', 20, 'contains'),
  (_cat('vini-spumanti'), 'spumante', 20, 'contains'),
  (_cat('vini-spumanti'), 'amarone', 20, 'contains'),
  (_cat('vini-spumanti'), 'montepulciano', 20, 'contains'),
  (_cat('vini-spumanti'), 'sangiovese', 20, 'contains'),
  (_cat('vini-spumanti'), 'merlot', 20, 'contains'),
  (_cat('vini-spumanti'), 'cabernet', 20, 'contains'),
  (_cat('vini-spumanti'), 'pinot', 20, 'contains'),
  (_cat('vini-spumanti'), 'chardonnay', 20, 'contains'),
  (_cat('vini-spumanti'), 'sauvignon', 20, 'contains'),
  (_cat('vini-spumanti'), 'vermentino', 20, 'contains'),
  (_cat('vini-spumanti'), 'moscato', 20, 'contains'),
  (_cat('vini-spumanti'), 'lambrusco', 20, 'contains'),
  (_cat('vini-spumanti'), 'primitivo', 20, 'contains'),
  (_cat('vini-spumanti'), 'nebbiolo', 20, 'contains'),
  (_cat('vini-spumanti'), 'barbera', 20, 'contains'),
  (_cat('vini-spumanti'), 'trebbiano', 20, 'contains'),
  (_cat('vini-spumanti'), 'rosato', 20, 'contains'),
  (_cat('vini-spumanti'), 'frascati', 20, 'contains'),
  (_cat('vini-spumanti'), 'verdicchio', 20, 'contains'),
  (_cat('vini-spumanti'), 'soave', 20, 'contains'),
  (_cat('vini-spumanti'), 'bardolino', 20, 'contains'),
  (_cat('vini-spumanti'), 'valpolicella', 20, 'contains'),
  (_cat('vini-spumanti'), 'vernaccia', 20, 'contains'),
  (_cat('vini-spumanti'), 'cannonau', 20, 'contains'),
  (_cat('vini-spumanti'), 'nero d''avola', 20, 'contains'),
  (_cat('vini-spumanti'), 'franciacorta', 20, 'contains'),
  (_cat('vini-spumanti'), 'lugana', 20, 'contains'),
  (_cat('vini-spumanti'), 'gewurz', 20, 'contains'),
  (_cat('vini-spumanti'), 'riesling', 20, 'contains'),
  (_cat('vini-spumanti'), 'grillo', 20, 'contains'),
  (_cat('vini-spumanti'), 'fiano', 20, 'contains'),
  (_cat('vini-spumanti'), 'falanghina', 20, 'contains'),
  (_cat('vini-spumanti'), 'aglianico', 20, 'contains'),
  (_cat('vini-spumanti'), 'refosco', 20, 'contains'),
  (_cat('vini-spumanti'), 'corvina', 20, 'contains'),
  (_cat('vini-spumanti'), 'garganega', 20, 'contains'),
  (_cat('vini-spumanti'), 'chablis', 20, 'contains'),
  (_cat('vini-spumanti'), 'bordeaux', 20, 'contains'),
  (_cat('vini-spumanti'), 'bourgogne', 20, 'contains'),
  (_cat('vini-spumanti'), 'beaujolais', 20, 'contains'),
  (_cat('vini-spumanti'), 'sancerre', 20, 'contains'),
  (_cat('vini-spumanti'), 'dom perignon', 20, 'contains'),
  (_cat('vini-spumanti'), 'veuve', 20, 'contains'),
  (_cat('vini-spumanti'), 'ruinart', 20, 'contains'),
  (_cat('vini-spumanti'), 'bollicine', 20, 'contains'),
  (_cat('vini-spumanti'), 'vendemmia', 20, 'contains'),
  (_cat('vini-spumanti'), 'barrique', 20, 'contains'),
  (_cat('vini-spumanti'), 'docg', 20, 'contains'),
  (_cat('vini-spumanti'), 'arneis', 20, 'contains'),
  (_cat('vini-spumanti'), 'barbaresco', 20, 'contains'),
  (_cat('vini-spumanti'), 'novacella', 20, 'contains'),
  (_cat('vini-spumanti'), 'kerner', 20, 'contains'),
  (_cat('vini-spumanti'), 'cortese', 20, 'contains'),
  (_cat('vini-spumanti'), 'dolcetto', 20, 'contains'),
  (_cat('vini-spumanti'), 'bonarda', 20, 'contains'),
  (_cat('vini-spumanti'), 'ripasso', 20, 'contains'),
  (_cat('vini-spumanti'), 'recioto', 20, 'contains'),
  (_cat('vini-spumanti'), 'passito', 20, 'contains'),
  (_cat('vini-spumanti'), 'marsala', 20, 'contains'),
  (_cat('vini-spumanti'), 'quintarelli', 20, 'contains'),
  (_cat('vini-spumanti'), 'sforzato', 20, 'contains'),
  (_cat('vini-spumanti'), 'brut', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'greco', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'asti', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'gavi', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'tai', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'blanc', 20, 'contains'),
  (_cat('vini-spumanti'), 'rouge', 20, 'contains'),
  (_cat('vini-spumanti'), 'cantina', 20, 'exact_word'),
  (_cat('vini-spumanti'), 'muller', 20, 'contains'),
  (_cat('vini-spumanti'), 'lacrima', 20, 'contains'),
  (_cat('vini-spumanti'), 'rondinella', 20, 'contains'),
  (_cat('vini-spumanti'), 'cuvee', 20, 'contains'),
  (_cat('vini-spumanti'), 'chateau', 20, 'contains');

-- ── BIRRE (priority 20) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('birre'), 'birra', 20, 'contains'),
  (_cat('birre'), 'beer', 20, 'contains'),
  (_cat('birre'), 'weiss', 20, 'contains'),
  (_cat('birre'), 'pilsner', 20, 'contains'),
  (_cat('birre'), 'stout', 20, 'contains'),
  (_cat('birre'), 'porter', 20, 'contains'),
  (_cat('birre'), 'peroni', 20, 'contains'),
  (_cat('birre'), 'moretti', 20, 'contains'),
  (_cat('birre'), 'heineken', 20, 'contains'),
  (_cat('birre'), 'beck', 20, 'contains'),
  (_cat('birre'), 'corona extra', 20, 'contains'),
  (_cat('birre'), 'ceres', 20, 'contains'),
  (_cat('birre'), 'ichnusa', 20, 'contains'),
  (_cat('birre'), 'nastro azzurro', 20, 'contains'),
  (_cat('birre'), 'leffe', 20, 'contains'),
  (_cat('birre'), 'hoegaarden', 20, 'contains'),
  (_cat('birre'), 'paulaner', 20, 'contains'),
  (_cat('birre'), 'franziskaner', 20, 'contains'),
  (_cat('birre'), 'warsteiner', 20, 'contains'),
  (_cat('birre'), 'budweiser', 20, 'contains'),
  (_cat('birre'), 'carlsberg', 20, 'contains'),
  (_cat('birre'), 'tuborg', 20, 'contains'),
  (_cat('birre'), 'guinness', 20, 'contains'),
  (_cat('birre'), 'tennent', 20, 'contains'),
  (_cat('birre'), 'doppio malto', 20, 'contains'),
  (_cat('birre'), 'craft beer', 20, 'contains'),
  (_cat('birre'), 'pale ale', 20, 'contains'),
  (_cat('birre'), 'amber ale', 20, 'contains'),
  (_cat('birre'), 'wheat beer', 20, 'contains'),
  (_cat('birre'), 'blanche', 20, 'contains'),
  (_cat('birre'), 'saison', 20, 'contains'),
  (_cat('birre'), 'bock', 20, 'contains'),
  (_cat('birre'), 'dunkel', 20, 'contains'),
  (_cat('birre'), 'helles', 20, 'contains'),
  (_cat('birre'), 'radler', 20, 'contains'),
  (_cat('birre'), 'shandy', 20, 'contains'),
  (_cat('birre'), 'lager', 20, 'exact_word'),
  (_cat('birre'), 'ale', 20, 'exact_word'),
  (_cat('birre'), 'ipa', 20, 'exact_word');

-- ── LIQUORI E DISTILLATI (priority 20) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('liquori-distillati'), 'liquor', 20, 'contains'),
  (_cat('liquori-distillati'), 'grappa', 20, 'contains'),
  (_cat('liquori-distillati'), 'whisky', 20, 'contains'),
  (_cat('liquori-distillati'), 'whiskey', 20, 'contains'),
  (_cat('liquori-distillati'), 'vodka', 20, 'contains'),
  (_cat('liquori-distillati'), 'brandy', 20, 'contains'),
  (_cat('liquori-distillati'), 'cognac', 20, 'contains'),
  (_cat('liquori-distillati'), 'limoncello', 20, 'contains'),
  (_cat('liquori-distillati'), 'sambuca', 20, 'contains'),
  (_cat('liquori-distillati'), 'nocino', 20, 'contains'),
  (_cat('liquori-distillati'), 'mirto', 20, 'contains'),
  (_cat('liquori-distillati'), 'assenzio', 20, 'contains'),
  (_cat('liquori-distillati'), 'tequila', 20, 'contains'),
  (_cat('liquori-distillati'), 'mezcal', 20, 'contains'),
  (_cat('liquori-distillati'), 'bourbon', 20, 'contains'),
  (_cat('liquori-distillati'), 'scotch', 20, 'contains'),
  (_cat('liquori-distillati'), 'aperol', 20, 'contains'),
  (_cat('liquori-distillati'), 'campari', 20, 'contains'),
  (_cat('liquori-distillati'), 'spritz', 20, 'contains'),
  (_cat('liquori-distillati'), 'cinzano', 20, 'contains'),
  (_cat('liquori-distillati'), 'fernet', 20, 'contains'),
  (_cat('liquori-distillati'), 'averna', 20, 'contains'),
  (_cat('liquori-distillati'), 'montenegro', 20, 'contains'),
  (_cat('liquori-distillati'), 'jager', 20, 'contains'),
  (_cat('liquori-distillati'), 'baileys', 20, 'contains'),
  (_cat('liquori-distillati'), 'kahlua', 20, 'contains'),
  (_cat('liquori-distillati'), 'cointreau', 20, 'contains'),
  (_cat('liquori-distillati'), 'grand marnier', 20, 'contains'),
  (_cat('liquori-distillati'), 'chartreuse', 20, 'contains'),
  (_cat('liquori-distillati'), 'cynar', 20, 'contains'),
  (_cat('liquori-distillati'), 'strega', 20, 'contains'),
  (_cat('liquori-distillati'), 'disaronno', 20, 'contains'),
  (_cat('liquori-distillati'), 'amaretto', 20, 'contains'),
  (_cat('liquori-distillati'), 'maraschino', 20, 'contains'),
  (_cat('liquori-distillati'), 'vermouth', 20, 'contains'),
  (_cat('liquori-distillati'), 'pastis', 20, 'contains'),
  (_cat('liquori-distillati'), 'ouzo', 20, 'contains'),
  (_cat('liquori-distillati'), 'calvados', 20, 'contains'),
  (_cat('liquori-distillati'), 'armagnac', 20, 'contains'),
  (_cat('liquori-distillati'), 'pisco', 20, 'contains'),
  (_cat('liquori-distillati'), 'sake', 20, 'contains'),
  (_cat('liquori-distillati'), 'hendrick', 20, 'contains'),
  (_cat('liquori-distillati'), 'tanqueray', 20, 'contains'),
  (_cat('liquori-distillati'), 'bombay', 20, 'contains'),
  (_cat('liquori-distillati'), 'beefeater', 20, 'contains'),
  (_cat('liquori-distillati'), 'bacardi', 20, 'contains'),
  (_cat('liquori-distillati'), 'havana club', 20, 'contains'),
  (_cat('liquori-distillati'), 'captain morgan', 20, 'contains'),
  (_cat('liquori-distillati'), 'jack daniel', 20, 'contains'),
  (_cat('liquori-distillati'), 'johnnie walker', 20, 'contains'),
  (_cat('liquori-distillati'), 'chivas', 20, 'contains'),
  (_cat('liquori-distillati'), 'jameson', 20, 'contains'),
  (_cat('liquori-distillati'), 'absolut', 20, 'contains'),
  (_cat('liquori-distillati'), 'belvedere', 20, 'contains'),
  (_cat('liquori-distillati'), 'grey goose', 20, 'contains'),
  (_cat('liquori-distillati'), 'smirnoff', 20, 'contains'),
  (_cat('liquori-distillati'), 'distillat', 20, 'contains'),
  (_cat('liquori-distillati'), 'gin', 20, 'exact_word'),
  (_cat('liquori-distillati'), 'rum', 20, 'exact_word'),
  (_cat('liquori-distillati'), 'amaro', 20, 'exact_word'),
  (_cat('liquori-distillati'), 'amari', 20, 'exact_word'),
  (_cat('liquori-distillati'), 'bitter', 20, 'exact_word'),
  (_cat('liquori-distillati'), 'martini', 20, 'exact_word');

-- ── CAFFE E TE (priority 22: before bevande) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('caffe-te'), 'caffe', 22, 'contains'),
  (_cat('caffe-te'), 'coffee', 22, 'contains'),
  (_cat('caffe-te'), 'espresso', 22, 'contains'),
  (_cat('caffe-te'), 'cappuccin', 22, 'contains'),
  (_cat('caffe-te'), 'moka', 22, 'contains'),
  (_cat('caffe-te'), 'latte macch', 22, 'contains'),
  (_cat('caffe-te'), 'nespresso', 22, 'contains'),
  (_cat('caffe-te'), 'lavazza', 22, 'contains'),
  (_cat('caffe-te'), 'kimbo', 22, 'contains'),
  (_cat('caffe-te'), 'borbone', 22, 'contains'),
  (_cat('caffe-te'), 'segafredo', 22, 'contains'),
  (_cat('caffe-te'), 'vergnano', 22, 'contains'),
  (_cat('caffe-te'), 'pellini', 22, 'contains'),
  (_cat('caffe-te'), 'corsini', 22, 'contains'),
  (_cat('caffe-te'), 'mokambo', 22, 'contains'),
  (_cat('caffe-te'), 'bialetti', 22, 'contains'),
  (_cat('caffe-te'), 'decaffein', 22, 'contains'),
  (_cat('caffe-te'), 'cialde', 22, 'contains'),
  (_cat('caffe-te'), 'capsula', 22, 'contains'),
  (_cat('caffe-te'), 'camomilla', 22, 'contains'),
  (_cat('caffe-te'), 'tisana', 22, 'contains'),
  (_cat('caffe-te'), 'orzo solub', 22, 'contains'),
  (_cat('caffe-te'), 'ginseng', 22, 'contains'),
  (_cat('caffe-te'), 'matcha', 22, 'contains'),
  (_cat('caffe-te'), 'oolong', 22, 'contains'),
  (_cat('caffe-te'), 'earl grey', 22, 'contains'),
  (_cat('caffe-te'), 'english breakfast', 22, 'contains'),
  (_cat('caffe-te'), 'sencha', 22, 'contains'),
  (_cat('caffe-te'), 'darjeeling', 22, 'contains'),
  (_cat('caffe-te'), 'ceylon', 22, 'contains'),
  (_cat('caffe-te'), 'dammann', 22, 'contains'),
  (_cat('caffe-te'), 'twinings', 22, 'contains'),
  (_cat('caffe-te'), 'illy', 22, 'exact_word'),
  (_cat('caffe-te'), 'the', 22, 'exact_word'),
  (_cat('caffe-te'), 'infuso', 22, 'contains'),
  (_cat('caffe-te'), 'infusi', 22, 'contains');

-- ── BEVANDE ANALCOLICHE (priority 25) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('bevande-analcoliche'), 'coca cola', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'pepsi', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'fanta', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'sprite', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'schweppes', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'san pellegrino', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'water', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'succo', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'juice', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'aranciata', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'limonata', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'chinotto', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'ginger', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'tonic', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'energy', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'redbull', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'red bull', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'monster', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'gatorade', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'powerade', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'estathe', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'bibita', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'bevanda', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'drink', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'soda', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'seltz', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'cedrata', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'crodino', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'sanbitter', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'lurisia', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'ferrarelle', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'levissima', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'evian', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'vitasnella', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'fiuggi', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'uliveto', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'rocchetta', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'sant''anna', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'guizza', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'norda', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'lilia', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'fonte', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'multivitamin', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'tamarindo', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'sciroppo', 25, 'contains'),
  (_cat('bevande-analcoliche'), 'acqua', 25, 'exact_word'),
  (_cat('bevande-analcoliche'), 'panna', 25, 'exact_word'),
  (_cat('bevande-analcoliche'), 'lete', 25, 'exact_word'),
  (_cat('bevande-analcoliche'), 'vera', 25, 'exact_word'),
  (_cat('bevande-analcoliche'), 'ace', 25, 'exact_word'),
  (_cat('bevande-analcoliche'), 'menta', 25, 'exact_word');

-- ── CARNE E SALUMI (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('carne-salumi'), 'manzo', 30, 'exact_word'),
  (_cat('carne-salumi'), 'carne', 30, 'exact_word'),
  (_cat('carne-salumi'), 'vitello', 30, 'contains'),
  (_cat('carne-salumi'), 'bovino', 30, 'contains'),
  (_cat('carne-salumi'), 'pollo', 30, 'contains'),
  (_cat('carne-salumi'), 'tacchino', 30, 'contains'),
  (_cat('carne-salumi'), 'maiale', 30, 'contains'),
  (_cat('carne-salumi'), 'suino', 30, 'contains'),
  (_cat('carne-salumi'), 'agnello', 30, 'contains'),
  (_cat('carne-salumi'), 'coniglio', 30, 'contains'),
  (_cat('carne-salumi'), 'anatra', 30, 'contains'),
  (_cat('carne-salumi'), 'quaglia', 30, 'contains'),
  (_cat('carne-salumi'), 'faraona', 30, 'contains'),
  (_cat('carne-salumi'), 'bresaola', 30, 'contains'),
  (_cat('carne-salumi'), 'prosciutt', 30, 'contains'),
  (_cat('carne-salumi'), 'salame', 30, 'contains'),
  (_cat('carne-salumi'), 'salumi', 30, 'contains'),
  (_cat('carne-salumi'), 'salsiccia', 30, 'contains'),
  (_cat('carne-salumi'), 'salsic', 30, 'contains'),
  (_cat('carne-salumi'), 'wurstel', 30, 'contains'),
  (_cat('carne-salumi'), 'mortadella', 30, 'contains'),
  (_cat('carne-salumi'), 'pancetta', 30, 'contains'),
  (_cat('carne-salumi'), 'guanciale', 30, 'contains'),
  (_cat('carne-salumi'), 'lardo', 30, 'contains'),
  (_cat('carne-salumi'), 'speck', 30, 'contains'),
  (_cat('carne-salumi'), 'lonza', 30, 'contains'),
  (_cat('carne-salumi'), 'cotechino', 30, 'contains'),
  (_cat('carne-salumi'), 'zampone', 30, 'contains'),
  (_cat('carne-salumi'), 'hamburger', 30, 'contains'),
  (_cat('carne-salumi'), 'burger', 30, 'contains'),
  (_cat('carne-salumi'), 'polpett', 30, 'contains'),
  (_cat('carne-salumi'), 'bistecca', 30, 'contains'),
  (_cat('carne-salumi'), 'fiorentina', 30, 'contains'),
  (_cat('carne-salumi'), 'tagliata', 30, 'contains'),
  (_cat('carne-salumi'), 'carpaccio', 30, 'contains'),
  (_cat('carne-salumi'), 'tartare', 30, 'contains'),
  (_cat('carne-salumi'), 'braciola', 30, 'contains'),
  (_cat('carne-salumi'), 'costata', 30, 'contains'),
  (_cat('carne-salumi'), 'filetto', 30, 'contains'),
  (_cat('carne-salumi'), 'lombata', 30, 'contains'),
  (_cat('carne-salumi'), 'scamone', 30, 'contains'),
  (_cat('carne-salumi'), 'girello', 30, 'contains'),
  (_cat('carne-salumi'), 'bacon', 30, 'contains'),
  (_cat('carne-salumi'), 'stinco', 30, 'contains'),
  (_cat('carne-salumi'), 'ossobuco', 30, 'contains'),
  (_cat('carne-salumi'), 'bollito', 30, 'contains'),
  (_cat('carne-salumi'), 'meat', 30, 'contains'),
  (_cat('carne-salumi'), 'kebab', 30, 'contains'),
  (_cat('carne-salumi'), 'wagyu', 30, 'contains'),
  (_cat('carne-salumi'), 'angus', 30, 'contains'),
  (_cat('carne-salumi'), 'chianina', 30, 'contains'),
  (_cat('carne-salumi'), 'scottona', 30, 'contains'),
  (_cat('carne-salumi'), 'entrecote', 30, 'contains'),
  (_cat('carne-salumi'), 'roast beef', 30, 'contains'),
  (_cat('carne-salumi'), 'paillard', 30, 'contains'),
  (_cat('carne-salumi'), 'straccetti', 30, 'contains'),
  (_cat('carne-salumi'), 'spezzatino', 30, 'contains'),
  (_cat('carne-salumi'), 'fegatini', 30, 'contains'),
  (_cat('carne-salumi'), 'trippa', 30, 'contains'),
  (_cat('carne-salumi'), 'cotoletta', 30, 'contains'),
  (_cat('carne-salumi'), 'cordon bleu', 30, 'contains'),
  (_cat('carne-salumi'), 'nuggets', 30, 'contains'),
  (_cat('carne-salumi'), 'chicken', 30, 'contains'),
  (_cat('carne-salumi'), 'nduja', 30, 'contains'),
  (_cat('carne-salumi'), 'capocollo', 30, 'contains'),
  (_cat('carne-salumi'), 'culatello', 30, 'contains'),
  (_cat('carne-salumi'), 'soppressa', 30, 'contains'),
  (_cat('carne-salumi'), 'coppa', 30, 'exact_word'),
  (_cat('carne-salumi'), 'fesa', 30, 'exact_word'),
  (_cat('carne-salumi'), 'petto', 30, 'exact_word'),
  (_cat('carne-salumi'), 'coscia', 30, 'exact_word'),
  (_cat('carne-salumi'), 'cotto', 30, 'exact_word'),
  (_cat('carne-salumi'), 'crudo', 30, 'exact_word');

-- ── PESCE E FRUTTI DI MARE (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('pesce-frutti-mare'), 'pesce', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'fish', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'salmone', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'tonno', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'merluzzo', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'baccal', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'orata', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'branzino', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'spigola', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'sogliola', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'trota', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'sardina', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'acciuga', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'gambero', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'gamber', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'scampo', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'aragosta', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'astice', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'polpo', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'calamaro', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'seppia', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'cozza', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'vongola', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'ostrica', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'granchio', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'surimi', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'pangasio', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'persico', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'halibut', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'cernia', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'dentice', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'ricciola', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'pesce spada', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'crostace', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'mollusc', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'fishburger', 30, 'contains'),
  (_cat('pesce-frutti-mare'), 'alice', 30, 'exact_word');

-- ── LATTICINI E FORMAGGI (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('latticini-formaggi'), 'latte', 30, 'exact_word'),
  (_cat('latticini-formaggi'), 'milk', 30, 'contains'),
  (_cat('latticini-formaggi'), 'formagg', 30, 'contains'),
  (_cat('latticini-formaggi'), 'cheese', 30, 'contains'),
  (_cat('latticini-formaggi'), 'mozzarell', 30, 'contains'),
  (_cat('latticini-formaggi'), 'burrata', 30, 'contains'),
  (_cat('latticini-formaggi'), 'ricotta', 30, 'contains'),
  (_cat('latticini-formaggi'), 'mascarpone', 30, 'contains'),
  (_cat('latticini-formaggi'), 'parmigian', 30, 'contains'),
  (_cat('latticini-formaggi'), 'grana padano', 30, 'contains'),
  (_cat('latticini-formaggi'), 'pecorino', 30, 'contains'),
  (_cat('latticini-formaggi'), 'gorgonzola', 30, 'contains'),
  (_cat('latticini-formaggi'), 'taleggio', 30, 'contains'),
  (_cat('latticini-formaggi'), 'fontina', 30, 'contains'),
  (_cat('latticini-formaggi'), 'asiago', 30, 'contains'),
  (_cat('latticini-formaggi'), 'provolone', 30, 'contains'),
  (_cat('latticini-formaggi'), 'emmental', 30, 'contains'),
  (_cat('latticini-formaggi'), 'gruyere', 30, 'contains'),
  (_cat('latticini-formaggi'), 'cheddar', 30, 'contains'),
  (_cat('latticini-formaggi'), 'camembert', 30, 'contains'),
  (_cat('latticini-formaggi'), 'roquefort', 30, 'contains'),
  (_cat('latticini-formaggi'), 'stilton', 30, 'contains'),
  (_cat('latticini-formaggi'), 'scamorza', 30, 'contains'),
  (_cat('latticini-formaggi'), 'caciocavallo', 30, 'contains'),
  (_cat('latticini-formaggi'), 'burro', 30, 'contains'),
  (_cat('latticini-formaggi'), 'butter', 30, 'contains'),
  (_cat('latticini-formaggi'), 'cream', 30, 'contains'),
  (_cat('latticini-formaggi'), 'yogurt', 30, 'contains'),
  (_cat('latticini-formaggi'), 'stracchino', 30, 'contains'),
  (_cat('latticini-formaggi'), 'squacquerone', 30, 'contains'),
  (_cat('latticini-formaggi'), 'robiola', 30, 'contains'),
  (_cat('latticini-formaggi'), 'crescenza', 30, 'contains'),
  (_cat('latticini-formaggi'), 'philadelphia', 30, 'contains'),
  (_cat('latticini-formaggi'), 'kefir', 30, 'contains'),
  (_cat('latticini-formaggi'), 'skyr', 30, 'contains'),
  (_cat('latticini-formaggi'), 'latticin', 30, 'contains'),
  (_cat('latticini-formaggi'), 'caseari', 30, 'contains'),
  (_cat('latticini-formaggi'), 'quartirolo', 30, 'contains'),
  (_cat('latticini-formaggi'), 'montasio', 30, 'contains'),
  (_cat('latticini-formaggi'), 'castelmagno', 30, 'contains'),
  (_cat('latticini-formaggi'), 'caciotta', 30, 'contains'),
  (_cat('latticini-formaggi'), 'primo sale', 30, 'contains'),
  (_cat('latticini-formaggi'), 'fior di latte', 30, 'contains'),
  (_cat('latticini-formaggi'), 'brie', 30, 'exact_word'),
  (_cat('latticini-formaggi'), 'panna', 30, 'exact_word'),
  (_cat('latticini-formaggi'), 'toma', 30, 'exact_word');

-- ── PASTA, RISO E CEREALI (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('pasta-riso-cereali'), 'spaghett', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'penne', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'fusilli', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'rigatoni', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'tagliatell', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'fettuccin', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'lasagn', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'gnocchi', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'ravioli', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'tortellini', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'tortelloni', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'cannelloni', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'paccheri', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'orecchiett', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'farfalle', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'conchiglie', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'maccheroni', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'bucatini', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'linguine', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'pappardelle', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'vermicelli', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'trofie', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'caserecce', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'strozzapreti', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'risotto', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'arborio', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'carnaroli', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'basmati', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'cereali', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'muesli', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'granola', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'farro', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'avena', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'quinoa', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'couscous', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'bulgur', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'polenta', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'semola', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'de cecco', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'barilla', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'rummo', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'voiello', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'garofalo', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'divella', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'molisana', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'giovanni rana', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'pastificio', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'noodle', 30, 'contains'),
  (_cat('pasta-riso-cereali'), 'pasta', 30, 'exact_word'),
  (_cat('pasta-riso-cereali'), 'riso', 30, 'exact_word'),
  (_cat('pasta-riso-cereali'), 'orzo', 30, 'exact_word');

-- ── PANE E PRODOTTI DA FORNO (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('pane-prodotti-forno'), 'panino', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'panini', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'grissino', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'grissini', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'cracker', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'fetta biscott', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'bruschett', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'focaccia', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'piadina', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'ciabatta', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'baguette', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'croissant', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'cornetto', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'brioche', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'muffin', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pancake', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'waffle', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'toast', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'tramezzin', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'crostino', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'tarallo', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'frisella', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pan carr', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pan bauletto', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pangrattat', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'lievito', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'sfoglia', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'salatini', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pretzel', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'bread', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'pane', 30, 'exact_word'),
  (_cat('pane-prodotti-forno'), 'farina', 30, 'exact_word'),
  (_cat('pane-prodotti-forno'), 'pizza', 30, 'contains'),
  (_cat('pane-prodotti-forno'), 'wrap', 30, 'exact_word'),
  (_cat('pane-prodotti-forno'), 'pita', 30, 'exact_word');

-- ── FRUTTA E VERDURA (priority 30) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('frutta-verdura'), 'frutta', 30, 'contains'),
  (_cat('frutta-verdura'), 'fruit', 30, 'contains'),
  (_cat('frutta-verdura'), 'banana', 30, 'contains'),
  (_cat('frutta-verdura'), 'arancia', 30, 'contains'),
  (_cat('frutta-verdura'), 'limone', 30, 'contains'),
  (_cat('frutta-verdura'), 'pompelmo', 30, 'contains'),
  (_cat('frutta-verdura'), 'mandarino', 30, 'contains'),
  (_cat('frutta-verdura'), 'clementina', 30, 'contains'),
  (_cat('frutta-verdura'), 'kiwi', 30, 'contains'),
  (_cat('frutta-verdura'), 'ananas', 30, 'contains'),
  (_cat('frutta-verdura'), 'mango', 30, 'contains'),
  (_cat('frutta-verdura'), 'papaya', 30, 'contains'),
  (_cat('frutta-verdura'), 'fragol', 30, 'contains'),
  (_cat('frutta-verdura'), 'ciliegia', 30, 'contains'),
  (_cat('frutta-verdura'), 'albicocc', 30, 'contains'),
  (_cat('frutta-verdura'), 'susina', 30, 'contains'),
  (_cat('frutta-verdura'), 'prugna', 30, 'contains'),
  (_cat('frutta-verdura'), 'melograno', 30, 'contains'),
  (_cat('frutta-verdura'), 'lampone', 30, 'contains'),
  (_cat('frutta-verdura'), 'mirtillo', 30, 'contains'),
  (_cat('frutta-verdura'), 'ribes', 30, 'contains'),
  (_cat('frutta-verdura'), 'dattero', 30, 'contains'),
  (_cat('frutta-verdura'), 'mandorla', 30, 'contains'),
  (_cat('frutta-verdura'), 'nocciola', 30, 'contains'),
  (_cat('frutta-verdura'), 'pistacchi', 30, 'contains'),
  (_cat('frutta-verdura'), 'castagna', 30, 'contains'),
  (_cat('frutta-verdura'), 'pinoli', 30, 'contains'),
  (_cat('frutta-verdura'), 'arachid', 30, 'contains'),
  (_cat('frutta-verdura'), 'verdur', 30, 'contains'),
  (_cat('frutta-verdura'), 'insalata', 30, 'contains'),
  (_cat('frutta-verdura'), 'lattuga', 30, 'contains'),
  (_cat('frutta-verdura'), 'rucola', 30, 'contains'),
  (_cat('frutta-verdura'), 'spinac', 30, 'contains'),
  (_cat('frutta-verdura'), 'bietola', 30, 'contains'),
  (_cat('frutta-verdura'), 'cicoria', 30, 'contains'),
  (_cat('frutta-verdura'), 'cavolo', 30, 'contains'),
  (_cat('frutta-verdura'), 'cavolfiore', 30, 'contains'),
  (_cat('frutta-verdura'), 'broccol', 30, 'contains'),
  (_cat('frutta-verdura'), 'verza', 30, 'contains'),
  (_cat('frutta-verdura'), 'carciofo', 30, 'contains'),
  (_cat('frutta-verdura'), 'asparag', 30, 'contains'),
  (_cat('frutta-verdura'), 'zucchina', 30, 'contains'),
  (_cat('frutta-verdura'), 'zucchine', 30, 'contains'),
  (_cat('frutta-verdura'), 'melanzana', 30, 'contains'),
  (_cat('frutta-verdura'), 'peperone', 30, 'contains'),
  (_cat('frutta-verdura'), 'peperoni', 30, 'contains'),
  (_cat('frutta-verdura'), 'pomodor', 30, 'contains'),
  (_cat('frutta-verdura'), 'tomat', 30, 'contains'),
  (_cat('frutta-verdura'), 'cipolla', 30, 'contains'),
  (_cat('frutta-verdura'), 'aglio', 30, 'contains'),
  (_cat('frutta-verdura'), 'porro', 30, 'contains'),
  (_cat('frutta-verdura'), 'sedano', 30, 'contains'),
  (_cat('frutta-verdura'), 'carota', 30, 'contains'),
  (_cat('frutta-verdura'), 'patata', 30, 'contains'),
  (_cat('frutta-verdura'), 'fungo', 30, 'contains'),
  (_cat('frutta-verdura'), 'funghi', 30, 'contains'),
  (_cat('frutta-verdura'), 'champignon', 30, 'contains'),
  (_cat('frutta-verdura'), 'porcini', 30, 'contains'),
  (_cat('frutta-verdura'), 'radicchio', 30, 'contains'),
  (_cat('frutta-verdura'), 'finocchio', 30, 'contains'),
  (_cat('frutta-verdura'), 'cetriolo', 30, 'contains'),
  (_cat('frutta-verdura'), 'fagiol', 30, 'contains'),
  (_cat('frutta-verdura'), 'pisell', 30, 'contains'),
  (_cat('frutta-verdura'), 'lenticch', 30, 'contains'),
  (_cat('frutta-verdura'), 'edamame', 30, 'contains'),
  (_cat('frutta-verdura'), 'olive', 30, 'contains'),
  (_cat('frutta-verdura'), 'oliva', 30, 'contains'),
  (_cat('frutta-verdura'), 'zucca', 30, 'contains'),
  (_cat('frutta-verdura'), 'friariell', 30, 'contains'),
  (_cat('frutta-verdura'), 'bieta', 30, 'contains'),
  (_cat('frutta-verdura'), 'mela', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'mele', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'pera', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'pere', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'cocco', 30, 'contains'),
  (_cat('frutta-verdura'), 'pesca', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'pesche', 30, 'contains'),
  (_cat('frutta-verdura'), 'uva', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'uvetta', 30, 'contains'),
  (_cat('frutta-verdura'), 'noce', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'noci', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'mora', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'more', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'fico', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'fichi', 30, 'contains'),
  (_cat('frutta-verdura'), 'cece', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'ceci', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'fava', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'fave', 30, 'exact_word'),
  (_cat('frutta-verdura'), 'soia', 30, 'contains');

-- ── CONDIMENTI E CONSERVE (priority 35) ──
INSERT INTO category_keywords (category_id, keyword, priority, match_type) VALUES
  (_cat('condimenti-conserve'), 'aceto', 35, 'contains'),
  (_cat('condimenti-conserve'), 'vinegar', 35, 'contains'),
  (_cat('condimenti-conserve'), 'senape', 35, 'contains'),
  (_cat('condimenti-conserve'), 'mustard', 35, 'contains'),
  (_cat('condimenti-conserve'), 'ketchup', 35, 'contains'),
  (_cat('condimenti-conserve'), 'maionese', 35, 'contains'),
  (_cat('condimenti-conserve'), 'mayonnaise', 35, 'contains'),
  (_cat('condimenti-conserve'), 'salsa', 35, 'contains'),
  (_cat('condimenti-conserve'), 'sauce', 35, 'contains'),
  (_cat('condimenti-conserve'), 'pesto', 35, 'contains'),
  (_cat('condimenti-conserve'), 'sugo', 35, 'contains'),
  (_cat('condimenti-conserve'), 'ragu', 35, 'contains'),
  (_cat('condimenti-conserve'), 'passata', 35, 'contains'),
  (_cat('condimenti-conserve'), 'pelati', 35, 'contains'),
  (_cat('condimenti-conserve'), 'concentrato', 35, 'contains'),
  (_cat('condimenti-conserve'), 'estratto', 35, 'contains'),
  (_cat('condimenti-conserve'), 'dado', 35, 'contains'),
  (_cat('condimenti-conserve'), 'brodo', 35, 'contains'),
  (_cat('condimenti-conserve'), 'stock', 35, 'contains'),
  (_cat('condimenti-conserve'), 'bouillon', 35, 'contains'),
  (_cat('condimenti-conserve'), 'capperi', 35, 'contains'),
  (_cat('condimenti-conserve'), 'sottaceti', 35, 'contains'),
  (_cat('condimenti-conserve'), 'sottoli', 35, 'contains'),
  (_cat('condimenti-conserve'), 'giardiniera', 35, 'contains'),
  (_cat('condimenti-conserve'), 'worcester', 35, 'contains'),
  (_cat('condimenti-conserve'), 'tabasco', 35, 'contains'),
  (_cat('condimenti-conserve'), 'curry', 35, 'contains'),
  (_cat('condimenti-conserve'), 'curcuma', 35, 'contains'),
  (_cat('condimenti-conserve'), 'paprika', 35, 'contains'),
  (_cat('condimenti-conserve'), 'origano', 35, 'contains'),
  (_cat('condimenti-conserve'), 'basilico', 35, 'contains'),
  (_cat('condimenti-conserve'), 'rosmarino', 35, 'contains'),
  (_cat('condimenti-conserve'), 'timo', 35, 'contains'),
  (_cat('condimenti-conserve'), 'prezzemolo', 35, 'contains'),
  (_cat('condimenti-conserve'), 'salvia', 35, 'contains'),
  (_cat('condimenti-conserve'), 'alloro', 35, 'contains'),
  (_cat('condimenti-conserve'), 'cannella', 35, 'contains'),
  (_cat('condimenti-conserve'), 'vaniglia', 35, 'contains'),
  (_cat('condimenti-conserve'), 'zafferano', 35, 'contains'),
  (_cat('condimenti-conserve'), 'cumino', 35, 'contains'),
  (_cat('condimenti-conserve'), 'coriandolo', 35, 'contains'),
  (_cat('condimenti-conserve'), 'zenzero', 35, 'contains'),
  (_cat('condimenti-conserve'), 'dressing', 35, 'contains'),
  (_cat('condimenti-conserve'), 'vinaigrette', 35, 'contains'),
  (_cat('condimenti-conserve'), 'olio', 35, 'exact_word'),
  (_cat('condimenti-conserve'), 'oil', 35, 'contains'),
  (_cat('condimenti-conserve'), 'sale', 35, 'exact_word'),
  (_cat('condimenti-conserve'), 'salt', 35, 'contains'),
  (_cat('condimenti-conserve'), 'pepe', 35, 'exact_word'),
  (_cat('condimenti-conserve'), 'pepper', 35, 'contains'),
  (_cat('condimenti-conserve'), 'spezia', 35, 'contains'),
  (_cat('condimenti-conserve'), 'spice', 35, 'contains');


-- ══════════════════════════════════════════════
-- 2. CLASSIFY PRODUCT FUNCTION
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION classify_product(p_description text)
RETURNS uuid
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  v_desc_lower text := lower(p_description);
  v_kw RECORD;
BEGIN
  FOR v_kw IN
    SELECT ck.category_id, ck.keyword, ck.match_type
    FROM category_keywords ck
    ORDER BY ck.priority ASC, ck.keyword ASC
  LOOP
    CASE v_kw.match_type
      WHEN 'exact_word' THEN
        -- Word boundary match (simulate \y with regex)
        IF v_desc_lower ~* ('\y' || v_kw.keyword || '\y') THEN
          RETURN v_kw.category_id;
        END IF;
      WHEN 'prefix' THEN
        IF v_desc_lower ~* ('\y' || v_kw.keyword) THEN
          RETURN v_kw.category_id;
        END IF;
      WHEN 'contains' THEN
        IF position(lower(v_kw.keyword) in v_desc_lower) > 0 THEN
          RETURN v_kw.category_id;
        END IF;
    END CASE;
  END LOOP;

  -- Fallback: "Altro"
  RETURN (SELECT id FROM categories WHERE slug = 'altro');
END;
$$;

-- Auto-classify trigger
CREATE OR REPLACE FUNCTION auto_classify_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Always reclassify when description changes or category is null
  IF NEW.category_id IS NULL OR TG_OP = 'INSERT' OR OLD.description IS DISTINCT FROM NEW.description THEN
    NEW.category_id := classify_product(NEW.description);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_classify ON products;
CREATE TRIGGER trg_auto_classify
  BEFORE INSERT OR UPDATE OF description ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_product();


-- ══════════════════════════════════════════════
-- 3. EMBEDDING CACHE TABLE (for AI agent)
-- ══════════════════════════════════════════════

CREATE TABLE embedding_cache (
  query_hash text PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_embcache_created ON embedding_cache(created_at);

-- No RLS needed: only accessed by service role in Edge Functions


-- ══════════════════════════════════════════════
-- 4. BACKFILL: reclassify all products
-- ══════════════════════════════════════════════

-- Temporarily disable the trigger (we'll bulk update)
ALTER TABLE products DISABLE TRIGGER trg_auto_classify;

UPDATE products SET category_id = classify_product(description);

ALTER TABLE products ENABLE TRIGGER trg_auto_classify;


-- ══════════════════════════════════════════════
-- 5. DROP DEAD SEARCH FUNCTIONS
-- ══════════════════════════════════════════════

-- These legacy functions are never called (superseded by search_products_hybrid)
DROP FUNCTION IF EXISTS search_products_fts(text, uuid, numeric, numeric, int);
DROP FUNCTION IF EXISTS search_products_fuzzy(text, real, int);
DROP FUNCTION IF EXISTS search_products_semantic(vector, uuid, numeric, numeric, float, int);

-- Drop the helper function (no longer needed)
DROP FUNCTION IF EXISTS _cat(text);
