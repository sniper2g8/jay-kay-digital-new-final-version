import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Check environment variables
    const envStatus = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      SUPABASE_SERVICE_ROLE_KEY:
        !!process.env.SUPABASE_SERVICE_ROLE_KEY ||
        !!process.env.SUPABASE_SECRET_KEY,
    };

    if (!envStatus.SUPABASE_URL || !envStatus.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
        },
        { status: 500 },
      );
    }

    // Test database connection
    const supabase = createServiceRoleClient();

    // First test: Check if invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, invoiceNo, customerName")
      .eq("id", id)
      .single();

    if (invoiceError) {
      return NextResponse.json(
        {
          error: "Invoice query failed",
          details: invoiceError?.message || "Unknown error",
        },
        { status: 404 },
      );
    }

    // Second test: Check invoice_items table
    const {
      data: items,
      error: itemsError,
      count,
    } = await supabase
      .from("invoice_items")
      .select("*", { count: "exact" })
      .eq("invoice_id", id);

    if (itemsError) {
      return NextResponse.json(
        {
          error: "Invoice items query failed",
          details: itemsError?.message || "Unknown error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      invoice: invoice,
      items_count: count,
      items: items,
      message: "Test successful",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
