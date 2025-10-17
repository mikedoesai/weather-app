-- Rain Check Weather App Database Schema Update
-- Run this in your Supabase SQL Editor to update existing tables

-- Drop existing tables if they exist (this will remove all data)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS usage_data CASCADE;
DROP TABLE IF EXISTS sponsorships CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Sponsorships table
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

-- Usage tracking table
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

-- Feedback table
CREATE TABLE feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
    message TEXT,
    profanity_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sponsorships_status ON sponsorships(status);
CREATE INDEX idx_sponsorships_weather_type ON sponsorships(weather_type);
CREATE INDEX idx_sponsorships_active ON sponsorships(status, weather_type, start_date, duration);
CREATE INDEX idx_usage_data_user_id ON usage_data(user_id);
CREATE INDEX idx_usage_data_created_at ON usage_data(created_at);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to sponsorships
CREATE TRIGGER update_sponsorships_updated_at 
    BEFORE UPDATE ON sponsorships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO sponsorships (sponsor, message, weather_type, duration, price, status, start_date) VALUES
('Test Coffee Shop', 'Need a warm drink? Visit us for the best coffee in town!', 'rain', 30, 25.00, 'active', NOW()),
('Test Resort', 'Perfect weather for a vacation! Book your stay today.', 'sunny', 7, 10.00, 'active', NOW()),
('Test Photography', 'Overcast days make for perfect photos! Schedule your session.', 'overcast', 14, 15.00, 'active', NOW()),
('Test Snow Gear', 'Winter is here! Get 20% off all snow equipment.', 'snowy', 60, 50.00, 'active', NOW());

-- Enable Row Level Security (RLS)
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public weather app)
CREATE POLICY "Allow public read access on sponsorships" ON sponsorships FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sponsorships" ON sponsorships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sponsorships" ON sponsorships FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on sponsorships" ON sponsorships FOR DELETE USING (true);

CREATE POLICY "Allow public read access on usage_data" ON usage_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert on usage_data" ON usage_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert on feedback" ON feedback FOR INSERT WITH CHECK (true);
