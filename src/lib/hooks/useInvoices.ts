import useSWR, { mutate } from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/lib/database-generated.types';

// Enhanced Invoice Types
export interface EnhancedInvoice {
  id: string;
  invoiceNo: string | null;
  customer_id: string | null;
  customerName: string | null;
  
  // Enhanced fields
  invoice_status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  invoice_date: string;
  due_date: string | null;
  terms_days: number;
  
  // Financial
  subtotal: number | null;
  tax: number | null;
  taxRate: number | null;
  discount: number | null;
  discount_percentage: number;
  total: number | null;
  grandTotal: number | null;
  amountDue: number | null;
  amountPaid: number | null;
  
  // Enhanced tracking
  pdf_generated: boolean;
  pdf_url: string | null;
  last_sent_at: string | null;
  last_viewed_at: string | null;
  generated_by: string | null;
  template_id: string | null;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  
  // Relations
  payment_status: Database["public"]["Enums"]["payment_status"] | null;
  items: Record<string, unknown> | null; // JSON field for backward compatibility
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  line_order: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  service_id: string | null;
  job_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceTemplate {
  id: string;
  template_name: string;
  template_type: 'standard' | 'service' | 'product' | 'custom';
  is_default: boolean;
  header_html: string | null;
  footer_html: string | null;
  terms_conditions: string | null;
  payment_instructions: string | null;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  font_family: string;
  show_line_numbers: boolean;
  show_tax_breakdown: boolean;
  show_payment_terms: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

export interface CreateInvoiceData {
  customer_id: string;
  invoice_date?: string;
  due_date?: string;
  terms_days?: number;
  template_id?: string;
  notes?: string;
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at' | 'updated_at'>[];
}

export interface InvoiceWithCustomer extends EnhancedInvoice {
  customer_name?: string;
  customer_email?: string;
  line_items?: InvoiceLineItem[];
}

// Fetcher functions
const fetchInvoices = async (): Promise<InvoiceWithCustomer[]> => {
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(business_name, email)
    `)
    .order('created_at', { ascending: false });
  
  if (invoicesError) throw invoicesError;

  // Get line items for each invoice
  const invoicesWithLineItems = await Promise.all(
    (invoices || []).map(async (invoice) => {
      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('line_order');

      return {
        ...invoice,
        customer_name: invoice.customers?.business_name || 'Unknown Customer',
        customer_email: invoice.customers?.email || '',
        line_items: lineItems || []
      } as InvoiceWithCustomer;
    })
  );

  return invoicesWithLineItems;
};

const fetchInvoiceById = async (invoiceId: string): Promise<InvoiceWithCustomer> => {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      customers!inner(business_name, email, contact_person, phone, address)
    `)
    .eq('id', invoiceId)
    .single();
  
  if (invoiceError) throw invoiceError;

  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('line_order');

  return {
    ...invoice,
    customer_name: invoice.customers?.business_name || 'Unknown Customer',
    customer_email: invoice.customers?.email || '',
    line_items: lineItems || []
  } as InvoiceWithCustomer;
};

const fetchInvoiceTemplates = async (): Promise<InvoiceTemplate[]> => {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .order('is_default', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  
  // Get the next sequence number for this month
  const { data } = await supabase.rpc('generate_sequential_number', {
    counter_name: `invoice_${year}_${month}`,
    prefix: `INV-${year}${month}-`,
    year_prefix: false
  });
  
  return data || `INV-${year}${month}-001`;
};

// Main Hooks
export const useInvoices = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoices' : null,
    fetchInvoices,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

export const useInvoice = (invoiceId: string | null) => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session && invoiceId ? `invoice-${invoiceId}` : null,
    () => invoiceId ? fetchInvoiceById(invoiceId) : null,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

export const useInvoiceTemplates = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoice-templates' : null,
    fetchInvoiceTemplates,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      errorRetryCount: 2
    }
  );
};

// Invoice Actions Hook
export const useInvoiceActions = () => {
  const { user } = useAuth();

  const createInvoice = async (invoiceData: CreateInvoiceData): Promise<EnhancedInvoice> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Calculate due date
      const invoiceDate = invoiceData.invoice_date || new Date().toISOString().split('T')[0];
      const dueDate = invoiceData.due_date || (() => {
        const date = new Date(invoiceDate);
        date.setDate(date.getDate() + (invoiceData.terms_days || 30));
        return date.toISOString().split('T')[0];
      })();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoiceNo: invoiceNumber,
          customer_id: invoiceData.customer_id,
          invoice_date: invoiceDate,
          due_date: dueDate,
          terms_days: invoiceData.terms_days || 30,
          invoice_status: 'draft',
          template_id: invoiceData.template_id,
          generated_by: user.id,
          notes: invoiceData.notes,
          // Initialize financial fields
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          grandTotal: 0,
          amountDue: 0,
          amountPaid: 0
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      if (invoiceData.line_items.length > 0) {
        const lineItemsToInsert = invoiceData.line_items.map((item, index) => ({
          ...item,
          invoice_id: invoice.id,
          line_order: index + 1,
          total_price: (item.quantity || 1) * (item.unit_price || 0),
          tax_amount: ((item.quantity || 1) * (item.unit_price || 0)) * ((item.tax_rate || 0) / 100)
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) throw lineItemsError;
      }

      // Revalidate invoices list
      mutate('invoices');
      mutate(`invoice-${invoice.id}`);

      toast.success(`Invoice ${invoiceNumber} created successfully`);
      return invoice as EnhancedInvoice;

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
      throw error;
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<EnhancedInvoice>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Revalidate data
      mutate('invoices');
      mutate(`invoice-${invoiceId}`);

      toast.success('Invoice updated successfully');

    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
      throw error;
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: EnhancedInvoice['invoice_status']): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updates: Partial<EnhancedInvoice> = {
        invoice_status: status,
        updated_at: new Date().toISOString()
      };

      // Add status-specific timestamps
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

      // Revalidate data
      mutate('invoices');
      mutate(`invoice-${invoiceId}`);

      toast.success(`Invoice status updated to ${status}`);

    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
      throw error;
    }
  };

  const deleteInvoice = async (invoiceId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete line items first (cascade should handle this, but being explicit)
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      // Revalidate data
      mutate('invoices');

      toast.success('Invoice deleted successfully');

    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
      throw error;
    }
  };

  const createInvoiceFromJob = async (jobId: string): Promise<EnhancedInvoice> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      if (!job.customer_id) throw new Error('Job must have a customer');

      // Create line items from job
      const lineItems = [{
        description: job.title || job.description || 'Print Job',
        quantity: job.quantity || 1,
        unit_price: job.final_cost || job.estimated_cost || 0,
        total_price: job.final_cost || job.estimated_cost || 0,
        line_order: 1,
        discount_amount: 0,
        tax_rate: 15, // Default tax rate
        tax_amount: ((job.final_cost || job.estimated_cost || 0) * 15) / 100,
        service_id: job.service_id,
        job_id: jobId
      }];

      // Create invoice
      const invoice = await createInvoice({
        customer_id: job.customer_id,
        line_items: lineItems
      });

      // Update job to mark as invoiced
      await supabase
        .from('jobs')
        .update({
          invoiced: true,
          invoice_id: invoice.id,
          invoiceNo: invoice.invoiceNo
        })
        .eq('id', jobId);

      return invoice;

    } catch (error) {
      console.error('Error creating invoice from job:', error);
      toast.error('Failed to create invoice from job');
      throw error;
    }
  };

  return {
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    createInvoiceFromJob,
    isLoading: false // You can add loading states as needed
  };
};

// Invoice Statistics Hook
export const useInvoiceStats = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoice-stats' : null,
    async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_status, total, grandTotal, amountPaid, created_at');

      if (!invoices) return null;

      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalOutstanding = totalRevenue - totalPaid;

      const statusCounts = invoices.reduce((acc, inv) => {
        acc[inv.invoice_status || 'draft'] = (acc[inv.invoice_status || 'draft'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Overdue invoices (due date passed and not paid)
      const today = new Date();
      const overdue = invoices.filter(inv => {
        const dueDate = new Date(inv.created_at || '');
        dueDate.setDate(dueDate.getDate() + 30); // Assuming 30 day terms
        return dueDate < today && inv.invoice_status !== 'paid';
      }).length;

      return {
        totalInvoices,
        totalRevenue,
        totalPaid,
        totalOutstanding,
        statusCounts,
        overdueCount: overdue,
        collectionRate: totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0
      };
    },
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );
};