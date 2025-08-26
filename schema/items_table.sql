-- Supabase SQL Schema for Items Table (Classifieds/Marketplace)
-- This schema creates an items table for the Sokogo Classifieds application

-- Create items table
CREATE TABLE items (
    -- Primary key with UUID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic item information
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'Frw',
    
    -- Location information
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    
    -- Images (stored as JSON array of URLs)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Seller reference (foreign key to users table)
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- Category-specific features (stored as JSONB for flexibility)
    features JSONB DEFAULT '{}'::jsonb,
    
    -- Contact information
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_subcategory ON items(subcategory);
CREATE INDEX idx_items_seller_id ON items(seller_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_items_location ON items(district, city);
CREATE INDEX idx_items_created_at ON items(created_at);

-- Create GIN index for JSONB fields for efficient querying
CREATE INDEX idx_items_features ON items USING GIN (features);
CREATE INDEX idx_items_images ON items USING GIN (images);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data validation
ALTER TABLE items ADD CONSTRAINT check_category_values 
    CHECK (category IN ('MOTORS', 'PROPERTY', 'ELECTRONICS'));

ALTER TABLE items ADD CONSTRAINT check_status_values 
    CHECK (status IN ('ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED'));

ALTER TABLE items ADD CONSTRAINT check_price_positive 
    CHECK (price > 0);

-- Add comments for documentation
COMMENT ON TABLE items IS 'Items/classifieds listings table for marketplace';
COMMENT ON COLUMN items.id IS 'Unique identifier for each item (UUID)';
COMMENT ON COLUMN items.title IS 'Item title/name';
COMMENT ON COLUMN items.description IS 'Detailed item description';
COMMENT ON COLUMN items.category IS 'Main category (MOTORS, PROPERTY, ELECTRONICS)';
COMMENT ON COLUMN items.subcategory IS 'Specific subcategory within main category';
COMMENT ON COLUMN items.price IS 'Item price';
COMMENT ON COLUMN items.currency IS 'Price currency (default: Frw)';
COMMENT ON COLUMN items.district IS 'District location';
COMMENT ON COLUMN items.city IS 'City location';
COMMENT ON COLUMN items.address IS 'Specific address (optional)';
COMMENT ON COLUMN items.images IS 'Array of image URLs (JSONB)';
COMMENT ON COLUMN items.seller_id IS 'Reference to user who posted the item';
COMMENT ON COLUMN items.status IS 'Item status (ACTIVE, SOLD, EXPIRED, SUSPENDED)';
COMMENT ON COLUMN items.features IS 'Category-specific features (JSONB)';
COMMENT ON COLUMN items.contact_phone IS 'Contact phone for this item';
COMMENT ON COLUMN items.contact_email IS 'Contact email for this item';

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items table

-- Policy: Anyone can view active items
CREATE POLICY "Anyone can view active items" ON items
    FOR SELECT USING (status = 'ACTIVE');

-- Policy: Users can view all their own items (regardless of status)
CREATE POLICY "Users can view own items" ON items
    FOR SELECT USING (seller_id = auth.uid());

-- Policy: Users can create items
CREATE POLICY "Users can create items" ON items
    FOR INSERT WITH CHECK (seller_id = auth.uid());

-- Policy: Users can update their own items
CREATE POLICY "Users can update own items" ON items
    FOR UPDATE USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

-- Policy: Users can delete their own items
CREATE POLICY "Users can delete own items" ON items
    FOR DELETE USING (seller_id = auth.uid());

-- Policy: Admins can view all items
CREATE POLICY "Admins can view all items" ON items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update any item (for moderation)
CREATE POLICY "Admins can update any item" ON items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can delete any item (for moderation)
CREATE POLICY "Admins can delete any item" ON items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
