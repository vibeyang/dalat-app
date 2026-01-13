-- Cleanup: Remove AI extraction feature artifacts
-- This migration removes database resources from the removed AI extraction feature

-- 1. Drop the extraction stats function
DROP FUNCTION IF EXISTS get_extraction_stats();

-- 2. Drop the extraction_logs table (CASCADE will remove related policies)
DROP TABLE IF EXISTS extraction_logs CASCADE;

-- 3. Delete storage bucket and its objects
DELETE FROM storage.objects WHERE bucket_id = 'extraction-uploads';
DELETE FROM storage.buckets WHERE id = 'extraction-uploads';
