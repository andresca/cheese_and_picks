-- Back-office data (providers, ingredients with prices and stock, recipes, costing settings)
-- as a single JSONB document, edited from the admin "Operations" tab.
CREATE TABLE IF NOT EXISTS ops (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
