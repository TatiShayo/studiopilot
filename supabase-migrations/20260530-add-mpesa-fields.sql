ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_phone text DEFAULT '';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_ref text DEFAULT '';
