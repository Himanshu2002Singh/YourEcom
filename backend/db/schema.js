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

-- The storefront's six products; the frontend loads them from GET /api/products. Rows that already exist are left alone.
INSERT IGNORE INTO products (id, name, category, price, unit, stock, badge, image, description, features) VALUES
  (1, '3-Ply Protective Face Masks', 'Face Masks', 249, 'Box of 50', 240, 'Best seller',
   'https://images.pexels.com/photos/9502813/pexels-photo-9502813.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Comfortable, breathable and dependable protection for everyday use in clinics, hospitals and at home.',
   '["3-layer filtration", "Soft elastic ear loops", "Non-woven breathable fabric"]'),
  (2, 'Nitrile Examination Gloves', 'Gloves', 549, 'Box of 100', 180, 'Popular',
   'https://images.pexels.com/photos/7856715/pexels-photo-7856715.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Powder-free nitrile gloves designed for a secure fit, excellent dexterity and hygienic everyday protection.',
   '["Powder-free finish", "Latex-free material", "Textured fingertips"]'),
  (3, 'Sterile Disposable Syringes', 'Syringes', 399, 'Pack of 100', 150, NULL,
   'https://images.pexels.com/photos/7722564/pexels-photo-7722564.jpeg?auto=compress&cs=tinysrgb&w=1000',
   'Sterile, single-use syringes made for accurate and reliable administration in professional settings.',
   '["Individually packed", "Clear barrel markings", "Single-use sterile pack"]'),
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
   '["Flexible fabric backing", "Secure skin-friendly adhesive", "Individual hygienic wraps"]');

-- What a customer bought. Items and totals are copied when the order is placed, so later
-- price changes never rewrite an old order.
CREATE TABLE IF NOT EXISTS orders (
  id             CHAR(10)                       NOT NULL PRIMARY KEY,   -- order number: 'YE' + 8 digits
  user_id        CHAR(36)                       NOT NULL,
  items          JSON                           NOT NULL,   -- [{ id, name, price, unit, image, quantity }]
  subtotal       INT                            NOT NULL,
  delivery_fee   INT                            NOT NULL,
  total          INT                            NOT NULL,
  delivery       JSON                           NOT NULL,   -- { name, phone, address, city, pincode }
  payment_method ENUM('online', 'cod')          NOT NULL,
  status         ENUM('Processing', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Processing',
  placed_at      TIMESTAMP(6)                   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),   -- microseconds keep "newest first" exact
  INDEX orders_by_user (user_id, placed_at),
  CONSTRAINT orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
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
