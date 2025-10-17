-- Rain Check Weather App Database Schema (Safe Version)
-- Run this in your Supabase SQL Editor if tables don't exist yet

-- Check if tables exist before creating them
DO $$
BEGIN
    -- Create sponsorships table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sponsorships') THEN
        CREATE TABLE sponsorships (
            id BIGSERIAL PRIMARY KEY,
            sponsor TEXT NOT NULL,
            message TEXT NOT NULL CHECK (length(message) <= 100),
            weather_type TEXT NOT NULL,
            duration INTEGER NOT NULL CHECK (duration > 0),
            price DECIMAL(10,2) NOT NULL CHECK (price > 0),
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
            start_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create usage_data table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usage_data') THEN
        CREATE TABLE usage_data (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            weather_type TEXT,
            profanity_mode BOOLEAN DEFAULT FALSE,
            temp_unit TEXT DEFAULT 'celsius',
            is_raining BOOLEAN,
            temperature DECIMAL(5,2),
            location TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create feedback table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback') THEN
        CREATE TABLE feedback (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
            message TEXT,
            profanity_mode BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_weather_type ON sponsorships(weather_type);
CREATE INDEX IF NOT EXISTS idx_sponsorships_active ON sponsorships(status, weather_type, start_date, duration);
CREATE INDEX IF NOT EXISTS idx_usage_data_user_id ON usage_data(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_data_created_at ON usage_data(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to sponsorships (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sponsorships_updated_at') THEN
        CREATE TRIGGER update_sponsorships_updated_at 
            BEFORE UPDATE ON sponsorships 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample data only if no data exists
INSERT INTO sponsorships (sponsor, message, weather_type, duration, price, status, start_date) 
SELECT * FROM (VALUES
    ('Test Coffee Shop', 'Need a warm drink? Visit us for the best coffee in town!', 'rain', 30, 25.00, 'active', NOW()),
    ('Test Resort', 'Perfect weather for a vacation! Book your stay today.', 'sunny', 7, 10.00, 'active', NOW()),
    ('Test Photography', 'Overcast days make for perfect photos! Schedule your session.', 'overcast', 14, 15.00, 'active', NOW()),
    ('Test Snow Gear', 'Winter is here! Get 20% off all snow equipment.', 'snowy', 60, 50.00, 'active', NOW())
) AS sample_data(sponsor, message, weather_type, duration, price, status, start_date)
WHERE NOT EXISTS (SELECT 1 FROM sponsorships LIMIT 1);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (if they don't exist)
DO $$
BEGIN
    -- Sponsorships policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorships' AND policyname = 'Allow public read access on sponsorships') THEN
        CREATE POLICY "Allow public read access on sponsorships" ON sponsorships FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorships' AND policyname = 'Allow public insert on sponsorships') THEN
        CREATE POLICY "Allow public insert on sponsorships" ON sponsorships FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorships' AND policyname = 'Allow public update on sponsorships') THEN
        CREATE POLICY "Allow public update on sponsorships" ON sponsorships FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorships' AND policyname = 'Allow public delete on sponsorships') THEN
        CREATE POLICY "Allow public delete on sponsorships" ON sponsorships FOR DELETE USING (true);
    END IF;

    -- Usage data policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_data' AND policyname = 'Allow public read access on usage_data') THEN
        CREATE POLICY "Allow public read access on usage_data" ON usage_data FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_data' AND policyname = 'Allow public insert on usage_data') THEN
        CREATE POLICY "Allow public insert on usage_data" ON usage_data FOR INSERT WITH CHECK (true);
    END IF;

    -- Feedback policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Allow public read access on feedback') THEN
        CREATE POLICY "Allow public read access on feedback" ON feedback FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Allow public insert on feedback') THEN
        CREATE POLICY "Allow public insert on feedback" ON feedback FOR INSERT WITH CHECK (true);
    END IF;
END $$;
