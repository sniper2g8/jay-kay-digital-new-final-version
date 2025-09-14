'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DatabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [error, setError] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      setConnectionStatus('testing');
      setError('');

      // Test 1: Basic connection
      console.log('Testing basic Supabase connection...');
      
      // Test 2: Try to query a simple table
      console.log('Testing customers table access...');
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .limit(5);

      if (customerError) {
        console.error('Customer query error:', customerError);
        setError(`Customer query failed: ${customerError.message}`);
        setConnectionStatus('error');
        return;
      }

      setCustomers(customerData || []);

      // Test 3: Try to get table schema information
      console.log('Testing schema access...');
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);

      if (schemaError) {
        console.error('Schema query error:', schemaError);
        // This might fail due to permissions, but it's not critical
        console.log('Schema access failed, but table access works');
      } else {
        setTables(schemaData || []);
      }

      setConnectionStatus('success');
    } catch (err: any) {
      console.error('Database connection test failed:', err);
      setError(err.message || 'Unknown error occurred');
      setConnectionStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Testing Supabase database connection</CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === 'testing' && (
              <Alert>
                <AlertDescription>Testing database connection...</AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  ✅ Database connection successful!
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  ❌ Database connection failed: {error}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={testDatabaseConnection} className="mt-4">
              Retry Connection Test
            </Button>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Checking environment variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </div>
              <div>
                <strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
                <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Data */}
        {customers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sample Customer Data</CardTitle>
              <CardDescription>First 5 customers from database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customers.map((customer, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded">
                    <p><strong>ID:</strong> {customer.customer_human_id || customer.id}</p>
                    <p><strong>Business:</strong> {customer.business_name || 'N/A'}</p>
                    <p><strong>Contact:</strong> {customer.contact_person || 'N/A'}</p>
                    <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schema Info */}
        {tables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>Available tables in public schema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {tables.map((table, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                    {table.table_name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
