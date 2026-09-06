-- ============================================================
-- AUREX EXECUTIVE TRAVEL — Supabase Database Schema
-- Run this ENTIRE file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,

  -- Licence info
  phdl_number TEXT,
  phdl_expiry DATE,
  dbs_status TEXT,
  dbs_date DATE,

  -- Experience
  experience_years INTEGER,
  experience_notes TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,

  -- Documents (Supabase storage URLs)
  doc_dvla_licence TEXT,
  doc_bank_statement TEXT,
  doc_check_code TEXT,
  doc_phdl TEXT,
  doc_profile_photo TEXT,

  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

  registration TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  colour TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('saloon', 'mpv')),

  -- Licensing
  phvl_number TEXT,
  phvl_expiry DATE,
  mot_expiry DATE,
  insurance_expiry DATE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,

  -- Documents
  doc_insurance_schedule TEXT,
  doc_phvl TEXT,
  doc_v5c TEXT,
  doc_insurance_cert TEXT,
  doc_inspection TEXT,

  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Journey details
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lon DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lon DOUBLE PRECISION,

  -- Trip info
  travel_date DATE NOT NULL,
  travel_time TIME,
  flight_number TEXT,
  trip_type TEXT DEFAULT 'one_way' CHECK (trip_type IN ('one_way', 'return')),
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('saloon', 'mpv')),
  passengers INTEGER DEFAULT 1,

  -- Pricing
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  distance_miles INTEGER,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'bank_transfer', 'invoice')),
  stripe_session_id TEXT,

  -- Driver assignment
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Notes
  admin_notes TEXT,
  customer_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  travel_date DATE,
  travel_time TIME,
  passengers INTEGER DEFAULT 1,
  vehicle_type TEXT CHECK (vehicle_type IN ('saloon', 'mpv')),

  offered_price DECIMAL(10,2),
  our_price DECIMAL(10,2),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'expired')),
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. FIXED PRICES
-- ============================================================
CREATE TABLE IF NOT EXISTS fixed_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  saloon_price DECIMAL(10,2) NOT NULL,
  mpv_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(origin, destination)
);

-- ============================================================
-- 8. CONTACT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. CORPORATE ENQUIRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS corporate_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  journeys_per_month INTEGER,
  requirements TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'active', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_fixed_prices_active ON fixed_prices(is_active);

-- ============================================================
-- SEED DATA: Fixed Prices (from current hardcoded prices)
-- ============================================================
INSERT INTO fixed_prices (origin, destination, saloon_price, mpv_price, display_order) VALUES
  ('cardiff', 'heathrow', 230, 250, 1),
  ('cardiff', 'bristol', 135, 155, 2),
  ('cardiff', 'cardiff airport', 60, 80, 3),
  ('cardiff', 'gatwick', 320, 340, 4),
  ('cardiff', 'birmingham', 230, 260, 5),
  ('cardiff', 'manchester', 320, 350, 6),
  ('cardiff', 'stansted', 350, 380, 7),
  ('cardiff', 'luton', 300, 330, 8)
ON CONFLICT (origin, destination) DO NOTHING;

-- ============================================================
-- SEED DATA: Default Admin User
-- Password: aurex2026 (bcrypt hash)
-- Change this password after first login!
-- ============================================================
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
  ('admin@aurexexecutivetravel.co.uk', '$2b$10$pEFvZwIFUyvgoM1kwfxFTuh7cwLHLDvhsLCIZw/m5yUGD./3X6iK2', 'Aurex Admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables but keep policies permissive for now
-- since all real logic is in server-side API routes.
-- ============================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anon to INSERT on public submission tables only
CREATE POLICY "Allow anon insert on customers" ON customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on bookings" ON bookings
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on quotes" ON quotes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on drivers" ON drivers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on vehicles" ON vehicles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on contact_messages" ON contact_messages
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert on corporate_enquiries" ON corporate_enquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anon to read active fixed_prices (for fare calculation)
CREATE POLICY "Allow anon read active prices" ON fixed_prices
  FOR SELECT TO anon USING (is_active = true);

-- Service role bypass (admin API routes use service_role key)
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON customers
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON drivers
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON vehicles
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON bookings
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON quotes
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON fixed_prices
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON contact_messages
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access" ON corporate_enquiries
  FOR ALL TO service_role USING (true);
