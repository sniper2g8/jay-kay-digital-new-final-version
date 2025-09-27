/**
 * Payment Notification Hooks for Jay Kay Digital Press
 * Integrates with payment management to send notifications
 */

import {
    InvoiceNotificationData,
    notificationService,
    PaymentNotificationData,
} from "../notification-service.ts";
import { supabase } from "../supabase.ts";

/**
 * Hook to send notifications when a payment is recorded
 */
export async function notifyPaymentRecorded(paymentData: {
  id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
}): Promise<void> {
  try {
    // Get invoice and customer details
    const [invoiceResult, customerResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("invoiceNo")
        .eq("id", paymentData.invoice_id)
        .single(),
      supabase
        .from("customers")
        .select("name, email, phone")
        .eq("id", paymentData.customer_id)
        .single(),
    ]);

    const invoice = invoiceResult.data;
    const customer = customerResult.data;

    if (invoiceResult.error || customerResult.error) {
      console.error("Error fetching invoice or customer details:", {
        invoiceError: invoiceResult.error,
        customerError: customerResult.error,
      });
      return;
    }

    const notificationData: PaymentNotificationData = {
      payment_id: paymentData.id,
      invoice_no:
        invoice?.invoiceNo || `INV-${paymentData.invoice_id.slice(-6)}`,
      customer_id: paymentData.customer_id,
      customer_name: customer?.name || "Unknown Customer",
      customer_email: customer?.email || undefined,
      customer_phone: customer?.phone || undefined,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      payment_date: paymentData.payment_date,
    };

    await notificationService.sendPaymentRecordNotification(notificationData);
  } catch (error) {
    console.error("Error sending payment notifications:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown payment notification error",
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      context: "sendPaymentNotifications",
    });
  }
}

/**
 * Hook to send notifications when an invoice is generated
 */
export async function notifyInvoiceGenerated(invoiceData: {
  id: string;
  invoiceNo: string;
  customer_id: string;
  amount: number;
  due_date: string;
}): Promise<void> {
  try {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("name, email, phone")
      .eq("id", invoiceData.customer_id)
      .single();

    if (customerError) {
      console.error("Error fetching customer details:", customerError);
      return;
    }

    const notificationData: InvoiceNotificationData = {
      invoice_id: invoiceData.id,
      invoice_no: invoiceData.invoiceNo,
      customer_id: invoiceData.customer_id,
      customer_name: customer?.name || "Unknown Customer",
      customer_email: customer?.email || undefined,
      customer_phone: customer?.phone || undefined,
      amount: invoiceData.amount,
      due_date: invoiceData.due_date,
    };

    await notificationService.sendInvoiceNotification(notificationData);
  } catch (error) {
    console.error("Error sending invoice notifications:", error);
  }
}

/**
 * Wrapper function to record payment and send notifications
 */
export async function recordPaymentWithNotification(paymentData: {
  invoice_no: string;
  customer_human_id: string;
  amount: number;
  payment_method:
    | "cash"
    | "bank_transfer"
    | "mobile_money"
    | "card"
    | "cheque"
    | "credit";
  payment_date: string;
  notes?: string;
  received_by?: string;
  reference_number?: string;
}): Promise<{ success: boolean; error?: string; payment_id?: string }> {
  try {
    // Generate payment number
    const paymentNumber = await generatePaymentNumber();

    // Record payment in database
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        invoice_no: paymentData.invoice_no,
        customer_human_id: paymentData.customer_human_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        payment_number: paymentNumber,
        notes: paymentData.notes,
        received_by: paymentData.received_by,
        reference_number: paymentData.reference_number,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !payment) {
      return { success: false, error: "Failed to record payment" };
    }

    // Get customer ID from human_id
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("human_id", paymentData.customer_human_id)
      .single();

    if (!customerError && customer) {
      // Send notifications
      await notifyPaymentRecorded({
        id: payment.id,
        invoice_id: paymentData.invoice_no, // Using invoice_no as identifier
        customer_id: customer.id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
      });
    }

    return { success: true, payment_id: payment.id };
  } catch (error) {
    console.error("Error recording payment with notification:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown payment recording error",
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorString: String(error),
      context: "recordPaymentWithNotification",
    });
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Wrapper function to generate invoice and send notifications
 */
export async function generateInvoiceWithNotification(invoiceData: {
  customer_id: string;
  amountDue: number;
  due_date: string;
  currency?: string;
  items?: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  notes?: string;
  discount?: number;
  tax?: number;
}): Promise<{
  success: boolean;
  error?: string;
  invoice_id?: string;
  invoice_no?: string;
}> {
  try {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    const subtotal = invoiceData.amountDue;
    const discount = invoiceData.discount || 0;
    const tax = invoiceData.tax || 0;
    const grandTotal = subtotal - discount + tax;

    // Add thank you statement to notes if not already present
    const thankYouStatement =
      "\n\nThank you for your business! We appreciate your trust in Jay Kay Digital Press.";
    const finalNotes = invoiceData.notes
      ? `${invoiceData.notes}${thankYouStatement}`
      : `Thank you for your business! We appreciate your trust in Jay Kay Digital Press.`;

    // Create invoice in database
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        id: crypto.randomUUID(),
        invoiceNo: invoiceNumber,
        customer_id: invoiceData.customer_id,
        amountDue: invoiceData.amountDue,
        amountPaid: 0,
        due_date: invoiceData.due_date || todayIso,
        currency: invoiceData.currency || "SLL",
        items: invoiceData.items,
        status: "pending",
        payment_status: "pending",
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        grandTotal: grandTotal,
        notes: finalNotes,
        created_at: new Date().toISOString(),
      })
      .select("id, invoiceNo")
      .single();

    if (insertError || !invoice) {
      console.error("Invoice creation error:", insertError);
      return { success: false, error: "Failed to generate invoice" };
    }

    // Send notifications
    await notifyInvoiceGenerated({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo || invoiceNumber,
      customer_id: invoiceData.customer_id,
      amount: invoiceData.amountDue,
      due_date: invoiceData.due_date,
    });

    return {
      success: true,
      invoice_id: invoice.id,
      invoice_no: invoice.invoiceNo || invoiceNumber,
    };
  } catch (error) {
    console.error("Error generating invoice with notification:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Generate unique payment number
 */
async function generatePaymentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PAY-${currentYear}`;

  try {
    // Get the latest payment number for this year
    const { data: latestPayment, error } = await supabase
      .from("payments")
      .select("payment_number")
      .like("payment_number", `${prefix}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching latest payment:", {
        message:
          error instanceof Error
            ? error.message
            : "Unknown payment fetch error",
        error: error,
        code: error.code,
        context: "generatePaymentNumber",
      });
    }

    let nextNumber = 1;
    if (latestPayment?.payment_number) {
      const match = latestPayment.payment_number.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating payment number:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown payment number generation error",
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      context: "generatePaymentNumber",
    });
    // Fallback to timestamp-based number
    return `${prefix}-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Generate unique invoice number using counter system
 */
async function generateInvoiceNumber(): Promise<string> {
  try {
    // Use the database counter system to generate invoice number
    const { data: nextNumber, error } = await supabase.rpc("get_next_counter", {
      counter_name: "invoices",
    });

    if (error) {
      console.error("Error fetching next invoice counter:", error);
      // Fallback to timestamp-based number
      return `JKDP-INV-${Date.now().toString().slice(-4)}`;
    }

    // Generate formatted invoice number with JKDP-INV-xxxx format
    return `JKDP-INV-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based number
    return `JKDP-INV-${Date.now().toString().slice(-4)}`;
  }
}
