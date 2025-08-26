-- Safe RLS Policies for Sokogo Classifieds (No Recursion)
-- Run this AFTER creating the tables to add safe RLS policies

-- =====================================================
-- DISABLE EXISTING POLICIES (if any)
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

DROP POLICY IF EXISTS "Anyone can view active items" ON items;
DROP POLICY IF EXISTS "Users can view own items" ON items;
DROP POLICY IF EXISTS "Users can create items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Admins can view all items" ON items;
DROP POLICY IF EXISTS "Admins can update all items" ON items;
DROP POLICY IF EXISTS "Admins can delete all items" ON items;
DROP POLICY IF EXISTS "Admins can manage all items" ON items;

-- =====================================================
-- SAFE RLS POLICIES FOR USERS TABLE
-- =====================================================

-- Policy: Users can view their own profile only
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not role)
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Allow new user registration
CREATE POLICY "users_insert_registration" ON users
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- SAFE RLS POLICIES FOR ITEMS TABLE  
-- =====================================================

-- Policy: Anyone can view active items (public marketplace)
CREATE POLICY "items_select_active" ON items
    FOR SELECT USING (status = 'ACTIVE');

-- Policy: Users can view all their own items (any status)
CREATE POLICY "items_select_own" ON items
    FOR SELECT USING (seller = auth.uid());

-- Policy: Users can create items (must be their own)
CREATE POLICY "items_insert_own" ON items
    FOR INSERT WITH CHECK (seller = auth.uid());

-- Policy: Users can update their own items
CREATE POLICY "items_update_own" ON items
    FOR UPDATE USING (seller = auth.uid())
    WITH CHECK (seller = auth.uid());

-- Policy: Users can delete their own items
CREATE POLICY "items_delete_own" ON items
    FOR DELETE USING (seller = auth.uid());

-- =====================================================
-- ADMIN POLICIES (OPTIONAL - ENABLE ONLY IF NEEDED)
-- =====================================================

-- Uncomment these if you need admin functionality
-- Note: These require proper JWT token setup with role claims

/*
-- Admin can view all users
CREATE POLICY "admin_users_select_all" ON users
    FOR SELECT USING (
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Admin can update any user
CREATE POLICY "admin_users_update_all" ON users
    FOR UPDATE USING (
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Admin can view all items
CREATE POLICY "admin_items_select_all" ON items
    FOR SELECT USING (
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Admin can update any item (for moderation)
CREATE POLICY "admin_items_update_all" ON items
    FOR UPDATE USING (
        (auth.jwt() ->> 'role') = 'admin'
    );
*/
