// Simple test API route - pages/api structure
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API working!',
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    }
  });
}