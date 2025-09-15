import useSWR from 'swr';
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
    .select('human_id, business_name');
  
  if (customersError) throw customersError;

  interface CustomerData {
    human_id: string;
    business_name: string;
  }

  // Create a lookup map for customer names
  const customerMap = new Map();
  (customers as CustomerData[])?.forEach((customer: CustomerData) => {
    customerMap.set(customer.human_id, customer.business_name);
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
    .eq('job_number', jobNumber)
    .single();
  
  if (jobError) throw jobError;

  // Get customer info
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('customer_id', (job as Job).customer_id || '')
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
const fetchJobsByCustomer = async (customerHumanId: string): Promise<JobWithCustomer[]> => {
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', customerHumanId)
    .order('created_at', { ascending: false });
  
  if (jobsError) throw jobsError;

  // Get customer name
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('business_name')
    .eq('human_id', customerHumanId)
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

// Hook to get all jobs
export const useJobs = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'jobs' : null, 
    fetchJobs, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get jobs with customer information
export const useJobsWithCustomers = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'jobs-with-customers' : null, 
    fetchJobsWithCustomers, 
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
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
export const useJobsByCustomer = (customerHumanId: string | null) => {
  return useSWR(
    customerHumanId ? `jobs-customer-${customerHumanId}` : null,
    () => customerHumanId ? fetchJobsByCustomer(customerHumanId) : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  );
};

// Hook to get job statistics
export const useJobStats = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'job-stats' : null, 
    async () => {
      const jobs = await fetchJobs();
      
      const totalJobs = jobs.length;
      const inProgress = jobs.filter(job => job.status === 'in_progress').length;
      const completed = jobs.filter(job => job.status === 'completed').length;
      const pending = jobs.filter(job => job.status === 'pending').length;
      const totalValue = jobs.reduce((sum, job) => sum + (job.final_cost || job.estimated_cost || 0), 0);
      const avgJobValue = totalJobs > 0 ? totalValue / totalJobs : 0;

      return {
        total_jobs: totalJobs,
        in_progress: inProgress,
        completed: completed,
        pending: pending,
        total_value: totalValue,
        avg_job_value: avgJobValue
      };
    }, 
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );
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
