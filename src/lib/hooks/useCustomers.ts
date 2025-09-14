import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

// Simplified customer type for now
export interface Customer {
  id: string;
  customer_human_id: string;
  business_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

// Extended customer type with stats
export interface CustomerWithStats extends Customer {
  stats: {
    total_jobs: number;
    total_spent: number;
    last_payment: string | null;
  };
}

// Fetcher function for customers
const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('Fetching customers from Supabase...');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check for permission/RLS errors
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('🔒 ROW LEVEL SECURITY ERROR: Anonymous users do not have permission to read customers table');
        console.error('📝 To fix this, you need to create RLS policies in your Supabase database');
        console.error('🛠️  Run the SQL in enable-anonymous-access.sql or implement proper authentication');
        throw new Error('Database access denied. Please configure Row Level Security policies or implement authentication.');
      }
      
      // Check if it's an auth error and handle gracefully
      if (error.message.includes('refresh token') || error.message.includes('JWT')) {
        console.warn('Authentication issue, but continuing with anonymous access:', error.message);
        return [];
      }
      throw error;
    }
    
    console.log('Successfully fetched customers:', data?.length || 0);
    return (data as Customer[]) || [];
  } catch (error) {
    console.error('Error fetching customers - Full error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

// Fetcher for specific customer by human ID
const fetchCustomerById = async (customerHumanId: string): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_human_id', customerHumanId)
    .single();
  
  if (error) throw error;
  return data as Customer;
};

// Fetcher for customer with stats (jobs, payments, etc.)
const fetchCustomerWithStats = async (customerHumanId: string): Promise<CustomerWithStats> => {
  // Get customer details
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_human_id', customerHumanId)
    .single();
  
  if (customerError) throw customerError;

  // Get job count and total spent
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('total_amount')
    .eq('customer_human_id', customerHumanId);
  
  if (jobsError) throw jobsError;

  // Get payment history  
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('payment_date')
    .eq('customer_human_id', customerHumanId)
    .order('payment_date', { ascending: false })
    .limit(1);
  
  if (paymentsError) throw paymentsError;

  const totalJobs = jobs?.length || 0;
  const totalSpent = jobs?.reduce((sum: number, job: { total_amount?: number }) => 
    sum + (job.total_amount || 0), 0) || 0;
  const lastPayment = (payments as { payment_date?: string }[])?.[0]?.payment_date || null;

  return {
    ...(customer as Customer),
    stats: {
      total_jobs: totalJobs,
      total_spent: totalSpent,
      last_payment: lastPayment
    }
  };
};

// Hook to get all customers
export const useCustomers = () => {
  return useSWR('customers', fetchCustomers, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    errorRetryCount: 3
  });
};

// Hook to get specific customer by human ID
export const useCustomer = (customerHumanId: string | null) => {
  return useSWR(
    customerHumanId ? `customer-${customerHumanId}` : null,
    () => customerHumanId ? fetchCustomerById(customerHumanId) : null,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get customer with detailed stats
export const useCustomerWithStats = (customerHumanId: string | null) => {
  return useSWR(
    customerHumanId ? `customer-stats-${customerHumanId}` : null,
    () => customerHumanId ? fetchCustomerWithStats(customerHumanId) : null,
    {
      refreshInterval: 60000, // Refresh every minute for stats
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get customers with basic stats for dashboard
export const useCustomersWithStats = () => {
  return useSWR('customers-with-stats', async () => {
    const customers = await fetchCustomers();
    
    // Get stats for each customer in parallel
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        try {
          const stats = await fetchCustomerWithStats(customer.customer_human_id);
          return stats;
        } catch (error) {
          console.error(`Error fetching stats for ${customer.customer_human_id}:`, error);
          return {
            ...customer,
            stats: {
              total_jobs: 0,
              total_spent: 0,
              last_payment: null
            }
          };
        }
      })
    );
    
    return customersWithStats;
  }, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
    errorRetryCount: 2
  });
};

// Basic mutation functions for customer operations (simplified for now)
export const customerMutations = {
  // Get customer data for testing
  getCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    return data;
  }
};
