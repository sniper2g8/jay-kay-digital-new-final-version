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

  const formatSupabaseError = (err: unknown) => {
    try {
      if (!err) return "Unknown error";
      if (typeof err === "string") return err;
      if (err instanceof Error) {
        const anyErr = err as any;
        return {
          name: err.name,
          message: err.message,
          code: anyErr?.code,
          details: anyErr?.details,
          hint: anyErr?.hint,
          status: anyErr?.status,
          raw: JSON.stringify(anyErr, Object.getOwnPropertyNames(anyErr)),
        };
      }
      if (typeof err === "object") return JSON.stringify(err);
      return String(err);
    } catch (e) {
      return `Unformattable error: ${String(err)}`;
    }
  };

  const createInvoice = async (formData: InvoiceFormData) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Generate invoice number using counter system
      const { data: nextNumber, error: counterError } = await supabase.rpc(
        "get_next_counter",
        { counter_name: "invoices" }
      );

      if (counterError) {
        console.error("Error fetching next invoice counter:", counterError, JSON.stringify(counterError));
        throw new Error("Failed to generate invoice number. Please try again.");
      }

      const invoiceNumber = `JKDP-INV-${String(nextNumber).padStart(4, '0')}`;

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

      // Add thank you statement to notes if not already present
      const thankYouStatement = "\n\nThank you for your business! We appreciate your trust in Jay Kay Digital Press.";
      const finalNotes = formData.notes ? 
        `${formData.notes}${thankYouStatement}` : 
        `Thank you for your business! We appreciate your trust in Jay Kay Digital Press.`;

      // Look up customer name (non-null requirement)
      let customerName: string | null = null;
      if (formData.customer_id) {
        const { data: customerRow, error: customerLookupError } = await supabase
          .from('customers')
          .select('business_name')
          .eq('id', formData.customer_id)
          .single();
        if (customerLookupError) {
          console.error('Customer lookup failed:', customerLookupError);
        }
        customerName = customerRow?.business_name || null;
      }

      // Create invoice
      const todayIsoDate = new Date().toISOString().slice(0,10);
      const invoiceData = {
        id: crypto.randomUUID(),
        invoiceNo: invoiceNumber,
        customer_id: formData.customer_id,
        customerName: customerName || 'Unknown Customer',
        status: "draft",
        payment_status: "pending" as const,
        created_at: new Date().toISOString(),
        due_date: formData.due_date || formData.invoice_date || todayIsoDate,
        subtotal: subtotal,
        tax: taxTotal,
        discount: discountTotal,
        total: total,
        amountDue: total,
        amountPaid: 0,
        currency: 'SLL',
        notes: finalNotes,
      };

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert([invoiceData]);

      if (invoiceError) {
        console.error("Supabase insert error (invoices):", invoiceError, JSON.stringify(invoiceError));
        throw invoiceError;
      }

      // Create line items
      if (formData.line_items.length > 0) {
        const lineItemsData = formData.line_items.map((item) => ({
          invoice_id: invoiceData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          // invoice_items does not have service_id; omit it
          // Optional fields in invoice_items:
          job_id: item.job_id ?? null,
          job_no: (item as any).job_no ?? null,
          notes: (item as any).notes ?? null,
          created_at: new Date().toISOString(),
        }));

        const { error: lineItemsError } = await supabase
          .from("invoice_items")
          .insert(lineItemsData);

        if (lineItemsError) {
          console.error("Supabase insert error (invoice_items):", lineItemsError, JSON.stringify(lineItemsError));
          throw lineItemsError;
        }
      }

      toast.success("Invoice created successfully");
      // Mark related jobs as invoiced to prevent double charging
      try {
        const jobIds = formData.line_items
          .map((i) => i.job_id)
          .filter(Boolean) as string[];
        if (jobIds.length > 0) {
          const { error: jobsUpdateError } = await supabase
            .from('jobs')
            .update({ invoiced: true, invoice_id: invoiceData.id, invoiceNo: invoiceData.invoiceNo })
            .in('id', jobIds);
          if (jobsUpdateError) {
            console.warn('Failed to mark jobs invoiced:', jobsUpdateError);
          }
        }
      } catch (e) {
        console.warn('Jobs invoiced update failed:', e);
      }
      return invoiceData;
    } catch (error) {
      console.error("Error creating invoice:", formatSupabaseError(error), error);
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
