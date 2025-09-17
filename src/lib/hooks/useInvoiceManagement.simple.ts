import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Enhanced Invoice interfaces
export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_order?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  job_id?: string;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceFormData {
  customer_id: string;
  invoice_date: string;
  due_date?: string;
  terms_days: number;
  notes: string;
  template_id?: string;
  line_items: Omit<
    InvoiceLineItem,
    "id" | "invoice_id" | "created_at" | "updated_at"
  >[];
}

export interface CreateInvoiceFromJobData
  extends Omit<InvoiceFormData, "line_items"> {
  job_id: string;
  line_items: Omit<
    InvoiceLineItem,
    "id" | "invoice_id" | "created_at" | "updated_at"
  >[];
}

// Simple actions for creating invoices
export const useInvoiceActions = () => {
  const { user } = useAuth();

  const createInvoice = async (formData: InvoiceFormData) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Calculate totals
      const subtotal = formData.line_items.reduce(
        (sum, item) => sum + (item.total_price || 0),
        0,
      );
      const taxTotal = formData.line_items.reduce(
        (sum, item) => sum + (item.tax_amount || 0),
        0,
      );
      const discountTotal = formData.line_items.reduce(
        (sum, item) => sum + (item.discount_amount || 0),
        0,
      );
      const total = subtotal + taxTotal - discountTotal;

      // Create invoice
      const invoiceData = {
        id: crypto.randomUUID(),
        invoiceNo: invoiceNumber,
        customer_id: formData.customer_id,
        status: "draft",
        payment_status: "pending" as const,
        created_at: new Date().toISOString(),
        due_date: formData.due_date,
        subtotal: subtotal,
        tax: taxTotal,
        discount: discountTotal,
        total: total,
        amountDue: total,
        amountPaid: 0,
        notes: formData.notes,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      if (formData.line_items.length > 0) {
        const lineItemsData = formData.line_items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          service_id: item.service_id,
          created_at: new Date().toISOString(),
        }));

        const { error: lineItemsError } = await supabase
          .from("invoice_line_items")
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      toast.success("Invoice created successfully");
      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
      throw error;
    }
  };

  const createInvoiceFromJob = async (
    jobId: string,
    formData: InvoiceFormData,
  ) => {
    // For now, just create a regular invoice
    // In the future, this could link to the job
    return createInvoice(formData);
  };

  return {
    createInvoice,
    createInvoiceFromJob,
  };
};
