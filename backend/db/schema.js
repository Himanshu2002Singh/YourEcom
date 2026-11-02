// Every table, as SQL that is safe to run again and again. The API runs it once per process,
// just before its first query (db/pool.js), so a deploy that adds tables needs no manual step.
// `npm run db:setup` runs it by hand and also creates the database itself.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(254) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  session_version INT        NOT NULL DEFAULT 0,      -- goes up with each password change, ending older sessions
  sms_updates   BOOLEAN      NOT NULL DEFAULT TRUE,   -- preferences.smsUpdates
  offers        BOOLEAN      NOT NULL DEFAULT TRUE,   -- preferences.offers
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP   -- its year is memberSince
);

-- The catalogue. Prices are whole rupees. Orders keep their own copy of what they need.
-- Sizes of one product share a family (its name on the storefront) and differ by variant.
CREATE TABLE IF NOT EXISTS products (
  id          INT           NOT NULL PRIMARY KEY,
  name        VARCHAR(200)  NOT NULL,
  category    VARCHAR(60)   NOT NULL,   -- one of CATEGORIES in validators/product.validator.js
  family      VARCHAR(120)  NULL,       -- e.g. 'Disposable Syringe without Needle', shared by its sizes
  variant     VARCHAR(40)   NULL,       -- e.g. '2 ml', what sets this size apart within the family
  price       INT           NOT NULL,
  mrp         INT           NULL,       -- the printed MRP, shown struck through beside the price
  unit        VARCHAR(60)   NOT NULL,   -- what one item is, e.g. 'Box of 50'
  stock       INT           NOT NULL,   -- items left; orders take from it and cancelling puts back
  badge       VARCHAR(40)   NULL,
  image       VARCHAR(500)  NOT NULL,
  gallery     JSON          NULL,       -- more photos after image, as a list
  description VARCHAR(1000) NOT NULL,
  features    JSON          NOT NULL    -- short selling points, as a list
);

-- Databases made before family, variant, mrp and gallery existed get those columns here.
SET @add_columns := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'mrp') = 0,
  'ALTER TABLE products ADD COLUMN family VARCHAR(120) NULL, ADD COLUMN variant VARCHAR(40) NULL, ADD COLUMN mrp INT NULL, ADD COLUMN gallery JSON NULL',
  'DO 0');
PREPARE add_columns FROM @add_columns;
EXECUTE add_columns;
DEALLOCATE PREPARE add_columns;

-- The storefront's products; the frontend loads them from GET /api/products. Photos are the client's own
-- (frontend/public/photos). Prices and MRPs are placeholders until the client's price list, except the MRPs
-- printed on the scalp vein set (₹80 each) and infusion set (₹250 each) packs.
-- There is no admin screen yet, so this list is the catalogue: every start writes it over the rows with the
-- same id. Stock is left alone, because orders and cancellations change it.
INSERT INTO products (id, name, category, family, variant, price, mrp, unit, stock, badge, image, gallery, description, features) VALUES
  (1, '3-Ply Surgical Face Mask, ISI Marked', 'Face Masks', NULL, NULL, 249, 450, 'Box of 50', 240, 'ISI marked',
   '/photos/mask-isi-class2.jpg', '["/photos/mask-isi-class1.jpg", "/photos/kit-isi-mask.jpg"]',
   'ISI-marked 3-ply surgical masks made to IS 16289:2014, with a soft inner layer, a filter layer and a fluid-resistant outer layer.',
   '["ISI marked, IS 16289:2014", "3-layer protection", "Nose wire for a close fit"]'),
  (2, 'Nitrile Examination Gloves, Blue', 'Gloves', 'Nitrile Examination Gloves', 'Blue', 549, 900, 'Box of 100', 180, NULL,
   '/photos/nitrile-gloves-blue.jpg', '["/photos/gloves-latex-nitrile.jpg"]',
   'Powder-free blue nitrile gloves for examinations and procedures, with a snug fit and good grip. Latex-free, so they suit latex-sensitive hands.',
   '["Powder-free", "Latex-free nitrile", "Textured fingertips"]'),
  (3, 'Disposable Syringe without Needle, 2 ml', 'Syringes', 'Disposable Syringe without Needle', '2 ml', 280, 500, 'Box of 100', 150, 'Bestseller',
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile, single-use 2 ml syringes supplied without a needle, so you can fit the needle you need. Clear barrel, bold markings and a smooth plunger.',
   '["Supplied without needle", "Clear barrel, bold markings", "Individually packed, sterile"]'),
  (4, 'IV Infusion Set', 'IV Sets', NULL, NULL, 899, 2500, 'Pack of 10', 8, NULL,
   '/photos/infusion-set-pack.jpg', '["/photos/infusion-set.jpg", "/photos/infusion-sets.jpg"]',
   'Gravity-feed IV infusion sets with a spike, drip chamber with filter, roller clamp, injection site and needle. Sterile and ready to use.',
   '["20 drops = 1 ml ± 0.1 ml", "Roller clamp flow control", "Sterile (EO), as per IS 12655"]'),
  (5, 'Gauze Roller Bandage', 'Bandages & Gauze', NULL, NULL, 299, 480, 'Pack of 10', 120, NULL,
   '/photos/gauze-roller-bandage.jpg', '["/photos/roller-bandage-pack.jpg", "/photos/gauze-roll-pack.jpg"]',
   'Absorbent cotton gauze rolled into bandages and wrapped in paper, for dressing wounds and holding dressings in place.',
   '["Absorbent cotton gauze", "Paper-wrapped rolls", "For hospitals and clinics"]'),
  (6, 'Adhesive Bandage Strips', 'Bandages & Gauze', NULL, NULL, 179, 300, 'Pack of 50', 300, NULL,
   '/photos/adhesive-bandage.jpg', '[]',
   'Fabric adhesive strips for small cuts and grazes, with an absorbent pad and a skin-friendly adhesive.',
   '["Flexible fabric backing", "Absorbent wound pad", "Skin-friendly adhesive"]'),
  (7, 'Disposable Syringe without Needle, 3 ml', 'Syringes', 'Disposable Syringe without Needle', '3 ml', 320, 550, 'Box of 100', 140, NULL,
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile, single-use 3 ml syringes supplied without a needle, so you can fit the needle you need. Clear barrel, bold markings and a smooth plunger.',
   '["Supplied without needle", "Clear barrel, bold markings", "Individually packed, sterile"]'),
  (8, 'Disposable Syringe without Needle, 5 ml', 'Syringes', 'Disposable Syringe without Needle', '5 ml', 390, 650, 'Box of 100', 200, NULL,
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile, single-use 5 ml syringes supplied without a needle, for injections and drawing up medicines.',
   '["Supplied without needle", "Smooth-gliding plunger", "Individually packed, sterile"]'),
  (9, 'Disposable Syringe without Needle, 10 ml', 'Syringes', 'Disposable Syringe without Needle', '10 ml', 620, 1000, 'Box of 100', 120, NULL,
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile, single-use 10 ml syringes supplied without a needle, for larger doses, flushing and dilution.',
   '["Supplied without needle", "Smooth-gliding plunger", "Individually packed, sterile"]'),
  (10, 'Disposable Syringe without Needle, 20 ml', 'Syringes', 'Disposable Syringe without Needle', '20 ml', 490, 800, 'Box of 50', 80, NULL,
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile, single-use 20 ml syringes supplied without a needle, for irrigation, flushing and larger volumes.',
   '["Supplied without needle", "Large, easy-read markings", "Individually packed, sterile"]'),
  (11, 'Disposable Syringe without Needle, 50 ml', 'Syringes', 'Disposable Syringe without Needle', '50 ml', 750, 1250, 'Box of 25', 40, NULL,
   '/photos/syringe-without-needle.jpg', '[]',
   'Sterile 50 ml syringes supplied without a needle, for syringe pumps, feeding and irrigation.',
   '["Supplied without needle", "Large, easy-read markings", "Individually packed, sterile"]'),
  (12, 'Disposable Syringe with Needle, 2 ml', 'Syringes', 'Disposable Syringe with Needle', '2 ml', 300, 520, 'Box of 100', 150, NULL,
   '/photos/syringe-with-needle.jpg', '[]',
   'Sterile, single-use 2 ml syringes with a capped needle already fitted, for routine injections.',
   '["Needle fitted and capped", "Clear barrel, bold markings", "Individually packed, sterile"]'),
  (13, 'Disposable Syringe with Needle, 3 ml', 'Syringes', 'Disposable Syringe with Needle', '3 ml', 340, 560, 'Box of 100', 140, NULL,
   '/photos/syringe-with-needle.jpg', '[]',
   'Sterile, single-use 3 ml syringes with a capped needle already fitted, a common size for clinics and dispensaries.',
   '["Needle fitted and capped", "Clear barrel, bold markings", "Individually packed, sterile"]'),
  (14, 'Disposable Syringe with Needle, 5 ml', 'Syringes', 'Disposable Syringe with Needle', '5 ml', 410, 700, 'Box of 100', 200, NULL,
   '/photos/syringe-with-needle.jpg', '[]',
   'Sterile, single-use 5 ml syringes with a capped needle already fitted, for injections and drawing up medicines.',
   '["Needle fitted and capped", "Smooth-gliding plunger", "Individually packed, sterile"]'),
  (15, 'Disposable Syringe with Needle, 10 ml', 'Syringes', 'Disposable Syringe with Needle', '10 ml', 640, 1050, 'Box of 100', 120, NULL,
   '/photos/syringe-10ml-with-needle.jpg', '["/photos/syringe-10ml-pack.jpg", "/photos/syringe-with-needle.jpg"]',
   'Sterile, non-toxic, non-pyrogenic 3-piece 10 ml syringes with a capped needle already fitted.',
   '["3-piece syringe", "Needle fitted and capped", "Sterile, non-toxic, non-pyrogenic"]'),
  (16, 'Coloured Disposable Syringes', 'Syringes', NULL, NULL, 450, 750, 'Pack of 100', 60, NULL,
   '/photos/coloured-syringes.jpg', '[]',
   'Syringes with coloured plungers in blue, green, grey, orange and pink, so different medicines or uses are easy to tell apart.',
   '["5 plunger colours", "Clear, marked barrel", "Single use"]'),
  (17, 'IV Cannula with Injection Port, 18G (Green)', 'IV Cannula', 'IV Cannula with Injection Port', '18G (Green)', 220, 600, 'Pack of 10', 100, NULL,
   '/photos/iv-cannula.jpg', '[]',
   'Sterile, single-use IV cannula with wings and a capped injection port, colour-coded by size. This is the 18G (green).',
   '["Colour-coded by size", "Wings and injection port", "Individually packed, sterile"]'),
  (18, 'IV Cannula with Injection Port, 20G (Pink)', 'IV Cannula', 'IV Cannula with Injection Port', '20G (Pink)', 220, 600, 'Pack of 10', 100, NULL,
   '/photos/iv-cannula.jpg', '[]',
   'Sterile, single-use IV cannula with wings and a capped injection port, colour-coded by size. This is the 20G (pink).',
   '["Colour-coded by size", "Wings and injection port", "Individually packed, sterile"]'),
  (19, 'IV Cannula with Injection Port, 22G (Blue)', 'IV Cannula', 'IV Cannula with Injection Port', '22G (Blue)', 220, 600, 'Pack of 10', 100, NULL,
   '/photos/iv-cannula.jpg', '[]',
   'Sterile, single-use IV cannula with wings and a capped injection port, colour-coded by size. This is the 22G (blue).',
   '["Colour-coded by size", "Wings and injection port", "Individually packed, sterile"]'),
  (20, 'IV Cannula with Injection Port, 24G (Yellow)', 'IV Cannula', 'IV Cannula with Injection Port', '24G (Yellow)', 230, 600, 'Pack of 10', 100, NULL,
   '/photos/iv-cannula.jpg', '[]',
   'Sterile, single-use IV cannula with wings and a capped injection port, colour-coded by size. This is the 24G (yellow).',
   '["Colour-coded by size", "Wings and injection port", "Individually packed, sterile"]'),
  (21, 'IV Cannula with Injection Port, 26G (Violet)', 'IV Cannula', 'IV Cannula with Injection Port', '26G (Violet)', 240, 650, 'Pack of 10', 60, NULL,
   '/photos/iv-cannula.jpg', '[]',
   'Sterile, single-use IV cannula with wings and a capped injection port, colour-coded by size. This is the 26G (violet).',
   '["Colour-coded by size", "Wings and injection port", "Individually packed, sterile"]'),
  (22, 'Scalp Vein Set, 20G', 'IV Sets', 'Scalp Vein Set', '20G', 280, 800, 'Pack of 10', 150, NULL,
   '/photos/scalp-vein-set.jpg', '[]',
   'Sterile scalp vein sets with a winged needle and flexible tubing, for short infusions and blood sampling.',
   '["Non-toxic, non-pyrogenic", "Sterile (EO), single use", "MRP ₹80 per set"]'),
  (23, 'Scalp Vein Set, 21G', 'IV Sets', 'Scalp Vein Set', '21G', 280, 800, 'Pack of 10', 150, NULL,
   '/photos/scalp-vein-set.jpg', '[]',
   'Sterile scalp vein sets with a winged needle and flexible tubing, for short infusions and blood sampling.',
   '["Non-toxic, non-pyrogenic", "Sterile (EO), single use", "MRP ₹80 per set"]'),
  (24, 'Scalp Vein Set, 22G', 'IV Sets', 'Scalp Vein Set', '22G', 280, 800, 'Pack of 10', 150, NULL,
   '/photos/scalp-vein-set.jpg', '[]',
   'Sterile scalp vein sets with a winged needle and flexible tubing, for short infusions and blood sampling.',
   '["Non-toxic, non-pyrogenic", "Sterile (EO), single use", "MRP ₹80 per set"]'),
  (25, 'Latex Examination Gloves', 'Gloves', NULL, NULL, 449, 750, 'Box of 100', 200, NULL,
   '/photos/latex-gloves.jpg', '["/photos/gloves-latex-nitrile.jpg"]',
   'Natural latex examination gloves with a close, elastic fit and good touch sensitivity, for clinics, labs and hospitals.',
   '["Natural rubber latex", "Close, elastic fit", "Good touch sensitivity"]'),
  (26, 'Nitrile Examination Gloves, Black', 'Gloves', 'Nitrile Examination Gloves', 'Black', 599, 950, 'Box of 100', 120, NULL,
   '/photos/nitrile-gloves-black.jpg', '[]',
   'Powder-free black nitrile gloves for clinics, labs and other work where a strong, latex-free glove is needed.',
   '["Powder-free", "Latex-free nitrile", "Textured fingertips"]'),
  (27, '3-Ply Earloop Face Mask', 'Face Masks', NULL, NULL, 149, 300, 'Box of 50', 400, NULL,
   '/photos/kit-earloop-mask.jpg', '["/photos/ppe-kit.jpg"]',
   'Everyday 3-ply disposable masks with soft ear loops, for clinics, pharmacies and general use. Not ISI marked.',
   '["3-layer non-woven", "Soft ear loops", "Light and breathable"]'),
  (28, 'Bouffant Cap, Non-Woven', 'Caps & Shoe Covers', NULL, NULL, 199, 350, 'Pack of 100', 300, NULL,
   '/photos/bouffant-cap.jpg', '["/photos/bouffant-cap-strip.jpg", "/photos/kit-bouffant-cap.jpg"]',
   'Light, breathable non-woven bouffant caps with an elastic edge that keeps hair covered in theatres, wards and labs.',
   '["Elastic edge", "Breathable non-woven", "One size fits most"]'),
  (29, 'Surgeon Cap with Elastic Back', 'Caps & Shoe Covers', NULL, NULL, 249, 450, 'Pack of 100', 200, NULL,
   '/photos/surgeon-cap.jpg', '["/photos/kit-surgeon-cap.jpg"]',
   'Non-woven surgeon caps held close at the back by an elastic band, for operating theatres and procedures.',
   '["Elastic back", "Breathable non-woven", "Single use"]'),
  (30, 'Disposable Shoe Cover, Plastic (PE)', 'Caps & Shoe Covers', 'Disposable Shoe Cover', 'Plastic (PE)', 199, 350, 'Pack of 100', 300, NULL,
   '/photos/shoe-cover-pe.jpg', '["/photos/shoe-covers.jpg", "/photos/kit-shoe-cover-pe.jpg"]',
   'Waterproof plastic (PE) shoe covers with an elastic opening, for wards, labs and clean areas.',
   '["Waterproof PE", "Elastic opening", "One size fits most"]'),
  (31, 'Disposable Shoe Cover, Non-Woven', 'Caps & Shoe Covers', 'Disposable Shoe Cover', 'Non-woven', 299, 500, 'Pack of 100', 250, NULL,
   '/photos/shoe-cover-non-woven.jpg', '["/photos/shoe-covers.jpg", "/photos/kit-shoe-cover-nw.jpg"]',
   'Breathable non-woven fabric shoe covers with an elastic opening, comfortable for longer wear in theatres and clean rooms.',
   '["Breathable fabric", "Elastic opening", "One size fits most"]'),
  (32, 'EDTA K2 Blood Collection Tube', 'Lab Disposables', NULL, NULL, 650, 1100, 'Tray of 100', 80, NULL,
   '/photos/edta-tubes.jpg', '[]',
   'Purple-top EDTA K2 tubes for whole-blood tests such as a CBC, with a label to write patient details on.',
   '["EDTA K2, purple top", "Label for patient details", "Tray of 100"]'),
  (33, 'Vacuum Blood Collection Tubes', 'Lab Disposables', NULL, NULL, 900, 1500, 'Box of 100', 60, NULL,
   '/photos/vacuum-tubes.jpg', '[]',
   'Vacuum blood collection tubes for clean, measured draws, with caps colour-coded for different tests.',
   '["Vacuum tubes", "Colour-coded caps", "Made in India"]'),
  (34, 'Sample Culture Bottle, 30 ml', 'Lab Disposables', NULL, NULL, 299, 500, 'Pack of 100', 300, NULL,
   '/photos/sample-container.jpg', '[]',
   'Disposable 30 ml screw-cap bottles for urine and other samples, with volume marks and a label for patient details.',
   '["30 ml with volume marks", "Screw cap", "Label for patient details"]')
AS seed ON DUPLICATE KEY UPDATE
  name = seed.name, category = seed.category, family = seed.family, variant = seed.variant, price = seed.price, mrp = seed.mrp,
  unit = seed.unit, badge = seed.badge, image = seed.image, gallery = seed.gallery, description = seed.description, features = seed.features;

-- What a customer bought. Items and totals are copied when the order is placed, so later
-- price changes never rewrite an old order.
CREATE TABLE IF NOT EXISTS orders (
  id             CHAR(10)                       NOT NULL PRIMARY KEY,   -- order number: 'YE' + 8 digits
  user_id        CHAR(36)                       NOT NULL,
  items          JSON                           NOT NULL,   -- [{ id, name, price, unit, image, quantity }]
  subtotal       INT                            NOT NULL,
  discount       INT                            NOT NULL DEFAULT 0,   -- what coupon_code took off the subtotal
  coupon_code    VARCHAR(30)                    NULL,
  delivery_fee   INT                            NOT NULL,
  total          INT                            NOT NULL,   -- subtotal - discount + delivery_fee
  delivery       JSON                           NOT NULL,   -- { name, phone, address, city, pincode }
  payment_method ENUM('online', 'cod')          NOT NULL,
  status         ENUM('Processing', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Processing',
  placed_at      TIMESTAMP(6)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),   -- microseconds keep "newest first" exact
  INDEX orders_by_user (user_id, placed_at),
  CONSTRAINT orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Discount codes for the checkout. Each customer can use a code once; a cancelled order gives
-- it back. To retire a code, set active to FALSE (orders keep their own copy of the code).
CREATE TABLE IF NOT EXISTS coupons (
  code             VARCHAR(30)              NOT NULL PRIMARY KEY,   -- upper-case letters and digits
  kind             ENUM('percent', 'flat')  NOT NULL,
  amount           INT                      NOT NULL,   -- the percentage off, or the rupees off
  max_discount     INT                      NULL,       -- the most a percent coupon takes off
  min_subtotal     INT                      NOT NULL DEFAULT 0,
  first_order_only BOOLEAN                  NOT NULL DEFAULT FALSE,
  expires_at       TIMESTAMP                NULL,       -- NULL never expires
  active           BOOLEAN                  NOT NULL DEFAULT TRUE
);

-- The launch offers. Rows that already exist are left alone.
INSERT IGNORE INTO coupons (code, kind, amount, max_discount, min_subtotal, first_order_only) VALUES
  ('WELCOME10', 'percent', 10, 250,  0,    TRUE),
  ('SAVE100',   'flat',    100, NULL, 1000, FALSE),
  ('BULK15',    'percent', 15, 1500, 5000, FALSE);

-- One-time links for customers who forgot their password. Only a hash of each link's token is
-- kept, so these rows alone can't be used to reset anyone's password.
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash CHAR(64)  NOT NULL PRIMARY KEY,   -- SHA-256 (hex) of the token in the emailed link
  user_id    CHAR(36)  NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT password_resets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Products each customer saved for later.
CREATE TABLE IF NOT EXISTS wishlist (
  user_id    CHAR(36)     NOT NULL,
  product_id INT          NOT NULL,
  added_at   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT wishlist_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- Star ratings from customers who ordered the product: one per customer and product.
CREATE TABLE IF NOT EXISTS reviews (
  user_id    CHAR(36)      NOT NULL,
  product_id INT           NOT NULL,
  rating     TINYINT       NOT NULL,   -- 1 to 5 stars
  comment    VARCHAR(1000) NOT NULL,   -- may be empty
  created_at TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, product_id),
  INDEX reviews_by_product (product_id, created_at),
  CONSTRAINT reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
`;
