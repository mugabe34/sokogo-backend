-- Complete Supabase SQL Schema for Sokogo Classifieds Application
-- Run this script in your Supabase SQL editor to set up the complete database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "phoneNumber" VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'buyer',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ITEMS TABLE
-- =====================================================

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'Frw',
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    seller UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    features JSONB DEFAULT '{}'::jsonb,
    "contactInfo" JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Items table indexes
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_seller ON items(seller);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_items_location ON items(district, city);
CREATE INDEX idx_items_created_at ON items("createdAt");
CREATE INDEX idx_items_features ON items USING GIN (features);

-- =====================================================
-- 4. CONSTRAINTS
-- =====================================================

-- Users constraints
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT check_user_role_values 
    CHECK (role IN ('buyer', 'seller', 'admin'));

-- Items constraints
ALTER TABLE items ADD CONSTRAINT check_category_values 
    CHECK (category IN ('MOTORS', 'PROPERTY', 'ELECTRONICS'));
ALTER TABLE items ADD CONSTRAINT check_status_values 
    CHECK (status IN ('ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED'));
ALTER TABLE items ADD CONSTRAINT check_price_positive 
    CHECK (price > 0);

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Items RLS Policies
CREATE POLICY "Anyone can view active items" ON items
    FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Users can view own items" ON items
    FOR SELECT USING (seller = auth.uid());

CREATE POLICY "Users can create items" ON items
    FOR INSERT WITH CHECK (seller = auth.uid());

CREATE POLICY "Users can update own items" ON items
    FOR UPDATE USING (seller = auth.uid())
    WITH CHECK (seller = auth.uid());

CREATE POLICY "Users can delete own items" ON items
    FOR DELETE USING (seller = auth.uid());

CREATE POLICY "Admins can manage all items" ON items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
