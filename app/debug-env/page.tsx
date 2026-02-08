"use client";

export default function DebugEnv() {
    const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 50) + '...' : 
            undefined
    };
    
    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
            <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-semibold mb-2">Client Environment Variables:</h2>
                <pre className="text-sm">
                    {JSON.stringify(clientEnv, null, 2)}
                </pre>
                
                <h2 className="font-semibold mb-2 mt-4">User Agent:</h2>
                <p className="text-sm">{typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side'}</p>
                
                <h2 className="font-semibold mb-2 mt-4">Current URL:</h2>
                <p className="text-sm">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
                
                <h2 className="font-semibold mb-2 mt-4">Timestamp:</h2>
                <p className="text-sm">{new Date().toISOString()}</p>
            </div>
        </div>
    );
}