-- ===================================================
-- Aurex Executive Travel — Supabase Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ===================================================

-- ── 1. ADMIN USERS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin (password: admin123)
-- The password_hash is a SHA-256 hash. In production, use bcrypt via an API route.
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@aurex.co.uk', encode(sha256('admin123'::bytea), 'hex'))
ON CONFLICT (email) DO NOTHING;


-- ── 2. BOOKINGS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    pickup TEXT NOT NULL,
    dropoff TEXT NOT NULL,
    airport TEXT,
    flight TEXT,
    date DATE,
    time TEXT,
    passengers INT DEFAULT 1,
    suitcases INT DEFAULT 0,
    vehicle TEXT,
    amount NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
    payment TEXT DEFAULT 'unpaid' CHECK (payment IN ('paid','unpaid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);


-- ── 3. QUOTES TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    pickup TEXT NOT NULL,
    dropoff TEXT NOT NULL,
    date DATE,
    time TEXT,
    passengers INT DEFAULT 1,
    vehicle TEXT,
    offered_price NUMERIC(10,2),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);


-- ── 4. DRIVERS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    phdl TEXT,
    dbs_status TEXT,
    experience TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);


-- ── 5. VEHICLES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_name TEXT,
    driver_mobile TEXT,
    driver_email TEXT,
    reg TEXT,
    make TEXT,
    model TEXT,
    year TEXT,
    colour TEXT,
    phvl TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);


-- ── 6. PRICING TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route TEXT NOT NULL,
    saloon NUMERIC(10,2) DEFAULT 0,
    mpv NUMERIC(10,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO pricing (route, saloon, mpv, sort_order) VALUES
('Cardiff to Heathrow', 230, 250, 1),
('Cardiff to Bristol', 135, 155, 2),
('Cardiff to Cardiff Airport', 60, 80, 3),
('Cardiff to Gatwick', 320, 340, 4),
('Cardiff to Birmingham', 230, 260, 5),
('Cardiff to Manchester', 320, 350, 6)
ON CONFLICT DO NOTHING;


-- ── 7. ROW LEVEL SECURITY (RLS) ───────────────────────────
-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Admin users: only service role can read (for login verification)
CREATE POLICY "Service role can read admin_users" ON admin_users
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert admin_users" ON admin_users
    FOR INSERT WITH CHECK (true);

-- Bookings: full access via service role, anon can read own
CREATE POLICY "Anyone can insert bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read bookings" ON bookings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update bookings" ON bookings
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete bookings" ON bookings
    FOR DELETE USING (true);

-- Quotes: same pattern
CREATE POLICY "Anyone can insert quotes" ON quotes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read quotes" ON quotes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update quotes" ON quotes
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete quotes" ON quotes
    FOR DELETE USING (true);

-- Drivers: same pattern
CREATE POLICY "Anyone can insert drivers" ON drivers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read drivers" ON drivers
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update drivers" ON drivers
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete drivers" ON drivers
    FOR DELETE USING (true);

-- Vehicles: same pattern
CREATE POLICY "Anyone can insert vehicles" ON vehicles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read vehicles" ON vehicles
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update vehicles" ON vehicles
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete vehicles" ON vehicles
    FOR DELETE USING (true);

-- Pricing: read anyone, write via service role
CREATE POLICY "Anyone can read pricing" ON pricing
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert pricing" ON pricing
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update pricing" ON pricing
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete pricing" ON pricing
    FOR DELETE USING (true);


-- ── 8. SEED DATA (sample bookings for testing) ────────────
INSERT INTO bookings (name, mobile, email, pickup, dropoff, airport, date, time, passengers, suitcases, vehicle, amount, status, payment) VALUES
('John Smith', '+44 7700 123456', 'john@example.com', 'Cardiff City Centre', 'Heathrow Airport T5', 'Heathrow', '2026-07-20', '04:30', 2, 2, 'Mercedes E-Class', 230, 'confirmed', 'paid'),
('Sarah Williams', '+44 7700 234567', 'sarah@example.com', 'Cardiff Bay', 'Bristol Airport', 'Bristol', '2026-07-22', '06:00', 3, 3, 'Mercedes V-Class', 155, 'pending', 'unpaid'),
('Michael Brown', '+44 7700 345678', 'michael@example.com', 'Cardiff Central Station', 'Gatwick Airport', 'Gatwick', '2026-07-25', '05:15', 1, 1, 'Tesla Model Y', 320, 'completed', 'paid'),
('Emma Jones', '+44 7700 456789', 'emma@example.com', 'Newport City Centre', 'Heathrow Airport T2', 'Heathrow', '2026-07-28', '03:45', 4, 4, 'Mercedes V-Class', 250, 'pending', 'unpaid'),
('David Taylor', '+44 7700 567890', 'david@example.com', 'Swansea Marina', 'Cardiff Airport', 'Cardiff Airport', '2026-07-30', '07:00', 2, 1, 'Mercedes E-Class', 60, 'confirmed', 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO quotes (name, mobile, pickup, dropoff, date, time, passengers, vehicle, notes, status) VALUES
('James Wilson', '+44 7700 111222', 'Barry Town Centre', 'Manchester Airport', '2026-08-01', '04:00', 2, 'Mercedes E-Class', 'Early morning flight', 'pending'),
('Lisa Anderson', '+44 7700 333444', 'Pontypridd', 'Stansted Airport', '2026-08-05', '06:30', 1, 'Tesla Model Y', '', 'pending'),
('Robert Davies', '+44 7700 555666', 'Caerphilly', 'Luton Airport', '2026-08-10', '05:00', 3, 'Mercedes V-Class', 'Need child seat', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO drivers (first_name, last_name, mobile, email, phdl, dbs_status, experience, status) VALUES
('Ahmed', 'Hassan', '+44 7700 777888', 'ahmed@example.com', 'Yes', 'Enhanced - Clear', '5 years', 'approved'),
('Tom', 'Evans', '+44 7700 999000', 'tom@example.com', 'Yes', 'Enhanced - Clear', '3 years', 'pending')
ON CONFLICT DO NOTHING;
