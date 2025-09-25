import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Log environment variables for debugging
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Secret Key exists:", !!process.env.SUPABASE_SECRET_KEY);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Missing Supabase environment variables");
    return NextResponse.json(
      { 
        error: "Server configuration error",
        details: "Missing Supabase environment variables"
      },
      { status: 500 },
    );
  }
  
  // Create a service role client using the new API key system
  const supabase = createServiceRoleClient();
  
  try {
    console.log(`Fetching invoice items for invoice ID: ${id}`);
    
    // First, check if the invoice exists
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .single();
      
    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: invoiceError.message
        },
        { status: 404 },
      );
    }
    
    if (!invoiceData) {
      console.error("Invoice not found");
      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: "No invoice found with the provided ID"
        },
        { status: 404 },
      );
    }
    
    // Now fetch the invoice items
    console.log("Fetching invoice items...");
    const { data, error, count } = await supabase
      .from('invoice_items')
      .select('*', { count: 'exact' })
      .eq('invoice_id', id);
      
    console.log("Query result:", { data, error, count });
    
    if (error) {
      console.error("Database error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return NextResponse.json(
        { 
          error: "Database error",
          details: error.message,
          code: error.code
        },
        { status: 500 },
      );
    }
    
    console.log(`Found ${count} invoice items`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 },
    );
  }
}