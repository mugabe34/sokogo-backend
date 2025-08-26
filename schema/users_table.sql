-- Supabase SQL Schema for Users Table
-- This schema creates a users table with UUID primary key, timestamps, and all required fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    -- Primary key with UUID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User information fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    
    -- Timestamps (automatically managed by Supabase)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data validation
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_role_values 
    CHECK (role IN ('user', 'admin', 'moderator', 'premium'));

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main users table storing user account information';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user (UUID)';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.phone_number IS 'User phone number (optional)';
COMMENT ON COLUMN users.password IS 'Hashed password';
COMMENT ON COLUMN users.role IS 'User role (user, admin, moderator, premium)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user was last updated';

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM users WHERE id = auth.uid())
    );

-- Policy: Allow user registration (insert)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update any user
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
