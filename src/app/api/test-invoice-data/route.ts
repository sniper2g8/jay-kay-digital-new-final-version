import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // Get a few sample invoices to test with
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoiceNo, customerName")
      .limit(5);

    if (invoicesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch invoices",
          details: invoicesError,
        },
        { status: 500 },
      );
    }

    // Test invoice_items for these invoices
    const testResults = [];
    for (const invoice of invoices || []) {
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id);

      testResults.push({
        invoice_id: invoice.id,
        invoice_no: invoice.invoiceNo,
        customer_name: invoice.customerName,
        items_count: items?.length || 0,
        items_error: itemsError?.message,
        has_items: !itemsError && (items?.length || 0) > 0,
      });
    }

    return NextResponse.json({
      success: true,
      total_invoices: invoices?.length || 0,
      test_results: testResults,
      sample_invoice_for_testing:
        testResults.find((r) => r.has_items)?.invoice_id ||
        testResults[0]?.invoice_id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
