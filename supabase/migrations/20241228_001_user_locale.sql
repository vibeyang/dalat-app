-- Add locale preference to profiles
ALTER TABLE profiles
ADD COLUMN locale text DEFAULT 'en' CHECK (locale IN ('en', 'fr', 'vi'));

COMMENT ON COLUMN profiles.locale IS 'User language preference: en (English), fr (French), vi (Vietnamese)';
