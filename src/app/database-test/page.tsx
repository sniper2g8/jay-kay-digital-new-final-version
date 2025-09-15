'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function DatabaseTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabaseAccess = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      console.log('Testing database access...');
      
      // First check auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { hasSession: !!session, sessionError });
      
      // Test simple query
      const { data, error } = await supabase
        .from('customers')
        .select('id, business_name')
        .limit(1);
      
      if (error) {
        console.error('Database error:', error);
        setTestResult(`Database Error: ${error.message} (Code: ${error.code})`);
      } else {
        console.log('Database success:', data);
        setTestResult(`Success! Found ${data?.length || 0} customers`);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setTestResult(`Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Access Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testDatabaseAccess}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Database Access'}
        </button>

        {testResult && (
          <div className={`p-4 rounded ${testResult.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="font-bold">Test Result:</h3>
            <p className="mt-2">{testResult}</p>
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Instructions:</h3>
          <p className="text-sm mt-2">
            This test bypasses all authentication checks and directly queries the database. 
            If this fails, the issue is with RLS policies. If this succeeds, the issue is 
            with the authentication context in the hooks.
          </p>
        </div>
      </div>
    </div>
  );
}