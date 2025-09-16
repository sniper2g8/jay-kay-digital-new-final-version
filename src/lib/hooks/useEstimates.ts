import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

export interface CustomerEstimate {
  id: string;
  estimate_number: string;
  customer_id: string;
  customer_name: string;
  title: string;
  description?: string;
  specifications?: Record<string, unknown>;
  unit_price?: number;
  quantity: number;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  expires_at?: string;
  customer_response?: string;
  approved_by?: string;
  converted_to_job_id?: string;
  created_by?: string;
  version: number;
  is_current_version: boolean;
  parent_estimate_id?: string;
}

export interface EstimateFormData {
  customer_id: string;
  customer_name: string;
  title: string;
  description: string;
  specifications: Record<string, unknown>;
  unit_price: number;
  quantity: number;
  tax_rate: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expires_in_days: number;
}

// Fetcher function for estimates
const estimatesFetcher = async () => {
  const { data, error } = await supabase
    .from('customer_estimates')
    .select(`
      *,
      customers (
        id,
        name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Hook for fetching all estimates
export function useEstimates() {
  return useSWR('/api/estimates', estimatesFetcher);
}

// Hook for fetching single estimate
export function useEstimate(estimateId: string | null) {
  return useSWR(
    estimateId ? `/api/estimates/${estimateId}` : null,
    async () => {
      if (!estimateId) return null;
      
      const { data, error } = await supabase
        .from('customer_estimates')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', estimateId)
        .single();

      if (error) throw error;
      return data;
    }
  );
}

// Hook for customer's estimates (for customer portal)
export function useCustomerEstimates(customerId: string | null) {
  return useSWR(
    customerId ? `/api/customer/${customerId}/estimates` : null,
    async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('customer_estimates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  );
}

// Hook for estimates statistics
export function useEstimateStats() {
  return useSWR('/api/estimates/stats', async () => {
    const { data: estimates, error } = await supabase
      .from('customer_estimates')
      .select('status, total_amount, created_at')
      .eq('is_current_version', true);

    if (error) throw error;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      total_estimates: estimates.length,
      draft: estimates.filter(e => e.status === 'draft').length,
      sent: estimates.filter(e => e.status === 'sent').length,
      approved: estimates.filter(e => e.status === 'approved').length,
      rejected: estimates.filter(e => e.status === 'rejected').length,
      pending: estimates.filter(e => ['sent', 'viewed'].includes(e.status)).length,
      total_value: estimates.reduce((sum, e) => sum + (e.total_amount || 0), 0),
      approved_value: estimates
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.total_amount || 0), 0),
      this_month_estimates: estimates.filter(e => 
        new Date(e.created_at) >= thisMonth
      ).length,
      conversion_rate: estimates.length > 0 
        ? (estimates.filter(e => e.status === 'approved').length / estimates.length * 100)
        : 0
    };

    return stats;
  });
}

// Estimate management functions
export function useEstimateActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEstimate = async (formData: EstimateFormData) => {
    setIsSubmitting(true);
    try {
      // Generate estimate number
      const { data: lastEstimate } = await supabase
        .from('customer_estimates')
        .select('estimate_number')
        .order('created_at', { ascending: false })
        .limit(1);

      let estimateNumber = 'JKDP-EST-0001';
      if (lastEstimate && lastEstimate.length > 0) {
        const lastNumber = parseInt(lastEstimate[0].estimate_number.split('-')[2]);
        estimateNumber = `JKDP-EST-${String(lastNumber + 1).padStart(4, '0')}`;
      }

      // Calculate totals
      const subtotal = (formData.unit_price || 0) * formData.quantity;
      const tax_amount = subtotal * (formData.tax_rate / 100);
      const total_amount = subtotal + tax_amount;

      // Set expiration date
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + formData.expires_in_days);

      const { data, error } = await supabase
        .from('customer_estimates')
        .insert({
          estimate_number: estimateNumber,
          customer_id: formData.customer_id,
          customer_name: formData.customer_name,
          title: formData.title,
          description: formData.description,
          specifications: formData.specifications,
          unit_price: formData.unit_price,
          quantity: formData.quantity,
          subtotal,
          tax_amount,
          total_amount,
          priority: formData.priority,
          expires_at: expires_at.toISOString(),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEstimateStatus = async (estimateId: string, status: CustomerEstimate['status'], customerResponse?: string) => {
    setIsSubmitting(true);
    try {
      const updateData: Partial<CustomerEstimate> = { 
        status,
        responded_at: new Date().toISOString()
      };

      if (customerResponse) {
        updateData.customer_response = customerResponse;
      }

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'viewed') {
        updateData.viewed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('customer_estimates')
        .update(updateData)
        .eq('id', estimateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertEstimateToJob = async (estimateId: string) => {
    setIsSubmitting(true);
    try {
      // Get estimate details
      const { data: estimate, error: estimateError } = await supabase
        .from('customer_estimates')
        .select('*')
        .eq('id', estimateId)
        .single();

      if (estimateError) throw estimateError;

      // Create job from estimate
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: estimate.title,
          description: estimate.description,
          customer_id: estimate.customer_id,
          customer_name: estimate.customer_name,
          specifications: estimate.specifications,
          unit_price: estimate.unit_price,
          estimate_price: estimate.total_amount,
          final_cost: estimate.total_amount,
          quantity: estimate.quantity,
          priority: estimate.priority,
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Update estimate to converted status
      await supabase
        .from('customer_estimates')
        .update({
          status: 'converted',
          converted_to_job_id: job.id
        })
        .eq('id', estimateId);

      return job;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createEstimate,
    updateEstimateStatus,
    convertEstimateToJob,
    isSubmitting
  };
}