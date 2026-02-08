import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Test basic connection
        const { data: tables, error: tableError } = await supabase
            .from('events')
            .select('count')
            .limit(1);
            
        if (tableError) {
            return NextResponse.json({ 
                success: false, 
                error: tableError.message,
                code: tableError.code,
                supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
                supabase_key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'set' : 'missing'
            });
        }
        
        // Test the specific event
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, slug, title, status')
            .eq('slug', 'tony-miller-vietnam-light-exhibition-2026')
            .single();
            
        return NextResponse.json({
            success: true,
            tableConnection: 'working',
            eventFound: event ? true : false,
            eventData: event || null,
            eventError: eventError?.message || null,
            env: {
                supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
                supabase_key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'configured' : 'missing'
            }
        });
        
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
}