import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database-generated.types';

type Json = Database['public']['Tables']['invoices']['Row']['items'];

// Payment interface
export interface Payment {
  id: string;
  payment_number: string;
  customer_human_id: string;
  invoice_no: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  received_by?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Invoice interface - updated to match database schema
export interface Invoice {
  id: string;
  invoiceNo: string | null;
  customer_id: string | null;
  customerName: string | null;
  amountDue: number | null;
  amountPaid: number | null;
  subtotal: number | null;
  tax: number | null;
  taxRate: number | null;
  taxable: number | null;
  discount: number | null;
  grandTotal: number | null;
  total: number | null;
  currency: string | null;
  status: string | null;
  payment_status: Database["public"]["Enums"]["payment_status"] | null;
  issueDate: Json | null;
  due_date: string | null;
  dueDate: Json | null;
  payment_link: string | null;
  invoice_qr: string | null;
  notes: string | null;
  items: Json | null;
  created_at: string | null;
  updated_at: string | null;
  createdAt: Json | null;
  updatedAt: Json | null;
}

// Extended types with customer info
export interface PaymentWithCustomer extends Payment {
  customer_name?: string;
}

export interface InvoiceWithCustomer extends Invoice {
  customer_name?: string;
}

// Fetcher function for payments
const fetchPayments = async (): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });
  
  if (error) throw error;
  return (data as Payment[]) || [];
};

// Fetcher function for invoices
const fetchInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data as Invoice[]) || [];
};

// Fetcher for payments with customer names
const fetchPaymentsWithCustomers = async (): Promise<PaymentWithCustomer[]> => {
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });
  
  if (paymentsError) throw paymentsError;

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, human_id, business_name');
  
  if (customersError) throw customersError;

  interface CustomerData {
    id: string;
    human_id: string | null;
    business_name: string;
  }

  // Create a lookup map for customer names using customer.id as key
  const customerMap = new Map();
  (customers as CustomerData[])?.forEach((customer: CustomerData) => {
    customerMap.set(customer.id, customer.business_name);
    // Also map by human_id if it exists for backward compatibility
    if (customer.human_id) {
      customerMap.set(customer.human_id, customer.business_name);
    }
  });

  // Add customer names to payments
  const paymentsWithCustomers = (payments as Payment[])?.map((payment: Payment) => ({
    ...payment,
    customer_name: customerMap.get(payment.customer_human_id) || 'Unknown Customer'
  })) || [];

  return paymentsWithCustomers as PaymentWithCustomer[];
};

// Fetcher for invoices with customer names
const fetchInvoicesWithCustomers = async (): Promise<InvoiceWithCustomer[]> => {
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (invoicesError) throw invoicesError;

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, human_id, business_name');
  
  if (customersError) throw customersError;

  interface CustomerData {
    id: string;
    human_id: string | null;
    business_name: string;
  }

  // Create a lookup map for customer names using customer.id as key
  const customerMap = new Map();
  (customers as CustomerData[])?.forEach((customer: CustomerData) => {
    customerMap.set(customer.id, customer.business_name);
    // Also map by human_id if it exists for backward compatibility
    if (customer.human_id) {
      customerMap.set(customer.human_id, customer.business_name);
    }
  });

  // Add customer names to invoices
  const invoicesWithCustomers = (invoices as Invoice[])?.map((invoice: Invoice) => ({
    ...invoice,
    customer_name: customerMap.get(invoice.customer_id || '') || 'Unknown Customer'
  })) || [];

  return invoicesWithCustomers as InvoiceWithCustomer[];
};

// Fetcher for payments by customer
const fetchPaymentsByCustomer = async (customerHumanId: string): Promise<PaymentWithCustomer[]> => {
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_human_id', customerHumanId)
    .order('payment_date', { ascending: false });
  
  if (paymentsError) throw paymentsError;

  // Get customer name
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('customer_human_id', customerHumanId)
    .single();
  
  if (customerError) throw customerError;

  interface CustomerNameData {
    business_name: string;
  }

  const paymentsWithCustomer = (payments as Payment[])?.map((payment: Payment) => ({
    ...payment,
    customer_name: (customer as CustomerNameData).business_name
  })) || [];

  return paymentsWithCustomer as PaymentWithCustomer[];
};

// Fetcher for invoices by customer
const fetchInvoicesByCustomer = async (customerHumanId: string): Promise<InvoiceWithCustomer[]> => {
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_human_id', customerHumanId)
    .order('created_at', { ascending: false });
  
  if (invoicesError) throw invoicesError;

  // Get customer name
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('customer_human_id', customerHumanId)
    .single();
  
  if (customerError) throw customerError;

  interface CustomerNameData {
    business_name: string;
  }

  const invoicesWithCustomer = (invoices as Invoice[])?.map((invoice: Invoice) => ({
    ...invoice,
    customer_name: (customer as CustomerNameData).business_name
  })) || [];

  return invoicesWithCustomer as InvoiceWithCustomer[];
};

// Hook to get all payments
export const usePayments = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'payments' : null, 
    fetchPayments, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get all invoices
export const useInvoices = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoices' : null, 
    fetchInvoices, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get payments with customer information
export const usePaymentsWithCustomers = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'payments-with-customers' : null, 
    fetchPaymentsWithCustomers, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get invoices with customer information
export const useInvoicesWithCustomers = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'invoices-with-customers' : null, 
    fetchInvoicesWithCustomers, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get payments for specific customer
export const usePaymentsByCustomer = (customerHumanId: string | null) => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session && customerHumanId ? `payments-customer-${customerHumanId}` : null,
    () => customerHumanId ? fetchPaymentsByCustomer(customerHumanId) : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get invoices for specific customer
export const useInvoicesByCustomer = (customerHumanId: string | null) => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session && customerHumanId ? `invoices-customer-${customerHumanId}` : null,
    () => customerHumanId ? fetchInvoicesByCustomer(customerHumanId) : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get financial statistics
export const useFinancialStats = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'financial-stats' : null, 
    async () => {
      const [invoices, payments] = await Promise.all([
        fetchInvoices(),
        fetchPayments()
      ]);
      
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || invoice.grandTotal || 0), 0);
      const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.payment_status === 'pending');
      const totalPending = pendingInvoices.reduce((sum, invoice) => sum + (invoice.total || invoice.grandTotal || 0), 0);
      const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

      return {
        total_revenue: totalRevenue,
        total_paid: totalPaid,
        total_pending: totalPending,
        paid_invoices_count: paidInvoices.length,
        pending_invoices_count: pendingInvoices.length,
        total_invoices: invoices.length,
        total_payments: payments.length,
        collection_rate: Math.round(collectionRate)
      };
    }, 
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );
};

// Basic mutation functions for financial operations
export const financialMutations = {
  // Get payment data for testing
  getPayments: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    return data;
  },

  // Get invoice data for testing
  getInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    return data;
  }
};
