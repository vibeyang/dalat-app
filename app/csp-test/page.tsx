'use client';

import { useEffect } from 'react';

export default function CSPTest() {
  useEffect(() => {
    const testElement = document.getElementById('js-test');
    if (testElement) {
      testElement.innerHTML = '✅ JavaScript is working!';
      console.log('✅ JavaScript executed successfully - CSP allows scripts');
    }
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>CSP Test Page - Yang AI</h1>
      <p>Testing if Content Security Policy is blocking JavaScript...</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <h2>Test Results:</h2>
        <p>✅ HTML Rendering: Working</p>
        <p>✅ React Component: Working</p>
        <p>✅ Inline Styles: Working</p>
        <div id="js-test" style={{ padding: '5px', backgroundColor: '#ffcccc' }}>
          ❌ JavaScript test pending...
        </div>
      </div>
      
      <h3>CSP Diagnosis:</h3>
      <ul>
        <li>If you see "JavaScript is working!" above in green, CSP is fixed</li>
        <li>If you see console errors about script-src, CSP is still blocking</li>
        <li>Check browser console for detailed CSP violation messages</li>
        <li>This tests both React hydration AND JavaScript execution</li>
      </ul>
      
      <div style={{ backgroundColor: '#e0ffe0', padding: '10px', margin: '10px 0' }}>
        <strong>Next Step:</strong> Once this shows JavaScript working, the Tony Miller event page should load correctly!
      </div>
    </div>
  );
}