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
CREATE TABLE IF NOT EXISTS products (
  id          INT           NOT NULL PRIMARY KEY,
  name        VARCHAR(200)  NOT NULL,
  category    VARCHAR(60)   NOT NULL,   -- one of CATEGORIES in validators/product.validator.js
  price       INT           NOT NULL,
  unit        VARCHAR(60)   NOT NULL,   -- what one item is, e.g. 'Box of 50'
  stock       INT           NOT NULL,   -- items left; orders take from it and cancelling puts back
  badge       VARCHAR(40)   NULL,
  image       VARCHAR(500)  NOT NULL,
  description VARCHAR(1000) NOT NULL,
  features    JSON          NOT NULL    -- short selling points, as a list
);

-- The storefront's products; the frontend loads them from GET /api/products. Rows that already exist are left alone.
-- Syringes are the client's main line: one product per size. Prices and specs are placeholders until the client's price list.
INSERT IGNORE INTO products (id, name, category, price, unit, stock, badge, image, description, features) VALUES
  (1, '3-Ply Protective Face Masks', 'Face Masks', 249, 'Box of 50', 240, 'Best seller',
   'https://images.pexels.com/photos/9502813/pexels-photo-9502813.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Comfortable, breathable and dependable protection for everyday use in clinics, hospitals and at home.',
   '["3-layer filtration", "Soft elastic ear loops", "Non-woven breathable fabric"]'),
  (2, 'Nitrile Examination Gloves', 'Gloves', 549, 'Box of 100', 180, 'Popular',
   'https://images.pexels.com/photos/7856715/pexels-photo-7856715.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Powder-free nitrile gloves designed for a secure fit, excellent dexterity and hygienic everyday protection.',
   '["Powder-free finish", "Latex-free material", "Textured fingertips"]'),
  (3, '2 ml Disposable Syringe with Needle', 'Syringes', 280, 'Box of 100', 150, NULL,
   'https://images.pexels.com/photos/7722564/pexels-photo-7722564.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use 2 ml syringes with a 24G needle fitted, for routine intramuscular and subcutaneous injections.',
   '["24G × 25 mm needle fitted", "Clear barrel, bold markings", "Individually blister packed"]'),
  (4, 'IV Administration Set', 'IV Sets', 899, 'Pack of 25', 8, 'New',
   'https://images.pexels.com/photos/6191530/pexels-photo-6191530.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'High-quality administration sets for dependable fluid delivery and easy clinical handling.',
   '["Leak-resistant connectors", "Sterile and ready to use", "Smooth flow chamber"]'),
  (5, 'Premium Cotton Gauze Rolls', 'Gauze & Cotton', 299, 'Pack of 12', 120, NULL,
   'https://images.pexels.com/photos/5721552/pexels-photo-5721552.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Soft, absorbent gauze rolls for cleaning, dressing and everyday first-aid care.',
   '["Highly absorbent cotton", "Soft skin-friendly weave", "Easy tear roll format"]'),
  (6, 'Elastic Adhesive Bandages', 'Bandages', 179, 'Pack of 50', 300, NULL,
   'https://images.pexels.com/photos/7722845/pexels-photo-7722845.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Reliable adhesive bandages for small cuts, scrapes and daily first-aid kits.',
   '["Flexible fabric backing", "Secure skin-friendly adhesive", "Individual hygienic wraps"]'),
  (7, '3 ml Disposable Syringe with Needle', 'Syringes', 320, 'Box of 100', 140, NULL,
   'https://images.pexels.com/photos/7722558/pexels-photo-7722558.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use 3 ml syringes with a 23G needle fitted, a common size for clinics and dispensaries.',
   '["23G × 25 mm needle fitted", "Clear barrel, bold markings", "Individually blister packed"]'),
  (8, '5 ml Disposable Syringe with Needle', 'Syringes', 390, 'Box of 100', 200, NULL,
   'https://images.pexels.com/photos/7722569/pexels-photo-7722569.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use 5 ml syringes with a 23G needle fitted, for injections and drawing up medicines.',
   '["23G × 25 mm needle fitted", "Smooth-gliding plunger", "Individually blister packed"]'),
  (9, '10 ml Disposable Syringe with Needle', 'Syringes', 620, 'Box of 100', 120, NULL,
   'https://images.pexels.com/photos/7722554/pexels-photo-7722554.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use 10 ml syringes with a 22G needle fitted, for larger doses, flushing and dilution.',
   '["22G × 38 mm needle fitted", "Smooth-gliding plunger", "Individually blister packed"]'),
  (10, '20 ml Disposable Syringe with Needle', 'Syringes', 490, 'Box of 50', 80, NULL,
   'https://images.pexels.com/photos/7723202/pexels-photo-7723202.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use 20 ml syringes with a 21G needle fitted, for irrigation, flushing and larger volumes.',
   '["21G × 38 mm needle fitted", "Large, easy-read markings", "Individually blister packed"]'),
  (11, '50 ml Disposable Syringe, Luer Lock', 'Syringes', 750, 'Box of 25', 40, NULL,
   'https://images.pexels.com/photos/24032781/pexels-photo-24032781.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile 50 ml syringes with a luer lock tip, for syringe pumps, feeding and irrigation. Supplied without a needle.',
   '["Luer lock tip", "Fits common syringe pumps", "Individually blister packed"]'),
  (12, '1 ml Insulin Syringe, U-100', 'Syringes', 690, 'Box of 100', 90, NULL,
   'https://images.pexels.com/photos/15754963/pexels-photo-15754963.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile 1 ml insulin syringes marked in U-100 units, with a fine 30G needle fixed to the barrel for comfortable injections.',
   '["U-100 unit markings", "30G × 8 mm fixed needle", "Low dead space"]'),
  (13, '0.5 ml Auto-Disable Syringe', 'Syringes', 420, 'Box of 100', 100, 'Govt. supply',
   'https://images.pexels.com/photos/7722598/pexels-photo-7722598.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Auto-disable syringes that lock after a single use and cannot be refilled, as used in immunisation programmes.',
   '["Locks after one use", "23G × 25 mm needle fitted", "For immunisation drives"]'),
  (14, 'Hypodermic Needles, 24G', 'Needles', 140, 'Box of 100', 160, NULL,
   'https://images.pexels.com/photos/4074691/pexels-photo-4074691.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile hypodermic needles with a colour-coded hub, to fit any luer slip or luer lock syringe.',
   '["24G × 25 mm", "Colour-coded hub", "Luer slip and lock fit"]');

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
