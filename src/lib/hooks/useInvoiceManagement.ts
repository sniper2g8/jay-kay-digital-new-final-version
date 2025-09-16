import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export interface InvoiceTemplate {
  id: string;
  template_name: string;
  template_type: 'standard' | 'service' | 'product' | 'custom';
  is_default: boolean;
  header_html?: string;
  footer_html?: string;
  terms_conditions?: string;
  payment_instructions?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  font_family?: string;
  show_line_numbers?: boolean;
  show_tax_breakdown?: boolean;
  show_payment_terms?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface EnhancedInvoice {
  id: string;
  invoiceNo: string;
  customer_id: string;
  customerName?: string;
  invoice_status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  invoice_date: string;
  due_date: string;
  terms_days: number;
  
  // Financial
  subtotal: number;
  tax: number;
  taxRate?: number;
  discount: number;
  discount_percentage?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Content
  notes?: string;
  payment_instructions?: string;
  template_id?: string;
  
  // Status tracking
  pdf_generated?: boolean;
  pdf_url?: string;
  last_sent_at?: string;
  last_viewed_at?: string;
  
  // References
  generated_by?: string;
  payment_status?: string;
  
  // Line items
  line_items?: InvoiceLineItem[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  customer_id: string;
  invoice_date: string;
  due_date?: string;
  terms_days: number;
  notes?: string;
  template_id?: string;
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at' | 'updated_at'>[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  allocated_amount: number;
  allocation_date: string;
  allocation_type: 'payment' | 'credit' | 'adjustment';
  notes?: string;
  created_by?: string;
  created_at: string;
}

// Fetcher functions
const fetchInvoiceTemplates = async (): Promise<InvoiceTemplate[]> => {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('template_name');
  
  if (error) throw error;
  return data || [];
};

const fetchInvoiceWithLineItems = async (invoiceId: string): Promise<EnhancedInvoice> => {
  // Fetch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(business_name)
    `)
    .eq('id', invoiceId)
    .single();
  
  if (invoiceError) throw invoiceError;

  // Fetch line items
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('line_order');
  
  if (lineItemsError) throw lineItemsError;

  return {
    ...invoice,
    customerName: invoice.customers?.business_name,
    line_items: lineItems || []
  } as EnhancedInvoice;
};

const fetchInvoicesWithDetails = async (): Promise<EnhancedInvoice[]> => {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(business_name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return (invoices || []).map(invoice => ({
    ...invoice,
    customerName: invoice.customers?.business_name
  })) as EnhancedInvoice[];
};

// Invoice Generation Functions
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const { data } = await supabase.rpc('generate_sequential_number', {
    counter_name: 'invoice_numbers',
    prefix: `INV-${year}-`,
    year_prefix: false
  });
  
  return data || `INV-${year}-${Date.now()}`;
};

const createInvoiceFromJob = async (jobId: string, formData: Partial<InvoiceFormData>): Promise<EnhancedInvoice> => {
  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(`
      *,
      customers!inner(id, business_name)
    `)
    .eq('id', jobId)
    .single();
  
  if (jobError) throw jobError;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();
  
  // Calculate due date
  const invoiceDate = formData.invoice_date || new Date().toISOString().split('T')[0];
  const termsDays = formData.terms_days || 30;
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + termsDays);

  // Create invoice
  const invoiceData = {
    invoiceNo: invoiceNumber,
    customer_id: job.customer_id,
    customerName: job.customers.business_name,
    invoice_status: 'draft',
    invoice_date: invoiceDate,
    due_date: dueDate.toISOString().split('T')[0],
    terms_days: termsDays,
    notes: formData.notes || `Invoice for Job #${job.jobNo || job.id}`,
    template_id: formData.template_id,
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    amountPaid: 0,
    amountDue: 0
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;

  // Create line items from job
  const lineItems = [];
  
  // Main service line item
  if (job.serviceName && job.final_cost) {
    lineItems.push({
      invoice_id: invoice.id,
      description: `${job.serviceName} - ${job.title || 'Print Job'}`,
      quantity: job.quantity || 1,
      unit_price: job.final_cost / (job.quantity || 1),
      total_price: job.final_cost,
      line_order: 1,
      job_id: job.id,
      service_id: job.service_id
    });
  }

  // Add finishing options as separate line items
  if (job.finishOptions && Array.isArray(job.finishOptions)) {
    job.finishOptions.forEach((finish: { name: string; price: number }, index: number) => {
      if (finish.price > 0) {
        lineItems.push({
          invoice_id: invoice.id,
          description: `Finishing: ${finish.name}`,
          quantity: 1,
          unit_price: finish.price,
          total_price: finish.price,
          line_order: index + 2,
          job_id: job.id
        });
      }
    });
  }

  // Insert line items
  if (lineItems.length > 0) {
    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItems);
    
    if (lineItemsError) throw lineItemsError;
  }

  // Update job to mark as invoiced
  await supabase
    .from('jobs')
    .update({ 
      invoiced: true, 
      invoice_id: invoice.id,
      invoiceNo: invoiceNumber
    })
    .eq('id', jobId);

  // Fetch and return complete invoice
  return await fetchInvoiceWithLineItems(invoice.id);
};

const createInvoice = async (formData: InvoiceFormData): Promise<EnhancedInvoice> => {
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();
  
  // Calculate due date if not provided
  const dueDate = formData.due_date || (() => {
    const date = new Date(formData.invoice_date);
    date.setDate(date.getDate() + formData.terms_days);
    return date.toISOString().split('T')[0];
  })();

  // Calculate totals
  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const taxTotal = formData.line_items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const discountTotal = formData.line_items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const total = subtotal + taxTotal - discountTotal;

  // Create invoice
  const invoiceData = {
    invoiceNo: invoiceNumber,
    customer_id: formData.customer_id,
    invoice_status: 'draft',
    invoice_date: formData.invoice_date,
    due_date: dueDate,
    terms_days: formData.terms_days,
    notes: formData.notes,
    template_id: formData.template_id,
    subtotal,
    tax: taxTotal,
    discount: discountTotal,
    total,
    amountDue: total,
    amountPaid: 0
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;

  // Create line items
  const lineItemsData = formData.line_items.map((item, index) => ({
    ...item,
    invoice_id: invoice.id,
    line_order: index + 1
  }));

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsData);
  
  if (lineItemsError) throw lineItemsError;

  // Fetch and return complete invoice
  return await fetchInvoiceWithLineItems(invoice.id);
};

const updateInvoiceStatus = async (invoiceId: string, status: string, notes?: string): Promise<void> => {
  const updates: Record<string, string> = { 
    invoice_status: status,
    updated_at: new Date().toISOString()
  };

  // Set status-specific timestamps
  if (status === 'sent') {
    updates.last_sent_at = new Date().toISOString();
  } else if (status === 'viewed') {
    updates.last_viewed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId);
  
  if (error) throw error;

  // Create status history entry with notes
  if (notes) {
    await supabase
      .from('invoice_status_history')
      .insert([{
        invoice_id: invoiceId,
        status_to: status,
        reason: 'Manual status update',
        notes
      }]);
  }
};

// Hooks
export const useInvoiceTemplates = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoice-templates' : null,
    fetchInvoiceTemplates,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

export const useInvoiceWithLineItems = (invoiceId: string | null) => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session && invoiceId ? `invoice-details-${invoiceId}` : null,
    () => invoiceId ? fetchInvoiceWithLineItems(invoiceId) : null,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

export const useInvoicesWithDetails = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoices-with-details' : null,
    fetchInvoicesWithDetails,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Invoice Management Actions
export const useInvoiceActions = () => {
  return {
    createInvoice: async (formData: InvoiceFormData) => {
      try {
        const invoice = await createInvoice(formData);
        toast.success('Invoice created successfully');
        return invoice;
      } catch (error) {
        console.error('Error creating invoice:', error);
        toast.error('Failed to create invoice');
        throw error;
      }
    },

    createInvoiceFromJob: async (jobId: string, formData: Partial<InvoiceFormData>) => {
      try {
        const invoice = await createInvoiceFromJob(jobId, formData);
        toast.success('Invoice created from job successfully');
        return invoice;
      } catch (error) {
        console.error('Error creating invoice from job:', error);
        toast.error('Failed to create invoice from job');
        throw error;
      }
    },

    updateInvoiceStatus: async (invoiceId: string, status: string, notes?: string) => {
      try {
        await updateInvoiceStatus(invoiceId, status, notes);
        toast.success(`Invoice ${status} successfully`);
      } catch (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Failed to update invoice status');
        throw error;
      }
    },

    deleteInvoice: async (invoiceId: string) => {
      try {
        // First delete line items
        await supabase
          .from('invoice_line_items')
          .delete()
          .eq('invoice_id', invoiceId);

        // Then delete invoice
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId);
        
        if (error) throw error;
        
        toast.success('Invoice deleted successfully');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
        throw error;
      }
    }
  };
};

export default useInvoiceActions;