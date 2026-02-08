"use client";

import { useState, useEffect } from 'react';

export function DatabaseDebug() {
    const [status, setStatus] = useState('checking...');
    
    useEffect(() => {
        fetch('/api/debug/database')
            .then(res => res.json())
            .then(data => {
                setStatus(JSON.stringify(data, null, 2));
            })
            .catch(err => {
                setStatus(`Error: ${err.message}`);
            });
    }, []);
    
    return (
        <div className="bg-gray-100 p-4 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Database Status:</h3>
            <pre>{status}</pre>
        </div>
    );
}