import { NextResponse } from 'next/server';

export async function GET() {
    const envCheck = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        platform: 'vercel',
        environment: {
            NEXT_PUBLIC_SUPABASE_URL: {
                exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                    process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 
                    'NOT SET'
            },
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
                exists: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
                value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 50) + '...' : 
                    'NOT SET'
            }
        },
        diagnosis: {
            canConnectToSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            recommendation: (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?
                'Add missing environment variables to Vercel deployment' :
                'Environment variables are configured'
        }
    };
    
    return NextResponse.json(envCheck);
}