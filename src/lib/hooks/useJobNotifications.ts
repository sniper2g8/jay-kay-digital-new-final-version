/**
 * Job Notification Hooks for Jay Kay Digital Press
 * Integrates with job management to send notifications
 */

import { notificationService, JobNotificationData } from '../notification-service';
import { supabase } from '../supabase';

/**
 * Hook to send notifications when a job is submitted
 */
export async function notifyJobSubmission(jobData: {
  id: string;
  jobNo: string;
  customer_id: string;
  status: string;
}): Promise<void> {
  try {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', jobData.customer_id)
      .single();

    if (customerError) {
      console.error('Error fetching customer details:', customerError);
      return;
    }

    const notificationData: JobNotificationData = {
      job_id: jobData.id,
      job_number: jobData.jobNo || `JOB-${jobData.id.slice(-6)}`,
      customer_id: jobData.customer_id,
      customer_name: customer?.name || 'Unknown Customer',
      customer_email: customer?.email || undefined,
      customer_phone: customer?.phone || undefined,
      new_status: jobData.status
    };

    await notificationService.sendJobSubmissionNotification(notificationData);
    
  } catch (error) {
    console.error('Error sending job submission notifications:', error);
  }
}

/**
 * Hook to send notifications when job status changes
 */
export async function notifyJobStatusChange(jobData: {
  id: string;
  jobNo: string;
  customer_id: string;
  old_status: string;
  new_status: string;
  admin_message?: string;
}): Promise<void> {
  try {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', jobData.customer_id)
      .single();

    if (customerError) {
      console.error('Error fetching customer details:', customerError);
      return;
    }

    const notificationData: JobNotificationData = {
      job_id: jobData.id,
      job_number: jobData.jobNo || `JOB-${jobData.id.slice(-6)}`,
      customer_id: jobData.customer_id,
      customer_name: customer?.name || 'Unknown Customer',
      customer_email: customer?.email || undefined,
      customer_phone: customer?.phone || undefined,
      old_status: jobData.old_status,
      new_status: jobData.new_status,
      admin_message: jobData.admin_message
    };

    await notificationService.sendJobStatusChangeNotification(notificationData);
    
  } catch (error) {
    console.error('Error sending job status change notifications:', error);
  }
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
    // Get current job data
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, jobNo, customer_id, status')
      .eq('id', jobId)
      .single();

    if (fetchError || !currentJob) {
      return { success: false, error: 'Job not found' };
    }

    const oldStatus = currentJob.status;

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

    // Send notifications if status actually changed
    if (oldStatus !== newStatus) {
      await notifyJobStatusChange({
        id: jobId,
        jobNo: currentJob.jobNo || `JOB-${jobId.slice(-6)}`,
        customer_id: currentJob.customer_id || '',
        old_status: oldStatus || 'unknown',
        new_status: newStatus,
        admin_message: adminMessage
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating job status with notification:', error);
    return { success: false, error: 'Internal server error' };
  }
}