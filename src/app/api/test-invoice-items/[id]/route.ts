import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    console.log(`[TEST] Testing invoice items for ID: ${id}`);
    
    // Check environment variables
    const envStatus = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SECRET_KEY,
    };
    
    console.log('[TEST] Environment variables:', envStatus);
    
    if (!envStatus.SUPABASE_URL || !envStatus.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing environment variables',
        env_status: envStatus
      }, { status: 500 });
    }
    
    // Test database connection
    const supabase = createServiceRoleClient();
    
    // First test: Check if invoice exists
    console.log('[TEST] Checking if invoice exists...');
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoiceNo, customerName')
      .eq('id', id)
      .single();
      
    if (invoiceError) {
      console.error('[TEST] Invoice query error:', invoiceError);
      return NextResponse.json({
        error: 'Invoice query failed',
        details: invoiceError,
        env_status: envStatus
      }, { status: 404 });
    }
    
    console.log('[TEST] Invoice found:', invoice);
    
    // Second test: Check invoice_items table
    console.log('[TEST] Checking invoice_items...');
    const { data: items, error: itemsError, count } = await supabase
      .from('invoice_items')
      .select('*', { count: 'exact' })
      .eq('invoice_id', id);
      
    if (itemsError) {
      console.error('[TEST] Invoice items query error:', itemsError);
      return NextResponse.json({
        error: 'Invoice items query failed',
        details: itemsError,
        invoice_found: invoice,
        env_status: envStatus
      }, { status: 500 });
    }
    
    console.log(`[TEST] Found ${count} invoice items`);
    
    return NextResponse.json({
      success: true,
      invoice: invoice,
      items_count: count,
      items: items,
      env_status: envStatus,
      message: 'Test successful'
    });
    
  } catch (error) {
    console.error('[TEST] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}