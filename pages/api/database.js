// Database test API route
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('events')
      .select('id, title')
      .limit(5);
      
    if (error) {
      return res.status(500).json({
        error: 'Database query failed',
        details: error.message
      });
    }
    
    res.status(200).json({
      status: 'Database connected!',
      eventCount: data?.length || 0,
      sampleEvents: data,
      env: {
        url: supabaseUrl,
        keyPrefix: supabaseKey?.substring(0, 20) + '...'
      }
    });
    
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
}