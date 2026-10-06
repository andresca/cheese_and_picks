-- Last accepted TOTP time step, so each one-time code can be used only once.
CREATE TABLE IF NOT EXISTS admin_totp (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_counter BIGINT NOT NULL
);
