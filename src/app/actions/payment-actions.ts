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

    // Truncate notes to fit within VARCHAR(20) limit
    const truncatedNotes = paymentData.notes 
      ? paymentData.notes.substring(0, 20) 
      : null;

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
      notes: truncatedNotes,
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

    // First, get the current status of the invoice
    const { data: currentInvoice, error: fetchError } = await supabase
      .from("invoices")
      .select("invoice_status")
      .eq("id", invoiceId)
      .single();

    if (fetchError) {
      console.error("Error fetching current invoice status:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentStatus = currentInvoice.invoice_status;

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

    // Insert record into invoice_status_history if status changed
    if (currentStatus !== newStatus) {
      const { error: historyError } = await supabase
        .from("invoice_status_history")
        .insert({
          invoice_id: invoiceId,
          status_from: currentStatus,
          status_to: newStatus,
          change_date: new Date().toISOString(),
          changed_by: null, // In a real implementation, you'd want to pass the user ID
          reason: `Payment processed - status changed from ${currentStatus} to ${newStatus}`,
        });

      if (historyError) {
        console.error("Error inserting into invoice_status_history:", historyError);
        // Note: We don't return here because the invoice update was successful
        // We just log the error for the history record
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating invoice after payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: string) {
  try {
    const supabase = createServiceRoleClient();

    // First, get the current status of the invoice
    const { data: currentInvoice, error: fetchError } = await supabase
      .from("invoices")
      .select("invoice_status")
      .eq("id", invoiceId)
      .single();

    if (fetchError) {
      console.error("Error fetching current invoice status:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentStatus = currentInvoice.invoice_status;

    // Update invoice status
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        invoice_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error("Error updating invoice status:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Insert record into invoice_status_history
    const { error: historyError } = await supabase
      .from("invoice_status_history")
      .insert({
        invoice_id: invoiceId,
        status_from: currentStatus,
        status_to: newStatus,
        change_date: new Date().toISOString(),
        changed_by: null, // In a real implementation, you'd want to pass the user ID
        reason: `Status changed from ${currentStatus} to ${newStatus}`,
      });

    if (historyError) {
      console.error("Error inserting into invoice_status_history:", historyError);
      // Note: We don't return here because the invoice update was successful
      // We just log the error for the history record
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateInvoice(invoiceId: string, updateData: any) {
  try {
    const supabase = createServiceRoleClient();

    // If invoice_status is being updated, we need to handle the history
    let currentStatus = null;
    let newStatus = null;
    
    if (updateData.invoice_status) {
      // First, get the current status of the invoice
      const { data: currentInvoice, error: fetchError } = await supabase
        .from("invoices")
        .select("invoice_status")
        .eq("id", invoiceId)
        .single();

      if (fetchError) {
        console.error("Error fetching current invoice status:", fetchError);
        return { success: false, error: fetchError.message };
      }

      currentStatus = currentInvoice.invoice_status;
      newStatus = updateData.invoice_status;
    }

    // Update invoice
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error("Error updating invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Insert record into invoice_status_history if status changed
    if (currentStatus && newStatus && currentStatus !== newStatus) {
      const { error: historyError } = await supabase
        .from("invoice_status_history")
        .insert({
          invoice_id: invoiceId,
          status_from: currentStatus,
          status_to: newStatus,
          change_date: new Date().toISOString(),
          changed_by: null, // In a real implementation, you'd want to pass the user ID
          reason: `Status changed from ${currentStatus} to ${newStatus}`,
        });

      if (historyError) {
        console.error("Error inserting into invoice_status_history:", historyError);
        // Note: We don't return here because the invoice update was successful
        // We just log the error for the history record
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
