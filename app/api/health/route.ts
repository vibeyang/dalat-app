import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
            },
            message: 'Health check passed - Yang AI monitoring system active'
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json({
        message: 'POST method works too',
        timestamp: new Date().toISOString()
    });
}