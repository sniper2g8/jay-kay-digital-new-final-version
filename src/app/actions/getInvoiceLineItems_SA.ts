"use server";

import { createServiceRoleClient } from "@/lib/supabase-admin";

export async function getInvoiceLineItems_SA(invoiceId: string) {
  try {
    const adminSupabase = createServiceRoleClient();

    const { data, error } = await adminSupabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (error) {
      console.error("Error fetching invoice line items (service role):", error);
      return { data: null, error } as const;
    }

    return { data: data ?? [], error: null } as const;
  } catch (err) {
    console.error("Unexpected error in getInvoiceLineItems_SA:", err);
    return {
      data: null,
      error: { message: "Unexpected error fetching invoice line items" } as any,
    } as const;
  }
}
