-- Marka adı yazımı: "Öztunç" -> "Öztunc" (mevcut kayıtlardaki metinler)
UPDATE "SiteSettings" SET
  "businessName" = replace(replace("businessName", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "heroTitle"    = replace(replace("heroTitle", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "heroText"     = replace(replace("heroText", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "serviceTitle" = replace(replace("serviceTitle", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "serviceText"  = replace(replace("serviceText", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "aboutTitle"   = replace(replace("aboutTitle", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "aboutText"    = replace(replace("aboutText", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC');

UPDATE "Page" SET
  "title" = replace(replace("title", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "body"  = replace(replace("body", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC');

UPDATE "SeoEntry" SET
  "title"       = replace(replace("title", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC'),
  "description" = replace(replace("description", 'Öztunç', 'Öztunc'), 'ÖZTUNÇ', 'ÖZTUNC');

UPDATE "Media" SET "alt" = replace("alt", 'Öztunç', 'Öztunc') WHERE "alt" LIKE '%Öztunç%';
