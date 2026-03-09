-- MIGRATION 020: Reclassify all products with improved keyword patterns
-- Fixes:
--   1. "Manzoni" brand (dolci/gelati) incorrectly matching "manzo" → carne
--   2. ~20 meat products ending up in "Caffe e Te"
--   3. 2384 products (27%) stuck in "Altro"
--   4. "burger" without "ham" prefix not matching
--   5. Various missing keywords across all categories
--
-- Strategy:
--   - Reset ALL category_id to NULL
--   - Re-run classification with improved patterns
--   - Use word boundaries where needed to prevent partial matches
--   - Process categories in optimal order (most specific first)

-- Step 1: Reset all categories
UPDATE products SET category_id = NULL;

-- Step 2: Reclassify with improved patterns
-- ORDER MATTERS: first match wins (WHERE category_id IS NULL)

-- ══════════════════════════════════════════════════════════════
-- PULIZIA E MONOUSO (first: very specific keywords, no ambiguity)
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pulizia-monouso')
WHERE category_id IS NULL AND description ~* '(detersiv|detergent|sapone|soap|igienizz|sanific|disinfett|candeggina|bleach|ammorbid|brillant|sgrassat|anticalc|pulito|cleaner|spugna|sponge|panno |straccio|mop[^a-z]|scopa|paletta|sacchetto|busta |pellicola|alluminio|carta.*(forno|asciug|igien|cucina)|tovagliolo|napkin|piatto.*(carta|plast)|bicchier.*(carta|plast)|posata|forchetta|coltello|cucchiaio|cannuccia|straw|guanto|glove|cuffia|retina|grembiule|monouso|disposab|usa.*getta|wc |clor |tork |vaschett.*allum|pattumier|sottobicchier|velina|tovagliett|contenitor.*plast|rotolo.*cucina|sacco.*rifiut|lavastoviglie|lavapaviment|multiuso|sgrassatore)';

-- ══════════════════════════════════════════════════════════════
-- UOVA (very specific, process early to avoid "uovo" matching elsewhere)
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'uova')
WHERE category_id IS NULL AND description ~* '(^uov[aoe]|[^a-z]uov[aoe]|egg[s ]|\yuova\y|\yuovo\y|frittata|omelette|albume|tuorlo)';

-- ══════════════════════════════════════════════════════════════
-- VINI E SPUMANTI
-- Added: more grape varieties, Italian wine terms, "vino" with word boundaries
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'vini-spumanti')
WHERE category_id IS NULL AND description ~* '(\yvino\y|wine|chianti|barolo|brunello|prosecco|champagne|spumante|amarone|montepulciano|sangiovese|merlot|cabernet|pinot|chardonnay|sauvignon|vermentino|moscato|lambrusco|primitivo|nebbiolo|barbera|trebbiano|rosato|rosso (igt|doc|d\.o\.c)|bianco (igt|doc|d\.o\.c)|frascati|verdicchio|soave|bardolino|valpolicella|vernaccia|cannonau|nero d.avola|franciacorta|asti |brut[^a-z]|cava |ros[eé] |lugana|gewurz|riesling|grillo|fiano|greco |lacrima|falanghina|aglianico|refosco|corvina|rondinella|garganega|muller|tai |blanc|rouge|chablis|bordeaux|bourgogne|beaujolais|sancerre|cotes du|chateau|dom perignon|veuve|ruinart|bollicine|millesim|vendemmia|cantina |enoteca|sommelier|barrique|docg|vigneto|uvaggio|cuvee|quintarelli|abbona|arneis|barbaresco|novacella|kerner|gavi |cortese|dolcetto|grignolino|freisa|ruche|bonarda|buttafuoco|inferno|sassella|sforzato|ripasso|recioto|passito|marsala)';

-- ══════════════════════════════════════════════════════════════
-- BIRRE
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'birre')
WHERE category_id IS NULL AND description ~* '(birra|beer|\ylager\y|\yale\y|\yipa\y|weiss|pilsner|stout|porter|peroni|moretti|heineken|beck|corona extra|ceres|ichnusa|nastro azzurro|leffe|hoegaarden|paulaner|franziskaner|warsteiner|budweiser|carlsberg|tuborg|guinness|tennent|doppio malto|artigianale|craft beer|amber ale|pale ale|wheat beer|blanche|saison|bock|dunkel|helles|kolsch|marzen|radler|shandy)';

-- ══════════════════════════════════════════════════════════════
-- LIQUORI E DISTILLATI
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'liquori-distillati')
WHERE category_id IS NULL AND description ~* '(liquor|grappa|whisky|whiskey|vodka|\ygin\y|\yrum\y|brandy|cognac|amaro |amari |limoncello|sambuca|nocino|mirto|assenzio|tequila|mezcal|bourbon|scotch|aperol|campari|spritz|martini |cinzano|fernet|averna|montenegro|jager|baileys|kahlua|cointreau|grand marnier|drambuie|chartreuse|cynar|strega|disaronno|amaretto|maraschino|\ybitter\y|vermouth|pastis|ouzo|calvados|armagnac|pisco|sake|hendrick|tanqueray|bombay|beefeater|bacardi|havana club|captain morgan|jack daniel|johnnie walker|chivas|jameson|absolut|belvedere|grey goose|smirnoff|distillat)';

-- ══════════════════════════════════════════════════════════════
-- CAFFE E TE (before bevande-analcoliche to catch tea/coffee first)
-- Removed "the " and "tea " which are too greedy — use more specific patterns
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'caffe-te')
WHERE category_id IS NULL AND description ~* '(caff[eè]|coffee|espresso|cappuccin|moka|latte macch|nespresso|lavazza|\yilly\y|kimbo|borbone|segafredo|vergnano|pellini|corsini|mokambo|bialetti|decaffein|ciald[ae]|capsula|t[eè] [a-z]|tea [a-z]|\ythe\y|infus[io]|camomilla|tisana|orzo solub|ginseng|matcha|oolong|earl grey|english breakfast|sencha|darjeeling|ceylon|dammann|twinings)';

-- ══════════════════════════════════════════════════════════════
-- BEVANDE ANALCOLICHE
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'bevande-analcoliche')
WHERE category_id IS NULL AND description ~* '(coca.col|pepsi|fanta|sprite|schweppes|san pellegrino|acqua |water|succo|juice|aranciata|limonata|chinotto|ginger|tonic|energy|redbull|red bull|monster|gatorade|powerade|estath[eè]|bibita|bevanda|drink|soda|seltz|cedrata|crodino|sanbitter|lurisia|ferrarelle|levissima|panna |evian|vitasnella|fiuggi|uliveto|rocchetta|lete |vera |sant.anna|guizza|norda|lilia|fonte|\d+ frutti|ace |multivitamin|pompelmo rosa|menta |tamarindo|sciroppo)';

-- ══════════════════════════════════════════════════════════════
-- DOLCI E PASTICCERIA (BEFORE carne — catches "Manzoni" brand)
-- "manzoni" is a bakery/pastry brand, must be caught here before
-- the "manzo" pattern in carne-salumi creates false positives
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'dolci-pasticceria')
WHERE category_id IS NULL AND description ~* '(manzoni|dolce|dessert|torta|cake|gelato|ice.cream|sorbetto|biscott|cookie|cioccolat|chocol|cacao|crem[ae] |budino|panna.cotta|tiramisu|profiterol|mousse|meringh|macaron|tartufo dolce|cannolo|sfogliatella|bab[aà]|pastiera|colomba|panettone|pandoro|pralin|fondente|gianduja|zucchero|sugar|miele |honey|marmellata|jam |confettura|wafer|nutella|crema.*nocc|glassa|topping|granella|candito|amaretti|pasticceri|ciambellone|crostata|plumcake|plum cake|cake |crostatina|merendina)';

-- ══════════════════════════════════════════════════════════════
-- CARNE E SALUMI
-- Added: "burger" standalone, word boundary on "manzo" to avoid "Manzoni"
-- Added: more cuts, preparations, brands
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'carne-salumi')
WHERE category_id IS NULL AND description ~* '(\ymanzo\y|vitello|bovino|pollo|tacchino|maiale|suino|agnello|coniglio|anatra|quaglia|faraona|piccione|bresaola|prosciutt|salame|salumi|salsiccia|wurstel|mortadella|coppa |pancetta|guanciale|lardo|speck|lonza|cotechino|zampone|hamburger|burger|polpett|arrost[oi]|bistecca|fiorentina|tagliata|carpaccio|tartare|braciola|costata|filetto|lombata|scamone|girello|fesa |sottofesa|petto |coscia|aletta|bacon|stinco|ossobuco|bollito|\ycarne\y|meat|salsic|kebab|pulled|wagyu|angus|chianina|fassona|scottona|black angus|kobe|t.bone|rib.eye|entrecote|roast beef|paillard|straccetti|bocconcini|spezzatino|fegatini|animelle|trippa|cotoletta|cordon bleu|nuggets|wings|crocchett.*poll|chicken|poultry|salamin|soppressa|nduja|ventricina|capocollo|culatello|fiocco|praga|cotto |crudo )';

-- ══════════════════════════════════════════════════════════════
-- PESCE E FRUTTI DI MARE
-- Added: "fishburger" and fish-specific terms
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pesce-frutti-mare')
WHERE category_id IS NULL AND description ~* '(pesce|fish|salmone|tonno|merluzzo|baccal|orata|branzino|spigola|sogliola|trota|sardina|acciuga|alice |gambero|gamber|scampo|aragosta|astice|polpo|calamaro|seppia|cozza|vongola|ostrica|riccio|granchio|surimi|pangasio|persico|halibut|cernia|dentice|sarago|ricciola|pesce spada|rana pesc|trancia|crostace|mollusc|frutti.*(mare|di mare)|fishburger|fish burger|bastoncin.*pesce|filetto.*mare)';

-- ══════════════════════════════════════════════════════════════
-- LATTICINI E FORMAGGI
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'latticini-formaggi')
WHERE category_id IS NULL AND description ~* '(\ylatte\y|milk|formagg|cheese|mozzarell|burrata|ricotta|mascarpone|parmigian|grana padano|pecorino|gorgonzola|taleggio|fontina|asiago|provolone|emmental|gruyere|cheddar|brie |camembert|roquefort|stilton|scamorza|caciocavallo|burro|butter|panna |cream|yogurt|stracchino|squacquerone|robiola|crescenza|philadelphia|kefir|skyr|latticin|caseari|quartirolo|montasio|raschera|toma |tome |castelmagno|puzzone|ubriaco|piave |vezzena|spressa|caciotta|primo sale|fior di latte)';

-- ══════════════════════════════════════════════════════════════
-- PASTA, RISO E CEREALI
-- Added: brand names (De Cecco, Barilla, Rummo, etc.), more formats
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pasta-riso-cereali')
WHERE category_id IS NULL AND description ~* '(pasta |spaghett|penne|fusilli|rigatoni|tagliatell|fettuccin|lasagn|gnocchi|ravioli|tortellini|tortelloni|cannelloni|paccheri|orecchiett|farfalle|conchiglie|maccheroni|bucatini|linguine|pappardelle|vermicelli|capellini|bavette|trofie|caserecce|strozzapreti|maltagliati|garganelli|mezze maniche|riso |risotto|arborio|carnaroli|basmati|jasmine|cereali|corn.flake|muesli|granola|farro|orzo |avena|quinoa|cous.?cous|bulgur|polenta|semola|semolino|couscous|de cecco|barilla|rummo|voiello|garofalo|divella|molisana|delverde|agnesi|buitoni|giovanni rana|pastificio|mezze penne|penne lisce|penne rigate|sedani|ditali|tubetti|anellini|stelline|tempestina|pastina|noodle)';

-- ══════════════════════════════════════════════════════════════
-- PANE E PRODOTTI DA FORNO
-- Added: more bakery items
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pane-prodotti-forno')
WHERE category_id IS NULL AND description ~* '(pane |bread|panino|panini|grissino|grissini|cracker|fetta biscott|bruschett|focaccia|piadina|ciabatta|baguette|croissant|cornetto|brioche|muffin|pancake|waffle|toast|tramezzin|crostino|tarallo|frisella|pan carr|pan bauletto|pan grattug|pangrattat|lievito|farina |flour|impast|pizz[ae]|base.*pizz|sfoglia|vol.au.vent|salatini|schiacciat|pretzel|wrap |pita |naan |chapati|hamburger.*pane|pane.*hamburger)';

-- ══════════════════════════════════════════════════════════════
-- FRUTTA E VERDURA
-- Added: more produce items
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'frutta-verdura')
WHERE category_id IS NULL AND description ~* '(frutta|fruit|mela |mele |pera |pere |banana|arancia|arancio|limone|pompelmo|mandarino|clementina|kiwi|ananas|mango|papaya|cocco|fragol|ciliegia|pesca |pesche|albicocc|susina|prugna|fico |fichi |melograno|cachi|nespola|lampone|mirtillo|ribes|mora |more |uva |uvetta|sultanin|dattero|mandorla|noce |noci |nocciola|pistacchi|castagna|pinoli|arachid|verdur|vegetab|insalata|lattuga|rucola|spinac|bietola|catalogna|cicoria|cavolo|cavolfiore|broccol|verza|cappuccio|carciofo|asparag|zucchina|zucchine|melanzana|peperone|peperoni|pomodor|tomat|cipolla|aglio|porro|sedano|carota|patata|fungo|funghi|champignon|porcini|radicchio|finocchio|cetriolo|ravanello|barbabieto|fagiol|pisell|lenticch|cece |ceci |fava |fave |soia|edamame|olive|oliva|cipollott|rapanell|zucca|cavolo nero|cime.*rapa|friariell|broccoletti|bieta)';

-- ══════════════════════════════════════════════════════════════
-- CONDIMENTI E CONSERVE
-- Added: more sauces, dressings, pantry items
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'condimenti-conserve')
WHERE category_id IS NULL AND description ~* '(olio |oil|aceto|vinegar|sale |salt|pepe |pepper|spezia|spice|senape|mustard|ketchup|maionese|mayonnaise|salsa|sauce|pesto|sugo|rag[uù]|passata|pelati|polpa.*pomodor|concentrato|estratto|dado|brodo|stock|bouillon|capperi|olive.*tavola|sottaceti|sottoli|giardiniera|worcester|tabasco|soy sauce|salsa.*soia|curry|curcuma|paprika|origano|basilico|rosmarino|timo|prezzemolo|maggiorana|salvia|alloro|cannella|cinnamon|vaniglia|vanilla|noce.*moscat|zafferano|chiodi.*garofano|anice|cumino|coriandolo|zenzero|ginger|dressing|vinaigrette|glaze|riduzione|crema.*balsamic)';

-- ══════════════════════════════════════════════════════════════
-- FALLBACK: remaining → "Altro"
-- ══════════════════════════════════════════════════════════════
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'altro')
WHERE category_id IS NULL;
