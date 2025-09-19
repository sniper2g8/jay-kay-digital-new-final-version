/**
 * Job Notification Hooks for Jay Kay Digital Press
 * Uses Resend API for email notifications
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase';

export interface JobStatusNotificationData {
  customerEmail: string;
  customerName: string;
  jobNumber: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export interface JobNotificationData {
  id: string;
  jobNo: string;
  title: string;
  status: string;
  estimated_delivery?: string;
}

export interface CustomerNotificationData {
  email: string;
  business_name: string;
  contact_person?: string;
}

export function useJobNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendJobStatusNotification = useCallback(async (
    data: JobStatusNotificationData
  ): Promise<NotificationResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (!data.customerEmail || !data.customerName || !data.jobNumber || !data.jobTitle || !data.newStatus) {
        const errorMsg = 'Missing required fields for notification';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      // Check if email notifications are enabled
      const emailNotificationsEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS !== 'false';
      if (!emailNotificationsEnabled) {
        console.log('Email notifications are disabled, skipping notification');
        return { success: true, message: 'Notifications disabled' };
      }

      const response = await fetch('/api/notifications/job-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to send notification';
        setError(errorMsg);
        toast.error(`Notification failed: ${errorMsg}`);
        return null;
      }

      toast.success(`Status update email sent to ${data.customerEmail}`);
      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error sending job status notification:', err);
      setError(errorMsg);
      toast.error(`Notification error: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to send notifications for common status changes
  const notifyJobStatusChange = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string,
    notes?: string
  ) => {
    if (!customer.email) {
      console.warn('Customer email not provided, skipping notification');
      return null;
    }

    const customerName = customer.contact_person || customer.business_name;
    
    return await sendJobStatusNotification({
      customerEmail: customer.email,
      customerName,
      jobNumber: job.jobNo,
      jobTitle: job.title,
      oldStatus,
      newStatus: job.status,
      estimatedDelivery: job.estimated_delivery,
      notes
    });
  }, [sendJobStatusNotification]);

  // Specific notification functions for different status changes
  const notifyJobStarted = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string
  ) => {
    return await notifyJobStatusChange(
      job,
      customer,
      oldStatus,
      'Your job has been started and is now in production. We\'ll keep you updated on the progress.'
    );
  }, [notifyJobStatusChange]);

  const notifyJobCompleted = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string
  ) => {
    return await notifyJobStatusChange(
      job,
      customer,
      oldStatus,
      'Great news! Your order is now complete and ready for pickup or delivery. Please contact us to arrange collection.'
    );
  }, [notifyJobStatusChange]);

  const notifyJobOnHold = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string,
    reason?: string
  ) => {
    const notes = reason 
      ? `Your job has been temporarily placed on hold. Reason: ${reason}. We will contact you shortly to resolve this.`
      : 'Your job has been temporarily placed on hold. We will contact you shortly with more details.';
      
    return await notifyJobStatusChange(job, customer, oldStatus, notes);
  }, [notifyJobStatusChange]);

  const notifyJobCancelled = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string,
    reason?: string
  ) => {
    const notes = reason 
      ? `Your job has been cancelled. Reason: ${reason}. Please contact us if you have any questions.`
      : 'Your job has been cancelled. Please contact us if you have any questions or concerns.';
      
    return await notifyJobStatusChange(job, customer, oldStatus, notes);
  }, [notifyJobStatusChange]);

  const notifyQuoteSent = useCallback(async (
    job: JobNotificationData,
    customer: CustomerNotificationData,
    oldStatus: string
  ) => {
    return await notifyJobStatusChange(
      job,
      customer,
      oldStatus,
      'We\'ve prepared a quote for your project. Please review it and let us know if you have any questions or would like to proceed.'
    );
  }, [notifyJobStatusChange]);

  return {
    isLoading,
    error,
    sendJobStatusNotification,
    notifyJobStatusChange,
    // Convenience functions for specific status changes
    notifyJobStarted,
    notifyJobCompleted,
    notifyJobOnHold,
    notifyJobCancelled,
    notifyQuoteSent
  };
}

/**
 * Wrapper function to update job status and send notifications
 */
export async function updateJobStatusWithNotification(
  jobId: string,
  newStatus: string,
  adminMessage?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current job data with customer info
    const { data: jobWithCustomer, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id, 
        jobNo, 
        title,
        customer_id, 
        status,
        estimated_delivery,
        customers!inner(
          email,
          business_name,
          contact_person
        )
      `)
      .eq('id', jobId)
      .single();

    if (fetchError || !jobWithCustomer) {
      return { success: false, error: 'Job not found' };
    }

    const oldStatus = jobWithCustomer.status;

    // Update job status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      return { success: false, error: 'Failed to update job status' };
    }

    // Send notifications if status actually changed and customer has email
    if (oldStatus !== newStatus && jobWithCustomer.customers?.email) {
      try {
        const response = await fetch('/api/notifications/job-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: jobWithCustomer.customers.email,
            customerName: jobWithCustomer.customers.contact_person || jobWithCustomer.customers.business_name,
            jobNumber: jobWithCustomer.jobNo || `JOB-${jobId.slice(-6)}`,
            jobTitle: jobWithCustomer.title || 'Untitled Job',
            oldStatus: oldStatus || 'unknown',
            newStatus: newStatus,
            estimatedDelivery: jobWithCustomer.estimated_delivery,
            notes: adminMessage
          }),
        });

        if (!response.ok) {
          console.error('Failed to send notification email');
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the status update if notification fails
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating job status with notification:', error);
    return { success: false, error: 'Internal server error' };
  }
}