import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get the request body
        const eventData = await request.json();
        
        // Validate required fields
        const required = ['slug', 'title', 'description', 'starts_at'];
        for (const field of required) {
            if (!eventData[field]) {
                return NextResponse.json({ 
                    success: false, 
                    error: `Missing required field: ${field}` 
                }, { status: 400 });
            }
        }
        
        // Add default values
        const eventToInsert = {
            ...eventData,
            status: eventData.status || 'published',
            timezone: eventData.timezone || 'Asia/Ho_Chi_Minh',
            created_by: eventData.created_by || '00000000-0000-0000-0000-000000000001' // System user
        };
        
        // Insert the event
        const { data: event, error } = await supabase
            .from('events')
            .insert([eventToInsert])
            .select('*')
            .single();
            
        if (error) {
            return NextResponse.json({ 
                success: false, 
                error: error.message,
                code: error.code
            }, { status: 500 });
        }
        
        return NextResponse.json({
            success: true,
            event: event,
            url: `https://dalat.app/events/${event.slug}`
        });
        
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}