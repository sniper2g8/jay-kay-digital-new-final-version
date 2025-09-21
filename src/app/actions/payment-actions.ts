"use server";

import { createServiceRoleClient } from "@/lib/supabase-admin";
import { Database } from "@/lib/database.types";

export async function processPayment(paymentData: {
  customer_human_id: string;
  invoice_no: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
}) {
  try {
    const supabase = createServiceRoleClient();

    // Create payment record with correct column names
    const paymentMethodMapping: Record<string, string> = {
      cash: "cash",
      credit_card: "card",
      bank_transfer: "bank_transfer",
      check: "cheque",
      mobile_money: "mobile_money",
    };

    // Generate a shorter payment number that fits within VARCHAR(20)
    const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digit random number
    const paymentNumber = `PAY-${timestamp}-${random}`; // Format: PAY-XXXXXX-XXX (15 chars max)

    const { data, error: paymentError } = await supabase.from("payments").insert({
      customer_human_id: paymentData.customer_human_id,
      invoice_no: paymentData.invoice_no,
      amount: paymentData.amount,
      payment_method: (paymentMethodMapping[paymentData.payment_method] ||
        paymentData.payment_method) as
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "card"
        | "cheque"
        | "credit",
      payment_date: paymentData.payment_date,
      reference_number: paymentData.reference_number || null,
      notes: paymentData.notes || null,
      payment_status: "completed",
      payment_number: paymentNumber,
    }).select().single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      return { success: false, error: paymentError.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateInvoiceAfterPayment(invoiceId: string, amountPaid: number, newStatus: string) {
  try {
    const supabase = createServiceRoleClient();

    // Update invoice amounts and status
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        amountPaid: amountPaid,
        invoice_status: newStatus,
        payment_status: newStatus === "paid" ? "paid" : "partial",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error("Error updating invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating invoice after payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}