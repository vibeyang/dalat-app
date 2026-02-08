import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API endpoint is working',
        timestamp: new Date().toISOString(),
        event: {
            slug: 'tony-miller-vietnam-light-exhibition-2026',
            title: 'Tony Miller Exhibition',
            status: 'Event created successfully by Yang AI'
        }
    });
}