import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_PUBLISHABLE_DEFAULT_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
    };

    console.log('Environment variables check:', envCheck);

    // Test service role client creation
    const supabase = createServiceRoleClient();

    // Test basic database connectivity
    const { data: testQuery, error: testError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connectivity test failed',
        details: testError,
        environment: envCheck
      }, { status: 500 });
    }

    // Test invoice_items table access
    const { data: itemsTest, error: itemsError } = await supabase
      .from('invoice_items')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'API connectivity test successful',
      environment: envCheck,
      tests: {
        invoices: {
          success: !testError,
          count: testQuery?.length || 0,
          error: testError?.message
        },
        invoice_items: {
          success: !itemsError,
          count: itemsTest?.length || 0,
          error: itemsError?.message
        }
      }
    });

  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}