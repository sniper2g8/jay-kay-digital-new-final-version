import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { Database } from "@/lib/database.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await the params Promise in Next.js 15
    const resolvedParams = await params;

    // Create Supabase client with service role key for full access
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch invoice items using Supabase client
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', resolvedParams.id)
      .order('id');

    if (error) {
      console.error("Error fetching invoice items:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { 
          error: "Failed to fetch invoice items", 
          details: error.message,
          code: error.code
        },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching invoice items:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
      params: await params.catch(e => `Error resolving params: ${e}`)
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch invoice items",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;

    // Create Supabase client with service role key for full access
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the request body
    const items = await request.json();

    // Start a transaction by using Supabase operations
    // Delete existing items for this invoice
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) {
      console.error("Error deleting invoice items:", deleteError);
      throw deleteError;
    }

    // Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        job_no: item.job_no || null
      }));

      const { error: insertError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (insertError) {
        console.error("Error inserting invoice items:", insertError);
        throw insertError;
      }
    }

    return NextResponse.json({ success: true, message: 'Invoice items updated successfully' });

  } catch (error) {
    console.error("Error updating invoice items:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: "Failed to update invoice items", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 },
    );
  }
}