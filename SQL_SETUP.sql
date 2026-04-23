-- ============================================
-- GREETING SYSTEM - SUPABASE SQL SETUP
-- Run these queries in Supabase SQL Editor
-- ============================================

-- ============ TABLE 1: greeting_config ============
-- Global settings for automatic greetings
CREATE TABLE IF NOT EXISTS greeting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time-based greetings
  enable_time_greetings BOOLEAN DEFAULT true,
  morning_start INTEGER DEFAULT 5,      -- 5 AM
  morning_end INTEGER DEFAULT 12,       -- 12 PM
  afternoon_start INTEGER DEFAULT 12,
  afternoon_end INTEGER DEFAULT 17,     -- 5 PM
  evening_start INTEGER DEFAULT 17,
  evening_end INTEGER DEFAULT 21,       -- 9 PM
  
  -- Festival greetings
  enable_festival_greetings BOOLEAN DEFAULT true,
  
  -- Ramadan special
  enable_ramadan_greetings BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Enable RLS
ALTER TABLE greeting_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Allow public read access" ON greeting_config
  FOR SELECT USING (true);

-- Insert default config
INSERT INTO greeting_config (
  enable_time_greetings,
  morning_start,
  morning_end,
  afternoon_start,
  afternoon_end,
  evening_start,
  evening_end,
  enable_festival_greetings,
  enable_ramadan_greetings
) VALUES (
  true, 5, 12, 12, 17, 17, 21, true, true
) ON CONFLICT DO NOTHING;

-- ============ TABLE 2: manual_greetings ============
-- Backend override greetings for special occasions
CREATE TABLE IF NOT EXISTS manual_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  greeting_message TEXT NOT NULL,
  emoji TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  applicable_timezones TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Empty = all timezones
  timezone_filter VARCHAR(20),  -- Alternative: single timezone column
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Enable RLS
ALTER TABLE manual_greetings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active greetings
CREATE POLICY "Allow public read active greetings" ON manual_greetings
  FOR SELECT USING (is_active = true);

-- ============ TABLE 3: festival_calendar ============
-- Customizable festival dates (static dates only)
CREATE TABLE IF NOT EXISTS festival_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name VARCHAR(100) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
  emoji TEXT,
  greeting_message TEXT,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(month, day)
);

-- Enable RLS
ALTER TABLE festival_calendar ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled festivals
CREATE POLICY "Allow public read enabled festivals" ON festival_calendar
  FOR SELECT USING (is_enabled = true);

-- ============ TABLE 4: islamic_dates ============
-- Islamic festival dates (Eid, Ramadan, etc.)
CREATE TABLE IF NOT EXISTS islamic_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name VARCHAR(100) NOT NULL,
  gregorian_date DATE NOT NULL,
  hijri_date_start VARCHAR(30),       -- e.g., "1 Shawwal 1447"
  emoji TEXT,
  greeting_message TEXT,
  description TEXT,
  year INTEGER NOT NULL,              -- Hijri year
  duration_days INTEGER DEFAULT 1,    -- Some holidays last multiple days
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(festival_name, gregorian_date)
);

-- Enable RLS
ALTER TABLE islamic_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled dates
CREATE POLICY "Allow public read enabled islamic dates" ON islamic_dates
  FOR SELECT USING (is_enabled = true);

-- ================================================================
-- SAMPLE DATA - Insert these to test the system
-- ================================================================

-- ============ SAMPLE: Static Festival Dates ============
INSERT INTO festival_calendar (festival_name, month, day, emoji, greeting_message, description, is_enabled)
VALUES
  ('Suvonabarsho', 8, 14, '🇧🇩', 'Suvonabarsho! Happy Bangla New Year!', 'Bengali New Year', true),
  ('Shaheed Dibos', 2, 21, '📚', 'International Mother Language Day', 'Language Martyrs Day', true),
  ('Victory Day', 12, 16, '🏆', 'Happy Victory Day! Victory to Bangladesh!', 'Bangladesh Liberation Day', true),
  ('Independence Day', 3, 26, '🎌', 'Happy Independence Day!', 'Bangladesh Independence Day', true),
  ('Pohela Boishakh', 4, 14, '🎨', 'Happy Pahela Boishakh! Welcome to the new Bangla year!', 'Bengali New Year Celebration', true)
ON CONFLICT (month, day) DO NOTHING;

-- ============ SAMPLE: Islamic Festival Dates (2026) ============
INSERT INTO islamic_dates (festival_name, gregorian_date, hijri_date_start, emoji, greeting_message, description, year, is_enabled)
VALUES
  ('Eid ul-Fitr', '2026-04-10', '1 Shawwal 1447', '🌙', 'Eid Mubarak! Wishing you joy and blessings!', 'End of Ramadan', 1447, true),
  ('Eid ul-Adha', '2026-06-18', '10 Dhul Hijjah 1447', '🐑', 'Eid Mubarak! Celebrating with love and gratitude!', 'Festival of Sacrifice', 1447, true),
  ('Ramadan Start', '2026-03-11', '1 Ramadan 1447', '☪️', 'Happy Ramadan! May your fast be blessed!', 'Islamic Holy Month Begins', 1447, true),
  ('Islamic New Year', '2026-09-01', '1 Muharram 1448', '🕌', 'Happy Islamic New Year!', 'Islamic Calendar New Year', 1448, true)
ON CONFLICT (festival_name, gregorian_date) DO NOTHING;

-- ============ SAMPLE: Manual Greetings (Overrides) ============
INSERT INTO manual_greetings (greeting_message, emoji, start_date, end_date, priority, is_active, timezone_filter)
VALUES
  ('🎉 Special Holiday Announcement! Business Hours Extended!', '🎉', '2026-04-22', '2026-04-23', 150, true, NULL),
  ('🌍 Global Team Day! Celebrate with your colleagues!', '🤝', '2026-05-01', '2026-05-01', 140, true, NULL),
  ('🎂 Happy Birthday to Our CEO!', '🎂', '2026-06-15', '2026-06-15', 130, true, NULL),
  ('📢 System Maintenance Notice - Limited Features Available', '⚠️', '2026-07-20', '2026-07-20', 160, false, NULL)
ON CONFLICT DO NOTHING;

-- ================================================================
-- QUERIES TO TEST THE SYSTEM
-- ================================================================

-- Check what greeting should show TODAY
SELECT 
  'Config' AS type,
  config.enable_time_greetings,
  config.enable_festival_greetings,
  config.morning_start,
  config.morning_end,
  config.afternoon_start,
  config.afternoon_end,
  config.evening_start,
  config.evening_end
FROM greeting_config config
LIMIT 1;

-- Check for TODAY'S manual greeting
SELECT * FROM manual_greetings 
WHERE is_active = true
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
ORDER BY priority DESC
LIMIT 1;

-- Check if TODAY is a festival
SELECT * FROM festival_calendar 
WHERE is_enabled = true
  AND month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
  AND day = EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;

-- Check if TODAY is an Islamic date
SELECT * FROM islamic_dates 
WHERE is_enabled = true
  AND gregorian_date = CURRENT_DATE;

-- View all active manual greetings (future)
SELECT * FROM manual_greetings 
WHERE is_active = true
ORDER BY start_date DESC;

-- View all festivals
SELECT * FROM festival_calendar 
WHERE is_enabled = true
ORDER BY month, day;

-- View all Islamic dates this year
SELECT * FROM islamic_dates 
WHERE is_enabled = true
  AND EXTRACT(YEAR FROM gregorian_date) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY gregorian_date;
