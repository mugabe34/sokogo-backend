-- BULLETPROOF Supabase SQL Schema for Sokogo Classifieds Application
-- This schema addresses all possible errors and edge cases
-- Run this script in your Supabase SQL editor

-- =====================================================
-- 0. CLEANUP (Remove existing objects if they exist)
-- =====================================================

-- Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;
DROP POLICY IF EXISTS "items_select_active" ON items;
DROP POLICY IF EXISTS "items_select_own" ON items;
DROP POLICY IF EXISTS "items_insert_own" ON items;
DROP POLICY IF EXISTS "items_update_own" ON items;
DROP POLICY IF EXISTS "items_delete_own" ON items;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For additional security functions

-- =====================================================
-- 2. USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM("firstName")) > 0),
    "lastName" VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM("lastName")) > 0),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
        LENGTH(TRIM(email)) > 0
    ),
    "phoneNumber" VARCHAR(20) CHECK (
        "phoneNumber" IS NULL OR 
        (LENGTH(TRIM("phoneNumber")) >= 10 AND "phoneNumber" ~ '^[+]?[0-9\s\-\(\)]+$')
    ),
    password VARCHAR(255) NOT NULL CHECK (LENGTH(password) >= 6),
    role VARCHAR(50) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. ITEMS TABLE
-- =====================================================

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) > 0),
    category VARCHAR(50) NOT NULL CHECK (category IN ('MOTORS', 'PROPERTY', 'ELECTRONICS')),
    subcategory VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(subcategory)) > 0),
    price DECIMAL(12,2) NOT NULL CHECK (price > 0 AND price < 999999999999.99),
    currency VARCHAR(10) DEFAULT 'Frw' CHECK (LENGTH(TRIM(currency)) > 0),
    district VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(district)) > 0),
    city VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(city)) > 0),
    address TEXT,
    images JSONB DEFAULT '[]'::jsonb NOT NULL CHECK (jsonb_typeof(images) = 'array'),
    seller UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED')
    ),
    features JSONB DEFAULT '{}'::jsonb NOT NULL CHECK (jsonb_typeof(features) = 'object'),
    "contactInfo" JSONB DEFAULT '{}'::jsonb NOT NULL CHECK (jsonb_typeof("contactInfo") = 'object'),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. INDEXES (Performance Optimization)
-- =====================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- Items table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_seller ON items(seller);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_price ON items(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_location ON items(district, city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_created_at ON items("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_features ON items USING GIN (features);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_images ON items USING GIN (images);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_category_status ON items(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_seller_status ON items(seller, status);

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the updatedAt field exists and update it
    IF TG_TABLE_NAME = 'users' THEN
        NEW."updatedAt" = NOW();
    ELSIF TG_TABLE_NAME = 'items' THEN
        NEW."updatedAt" = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) - SAFE POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies (Safe - No Recursion)
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_registration" ON users
    FOR INSERT WITH CHECK (true);

-- Items RLS Policies (Safe - No Recursion)
CREATE POLICY "items_select_active" ON items
    FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "items_select_own" ON items
    FOR SELECT USING (seller = auth.uid());

CREATE POLICY "items_insert_own" ON items
    FOR INSERT WITH CHECK (seller = auth.uid());

CREATE POLICY "items_update_own" ON items
    FOR UPDATE USING (seller = auth.uid())
    WITH CHECK (seller = auth.uid());

CREATE POLICY "items_delete_own" ON items
    FOR DELETE USING (seller = auth.uid());

-- =====================================================
-- 7. HELPFUL VIEWS (Optional)
-- =====================================================

-- View for active items with seller info
CREATE OR REPLACE VIEW active_items_with_seller AS
SELECT
    i.id,
    i.title,
    i.description,
    i.category,
    i.subcategory,
    i.price,
    i.currency,
    i.district,
    i.city,
    i.address,
    i.images,
    i.status,
    i.features,
    i."contactInfo",
    i."createdAt",
    i."updatedAt",
    u."firstName" as seller_first_name,
    u."lastName" as seller_last_name,
    u.email as seller_email
FROM items i
JOIN users u ON i.seller = u.id
WHERE i.status = 'ACTIVE';

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'items')
ORDER BY table_name;

-- Verify indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('users', 'items')
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('users', 'items')
ORDER BY tablename, policyname;
