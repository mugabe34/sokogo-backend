-- Fix RLS Infinite Recursion Issue
-- Run this script in your Supabase SQL editor to fix the recursion problem

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES TO START FRESH
-- =====================================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Drop all existing policies on items table
DROP POLICY IF EXISTS "Anyone can view active items" ON items;
DROP POLICY IF EXISTS "Users can view own items" ON items;
DROP POLICY IF EXISTS "Users can create items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Admins can manage all items" ON items;
DROP POLICY IF EXISTS "Admins can view all items" ON items;
DROP POLICY IF EXISTS "Admins can update all items" ON items;
DROP POLICY IF EXISTS "Admins can delete all items" ON items;

-- =====================================================
-- 2. CREATE SAFE RLS POLICIES (NO RECURSION)
-- =====================================================

-- USERS TABLE POLICIES
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_registration" ON users
    FOR INSERT WITH CHECK (true);

-- ITEMS TABLE POLICIES
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
-- 3. VERIFICATION
-- =====================================================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'items')
ORDER BY tablename, policyname;
