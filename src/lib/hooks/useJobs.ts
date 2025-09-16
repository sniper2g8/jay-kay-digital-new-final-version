import useSWR, { mutate } from 'swr';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/lib/database-generated.types';

type Json = Database['public']['Tables']['jobs']['Row']['delivery'];

// Job interface - updated to match database schema
export interface Job {
  id: string;
  jobNo: string | null;
  customer_id: string | null;
  customerName: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: Database["public"]["Enums"]["priority_level"] | null;
  quantity: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  assigned_to: string | null;
  job_type: Database["public"]["Enums"]["job_type_enum"] | null;
  service_id: string | null;
  serviceName: string | null;
  invoice_id: string | null;
  invoiced: boolean | null;
  invoiceNo: string | null;
  qr_code: string | null;
  tracking_url: string | null;
  submittedDate: string | null;
  dueDate: Json | null;
  delivery: Json | null;
  estimate: Json | null;
  files: Json | null;
  finishIds: Json | null;
  finishOptions: Json | null;
  finishPrices: Json | null;
  lf: Json | null;
  paper: Json | null;
  size: Json | null;
  specifications: Json | null;
  __open: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  createdAt: Json | null;
  createdBy: string | null;
  updatedAt: Json | null;
}

// Job with customer information
export interface JobWithCustomer extends Job {
  customer_name?: string;
}

// Fetcher function for jobs
const fetchJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data as Job[]) || [];
};

// Fetcher for jobs with customer names
const fetchJobsWithCustomers = async (): Promise<JobWithCustomer[]> => {
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (jobsError) throw jobsError;

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, business_name');
  
  if (customersError) throw customersError;

  interface CustomerData {
    id: string;
    business_name: string;
  }

  // Create a lookup map for customer names
  const customerMap = new Map();
  (customers as CustomerData[])?.forEach((customer: CustomerData) => {
    customerMap.set(customer.id, customer.business_name);
  });

  // Add customer names to jobs
  const jobsWithCustomers = (jobs as Job[])?.map((job: Job) => ({
    ...job,
    customer_name: customerMap.get(job.customer_id || '') || 'Unknown Customer'
  })) || [];

  return jobsWithCustomers as JobWithCustomer[];
};

// Fetcher for specific job by job number
const fetchJobByNumber = async (jobNumber: string): Promise<JobWithCustomer> => {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('jobNo', jobNumber)
    .single();
  
  if (jobError) throw jobError;

  // Get customer info
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('id', (job as Job).customer_id || '')
    .single();
  
  if (customerError) throw customerError;

  interface CustomerNameData {
    business_name: string;
  }

  return {
    ...(job as Job),
    customer_name: (customer as CustomerNameData).business_name
  } as JobWithCustomer;
};

// Fetcher for jobs by customer
const fetchJobsByCustomer = async (customerId: string): Promise<JobWithCustomer[]> => {
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (jobsError) throw jobsError;

  // Get customer name
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('id', customerId)
    .single();
  
  if (customerError) throw customerError;

  interface CustomerNameData {
    business_name: string;
  }

  const jobsWithCustomer = (jobs as Job[])?.map((job: Job) => ({
    ...job,
    customer_name: (customer as CustomerNameData).business_name
  })) || [];

  return jobsWithCustomer as JobWithCustomer[];
};

// Hook to get all jobs with real-time updates
export const useJobs = () => {
  const { user, session } = useAuth();
  
  const swrResult = useSWR(
    user && session ? 'jobs' : null, 
    fetchJobs, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds as fallback
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !session) return;

    const subscription = supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Real-time job update:', payload);
          // Revalidate SWR cache when jobs table changes
          mutate('jobs');
          // Also revalidate related caches
          mutate('jobs-with-customers');
          mutate('job-stats');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, session]);

  return swrResult;
};

// Hook to get jobs with customer information and real-time updates
export const useJobsWithCustomers = () => {
  const { user, session } = useAuth();
  
  const swrResult = useSWR(
    user && session ? 'jobs-with-customers' : null, 
    fetchJobsWithCustomers, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds as fallback
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );

  // Set up real-time subscription for both jobs and customers
  useEffect(() => {
    if (!user || !session) return;

    const subscription = supabase
      .channel('jobs-customers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Real-time job update for jobs-with-customers:', payload);
          mutate('jobs-with-customers');
          mutate('jobs');
          mutate('job-stats');
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          console.log('Real-time customer update:', payload);
          mutate('jobs-with-customers');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, session]);

  return swrResult;
};

// Hook to get specific job by job number
export const useJob = (jobNumber: string | null) => {
  return useSWR(
    jobNumber ? `job-${jobNumber}` : null,
    () => jobNumber ? fetchJobByNumber(jobNumber) : null,
    {
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get jobs for specific customer
export const useJobsByCustomer = (customerId: string | null) => {
  return useSWR(
    customerId ? `jobs-customer-${customerId}` : null,
    () => customerId ? fetchJobsByCustomer(customerId) : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get job statistics with real-time updates and improved pricing calculation
export const useJobStats = () => {
  const { user, session } = useAuth();
  
  const swrResult = useSWR(
    user && session ? 'job-stats' : null, 
    async () => {
      const jobs = await fetchJobs();
      
      const totalJobs = jobs.length;
      const inProgress = jobs.filter(job => job.status === 'in_progress').length;
      const completed = jobs.filter(job => job.status === 'completed').length;
      const pending = jobs.filter(job => job.status === 'pending').length;
      
      // Improved value calculation that consolidates estimate fields
      let totalValue = 0;
      let jobsWithPricing = 0;
      
      jobs.forEach(job => {
        let jobValue = 0;
        
        // Priority order: final_cost -> estimated_cost -> estimate JSON
        if (job.final_cost && job.final_cost > 0) {
          jobValue = job.final_cost;
        } else if (job.estimated_cost && job.estimated_cost > 0) {
          jobValue = job.estimated_cost;
        } else if (job.estimate && typeof job.estimate === 'object') {
          // Extract pricing from JSON estimate field - based on database analysis
          const estimate = job.estimate as any;
          // Database analysis shows all jobs use estimate.total field
          if (estimate.total && estimate.total > 0) {
            jobValue = parseFloat(estimate.total);
          } else if (estimate.total_price && estimate.total_price > 0) {
            jobValue = parseFloat(estimate.total_price);
          } else if (estimate.totalPrice && estimate.totalPrice > 0) {
            jobValue = parseFloat(estimate.totalPrice);
          } else if (estimate.price && estimate.price > 0) {
            jobValue = parseFloat(estimate.price);
          } else if (estimate.cost && estimate.cost > 0) {
            jobValue = parseFloat(estimate.cost);
          } else if (estimate.amount && estimate.amount > 0) {
            jobValue = parseFloat(estimate.amount);
          }
        }
        
        if (jobValue > 0) {
          totalValue += jobValue;
          jobsWithPricing++;
        }
      });
      
      const avgJobValue = jobsWithPricing > 0 ? totalValue / jobsWithPricing : 0;

      return {
        total_jobs: totalJobs,
        in_progress: inProgress,
        completed: completed,
        pending: pending,
        total_value: totalValue,
        avg_job_value: avgJobValue,
        jobs_with_pricing: jobsWithPricing,
        pricing_coverage: jobsWithPricing / totalJobs * 100
      };
    }, 
    {
      refreshInterval: 60000, // Refresh every minute as fallback
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );

  // Set up real-time subscription for job statistics
  useEffect(() => {
    if (!user || !session) return;

    const subscription = supabase
      .channel('job-stats-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Real-time job update for job-stats:', payload);
          mutate('job-stats');
          mutate('jobs');
          mutate('jobs-with-customers');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, session]);

  return swrResult;
};

// Basic mutation functions for job operations
export const jobMutations = {
  // Get job data for testing
  getJobs: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    return data;
  }
};
