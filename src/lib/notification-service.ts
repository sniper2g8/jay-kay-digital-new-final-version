/**
 * Notification Service for Jay Kay Digital Press
 * Handles email and SMS notifications for job status changes and payment records
 */

import { supabase } from './supabase.ts';
import { Database } from './database-generated.types.ts';

type NotificationType = Database['public']['Enums']['notification_type'];

interface NotificationData {
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_entity_id?: string;
  related_entity_type?: string;
  email_content?: string;
  sms_content?: string;
}

interface JobNotificationData {
  job_id: string;
  job_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  old_status?: string;
  new_status: string;
  admin_message?: string;
}

interface PaymentNotificationData {
  payment_id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
}

interface InvoiceNotificationData {
  invoice_id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  due_date: string;
}

class NotificationService {
  private readonly EMAIL_API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || '/api/send-email';
  private readonly SMS_API_URL = process.env.NEXT_PUBLIC_SMS_API_URL || '/api/send-sms';

  /**
   * Send notification when a job is submitted
   */
  async sendJobSubmissionNotification(data: JobNotificationData): Promise<void> {
    try {
      // Notify admins about new job submission
      await this.sendAdminJobNotification(data, 'submitted');
      
      // Send confirmation to customer
      await this.sendCustomerJobConfirmation(data);
    } catch (error) {
      console.error('Error sending job submission notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when job status changes
   */
  async sendJobStatusChangeNotification(data: JobNotificationData): Promise<void> {
    try {
      // Notify admins about status change
      await this.sendAdminJobNotification(data, 'status_changed');
      
      // Notify customer about status change
      await this.sendCustomerJobStatusUpdate(data);
    } catch (error) {
      console.error('Error sending job status change notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when payment is recorded
   */
  async sendPaymentRecordNotification(data: PaymentNotificationData): Promise<void> {
    try {
      // Notify admins about payment
      await this.sendAdminPaymentNotification(data);
      
      // Send receipt confirmation to customer
      await this.sendCustomerPaymentConfirmation(data);
    } catch (error) {
      console.error('Error sending payment notification:', {
        message: error instanceof Error ? error.message : 'Unknown payment notification error',
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        context: 'sendPaymentNotification'
      });
      throw error;
    }
  }

  /**
   * Send invoice generation notification
   */
  async sendInvoiceNotification(data: InvoiceNotificationData): Promise<void> {
    try {
      // Notify customer about new invoice
      await this.sendCustomerInvoiceNotification(data);
      
      // Notify admins about invoice generation
      await this.sendAdminInvoiceNotification(data);
    } catch (error) {
      console.error('Error sending invoice notification:', error);
      throw error;
    }
  }

  /**
   * Send job notification to admins
   */
  private async sendAdminJobNotification(data: JobNotificationData, action: 'submitted' | 'status_changed'): Promise<void> {
    const admins = await this.getAdminUsers();
    
    for (const admin of admins) {
      const notification: NotificationData = {
        recipient_id: admin.id,
        title: action === 'submitted' 
          ? `New Job Submitted: ${data.job_number}`
          : `Job Status Updated: ${data.job_number}`,
        message: action === 'submitted'
          ? `A new job has been submitted by ${data.customer_name}. Job Number: ${data.job_number}`
          : `Job ${data.job_number} status changed from ${data.old_status} to ${data.new_status}`,
        type: 'job_update',
        related_entity_id: data.job_id,
        related_entity_type: 'job',
        email_content: this.generateJobEmailContent(data, action, 'admin'),
        sms_content: this.generateJobSMSContent(data, action, 'admin')
      };

      await this.createNotification(notification);
      
      // Send email and SMS if enabled for admin
      if (admin.email && await this.shouldSendEmail(admin.id)) {
        await this.sendEmail(admin.email, notification.title, notification.email_content || notification.message);
      }
      
      if (admin.phone && await this.shouldSendSMS(admin.id)) {
        await this.sendSMS(admin.phone, notification.sms_content || notification.message);
      }
    }
  }

  /**
   * Send job confirmation to customer
   */
  private async sendCustomerJobConfirmation(data: JobNotificationData): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Job Submission Confirmed: ${data.job_number}`,
      message: `Your job has been successfully submitted. Job Number: ${data.job_number}. We will notify you of any status updates.`,
      type: 'job_update',
      related_entity_id: data.job_id,
      related_entity_type: 'job',
      email_content: this.generateJobEmailContent(data, 'submitted', 'customer'),
      sms_content: this.generateJobSMSContent(data, 'submitted', 'customer')
    };

    await this.createNotification(notification);
    
    // Send email and SMS if customer provided contact info
    if (data.customer_email && await this.shouldSendEmail(data.customer_id)) {
      await this.sendEmail(data.customer_email, notification.title, notification.email_content || notification.message);
    }
    
    if (data.customer_phone && await this.shouldSendSMS(data.customer_id)) {
      await this.sendSMS(data.customer_phone, notification.sms_content || notification.message);
    }
  }

  /**
   * Send job status update to customer
   */
  private async sendCustomerJobStatusUpdate(data: JobNotificationData): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Job Status Update: ${data.job_number}`,
      message: `Your job ${data.job_number} status has been updated to: ${data.new_status}`,
      type: 'job_update',
      related_entity_id: data.job_id,
      related_entity_type: 'job',
      email_content: this.generateJobEmailContent(data, 'status_changed', 'customer'),
      sms_content: this.generateJobSMSContent(data, 'status_changed', 'customer')
    };

    await this.createNotification(notification);
    
    if (data.customer_email && await this.shouldSendEmail(data.customer_id)) {
      await this.sendEmail(data.customer_email, notification.title, notification.email_content || notification.message);
    }
    
    if (data.customer_phone && await this.shouldSendSMS(data.customer_id)) {
      await this.sendSMS(data.customer_phone, notification.sms_content || notification.message);
    }
  }

  /**
   * Send payment notification to admins
   */
  private async sendAdminPaymentNotification(data: PaymentNotificationData): Promise<void> {
    const admins = await this.getAdminUsers();
    
    for (const admin of admins) {
      const notification: NotificationData = {
        recipient_id: admin.id,
        title: `Payment Received: ${data.invoice_no}`,
        message: `Payment of SLL ${data.amount.toLocaleString()} received from ${data.customer_name} for invoice ${data.invoice_no}`,
        type: 'payment_due',
        related_entity_id: data.payment_id,
        related_entity_type: 'payment',
        email_content: this.generatePaymentEmailContent(data, 'admin'),
        sms_content: this.generatePaymentSMSContent(data, 'admin')
      };

      await this.createNotification(notification);
      
      if (admin.email && await this.shouldSendEmail(admin.id)) {
        await this.sendEmail(admin.email, notification.title, notification.email_content || notification.message);
      }
      
      if (admin.phone && await this.shouldSendSMS(admin.id)) {
        await this.sendSMS(admin.phone, notification.sms_content || notification.message);
      }
    }
  }

  /**
   * Send payment confirmation to customer
   */
  private async sendCustomerPaymentConfirmation(data: PaymentNotificationData): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Payment Confirmation: ${data.invoice_no}`,
      message: `Your payment of SLL ${data.amount.toLocaleString()} has been received for invoice ${data.invoice_no}. Thank you!`,
      type: 'payment_due',
      related_entity_id: data.payment_id,
      related_entity_type: 'payment',
      email_content: this.generatePaymentEmailContent(data, 'customer'),
      sms_content: this.generatePaymentSMSContent(data, 'customer')
    };

    await this.createNotification(notification);
    
    if (data.customer_email && await this.shouldSendEmail(data.customer_id)) {
      await this.sendEmail(data.customer_email, notification.title, notification.email_content || notification.message);
    }
    
    if (data.customer_phone && await this.shouldSendSMS(data.customer_id)) {
      await this.sendSMS(data.customer_phone, notification.sms_content || notification.message);
    }
  }

  /**
   * Send invoice notification to customer
   */
  private async sendCustomerInvoiceNotification(data: InvoiceNotificationData): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `New Invoice: ${data.invoice_no}`,
      message: `A new invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()} has been generated. Due date: ${data.due_date}`,
      type: 'payment_due',
      related_entity_id: data.invoice_id,
      related_entity_type: 'invoice',
      email_content: this.generateInvoiceEmailContent(data, 'customer'),
      sms_content: this.generateInvoiceSMSContent(data, 'customer')
    };

    await this.createNotification(notification);
    
    if (data.customer_email && await this.shouldSendEmail(data.customer_id)) {
      await this.sendEmail(data.customer_email, notification.title, notification.email_content || notification.message);
    }
    
    if (data.customer_phone && await this.shouldSendSMS(data.customer_id)) {
      await this.sendSMS(data.customer_phone, notification.sms_content || notification.message);
    }
  }

  /**
   * Send invoice notification to admins
   */
  private async sendAdminInvoiceNotification(data: InvoiceNotificationData): Promise<void> {
    const admins = await this.getAdminUsers();
    
    for (const admin of admins) {
      const notification: NotificationData = {
        recipient_id: admin.id,
        title: `Invoice Generated: ${data.invoice_no}`,
        message: `Invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()} has been generated for ${data.customer_name}`,
        type: 'payment_due',
        related_entity_id: data.invoice_id,
        related_entity_type: 'invoice',
        email_content: this.generateInvoiceEmailContent(data, 'admin'),
        sms_content: this.generateInvoiceSMSContent(data, 'admin')
      };

      await this.createNotification(notification);
      
      if (admin.email && await this.shouldSendEmail(admin.id)) {
        await this.sendEmail(admin.email, notification.title, notification.email_content || notification.message);
      }
      
      if (admin.phone && await this.shouldSendSMS(admin.id)) {
        await this.sendSMS(admin.phone, notification.sms_content || notification.message);
      }
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotification(data: NotificationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: data.recipient_id,
          title: data.title,
          message: data.message,
          type: data.type,
          related_entity_id: data.related_entity_id,
          related_entity_type: data.related_entity_type,
          email_sent: false,
          sms_sent: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(to: string, subject: string, content: string): Promise<void> {
    try {
      const response = await fetch(this.EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html: content,
          from: 'noreply@jaykaydigitalpress.com',
          fromName: 'Jay Kay Digital Press'
        }),
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    try {
      const response = await fetch(this.SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          message,
          from: 'JKDP'
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS sending failed: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Get all admin users
   */
  private async getAdminUsers(): Promise<Array<{ id: string; email?: string; phone?: string }>> {
    try {
      const { data, error } = await supabase
        .from('appUsers')
        .select('id, email, phone')
        .eq('primary_role', 'admin');

      if (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }

      return (data || []).map(user => ({
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined
      }));
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Check if user has email notifications enabled
   */
  private async shouldSendEmail(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('email_notifications')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return true; // Default to enabled if no preferences found
      }

      return data.email_notifications !== false;
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Check if user has SMS notifications enabled
   */
  private async shouldSendSMS(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('sms_notifications')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false; // Default to disabled if no preferences found
      }

      return data.sms_notifications === true;
    } catch (error) {
      console.error('Error checking SMS preferences:', error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Generate job email content
   */
  private generateJobEmailContent(data: JobNotificationData, action: 'submitted' | 'status_changed', recipient: 'admin' | 'customer'): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jaykaydigitalpress.com';
    
    if (recipient === 'admin') {
      if (action === 'submitted') {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">New Job Submission - Jay Kay Digital Press</h2>
                <p>A new job has been submitted by a customer:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Job Number:</strong> ${data.job_number}</p>
                  <p><strong>Customer:</strong> ${data.customer_name}</p>
                  <p><strong>Status:</strong> ${data.new_status}</p>
                  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>Please review and process this job at your earliest convenience.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard/jobs/${data.job_id}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Job Details</a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  Jay Kay Digital Press<br>
                  St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                  Phone: +232 34 788711 | +232 30 741062<br>
                  Email: jaykaydigitalpress@gmail.com
                </p>
              </div>
            </body>
          </html>
        `;
      } else {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Job Status Update - Jay Kay Digital Press</h2>
                <p>A job status has been updated:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Job Number:</strong> ${data.job_number}</p>
                  <p><strong>Customer:</strong> ${data.customer_name}</p>
                  <p><strong>Previous Status:</strong> ${data.old_status}</p>
                  <p><strong>New Status:</strong> ${data.new_status}</p>
                  <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                ${data.admin_message ? `<p><strong>Message:</strong> ${data.admin_message}</p>` : ''}
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/dashboard/jobs/${data.job_id}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Job Details</a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  Jay Kay Digital Press<br>
                  St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                  Phone: +232 34 788711 | +232 30 741062<br>
                  Email: jaykaydigitalpress@gmail.com
                </p>
              </div>
            </body>
          </html>
        `;
      }
    } else {
      if (action === 'submitted') {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Job Submission Confirmed - Jay Kay Digital Press</h2>
                <p>Dear ${data.customer_name},</p>
                <p>Thank you for choosing Jay Kay Digital Press! Your job has been successfully submitted.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Job Number:</strong> ${data.job_number}</p>
                  <p><strong>Status:</strong> ${data.new_status}</p>
                  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>We will keep you updated on the progress of your job. You can track your job status using the link below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/track/${data.job_id}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Job</a>
                </div>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  Jay Kay Digital Press<br>
                  St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                  Phone: +232 34 788711 | +232 30 741062<br>
                  Email: jaykaydigitalpress@gmail.com
                </p>
              </div>
            </body>
          </html>
        `;
      } else {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Job Status Update - Jay Kay Digital Press</h2>
                <p>Dear ${data.customer_name},</p>
                <p>We have an update on your job:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Job Number:</strong> ${data.job_number}</p>
                  <p><strong>New Status:</strong> ${data.new_status}</p>
                  <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                ${data.admin_message ? `<p><strong>Update Message:</strong> ${data.admin_message}</p>` : ''}
                <p>You can continue to track your job progress using the link below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/track/${data.job_id}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Job</a>
                </div>
                <p>Thank you for choosing Jay Kay Digital Press!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  Jay Kay Digital Press<br>
                  St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                  Phone: +232 34 788711 | +232 30 741062<br>
                  Email: jaykaydigitalpress@gmail.com
                </p>
              </div>
            </body>
          </html>
        `;
      }
    }
  }

  /**
   * Generate job SMS content
   */
  private generateJobSMSContent(data: JobNotificationData, action: 'submitted' | 'status_changed', recipient: 'admin' | 'customer'): string {
    if (recipient === 'admin') {
      if (action === 'submitted') {
        return `JKDP: New job submitted by ${data.customer_name}. Job: ${data.job_number}. Status: ${data.new_status}. Please review.`;
      } else {
        return `JKDP: Job ${data.job_number} status changed from ${data.old_status} to ${data.new_status}.`;
      }
    } else {
      if (action === 'submitted') {
        return `JKDP: Your job ${data.job_number} has been submitted successfully. We'll keep you updated on progress. Track: jaykaydigitalpress.com/track/${data.job_id}`;
      } else {
        return `JKDP: Job ${data.job_number} status updated to: ${data.new_status}. Track: jaykaydigitalpress.com/track/${data.job_id}`;
      }
    }
  }

  /**
   * Generate payment email content
   */
  private generatePaymentEmailContent(data: PaymentNotificationData, recipient: 'admin' | 'customer'): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jaykaydigitalpress.com';
    
    if (recipient === 'admin') {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">Payment Received - Jay Kay Digital Press</h2>
              <p>A payment has been received:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Invoice:</strong> ${data.invoice_no}</p>
                <p><strong>Customer:</strong> ${data.customer_name}</p>
                <p><strong>Amount:</strong> SLL ${data.amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${data.payment_method}</p>
                <p><strong>Date:</strong> ${data.payment_date}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard/payments" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment Details</a>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                Jay Kay Digital Press<br>
                St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                Phone: +232 34 788711 | +232 30 741062<br>
                Email: jaykaydigitalpress@gmail.com
              </p>
            </div>
          </body>
        </html>
      `;
    } else {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">Payment Confirmation - Jay Kay Digital Press</h2>
              <p>Dear ${data.customer_name},</p>
              <p>Thank you! We have received your payment.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Invoice:</strong> ${data.invoice_no}</p>
                <p><strong>Amount Paid:</strong> SLL ${data.amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${data.payment_method}</p>
                <p><strong>Date:</strong> ${data.payment_date}</p>
              </div>
              <p>This payment has been applied to your account. If you have any questions about this payment, please contact us.</p>
              <p>Thank you for your business!</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                Jay Kay Digital Press<br>
                St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                Phone: +232 34 788711 | +232 30 741062<br>
                Email: jaykaydigitalpress@gmail.com
              </p>
            </div>
          </body>
        </html>
      `;
    }
  }

  /**
   * Generate payment SMS content
   */
  private generatePaymentSMSContent(data: PaymentNotificationData, recipient: 'admin' | 'customer'): string {
    if (recipient === 'admin') {
      return `JKDP: Payment of SLL ${data.amount.toLocaleString()} received from ${data.customer_name} for invoice ${data.invoice_no}. Method: ${data.payment_method}.`;
    } else {
      return `JKDP: Payment confirmed! SLL ${data.amount.toLocaleString()} received for invoice ${data.invoice_no}. Thank you for your business!`;
    }
  }

  /**
   * Generate invoice email content
   */
  private generateInvoiceEmailContent(data: InvoiceNotificationData, recipient: 'admin' | 'customer'): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jaykaydigitalpress.com';
    
    if (recipient === 'admin') {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">Invoice Generated - Jay Kay Digital Press</h2>
              <p>A new invoice has been generated:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Invoice:</strong> ${data.invoice_no}</p>
                <p><strong>Customer:</strong> ${data.customer_name}</p>
                <p><strong>Amount:</strong> SLL ${data.amount.toLocaleString()}</p>
                <p><strong>Due Date:</strong> ${data.due_date}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard/payments/invoices" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Invoice</a>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                Jay Kay Digital Press<br>
                St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                Phone: +232 34 788711 | +232 30 741062<br>
                Email: jaykaydigitalpress@gmail.com
              </p>
            </div>
          </body>
        </html>
      `;
    } else {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">New Invoice - Jay Kay Digital Press</h2>
              <p>Dear ${data.customer_name},</p>
              <p>We have generated a new invoice for your recent services.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Invoice Number:</strong> ${data.invoice_no}</p>
                <p><strong>Amount:</strong> SLL ${data.amount.toLocaleString()}</p>
                <p><strong>Due Date:</strong> ${data.due_date}</p>
              </div>
              <p>Please make payment by the due date to avoid any late fees. You can make payment via:</p>
              <ul>
                <li>Cash payment at our office</li>
                <li>Mobile money transfer</li>
                <li>Bank transfer</li>
              </ul>
              <p>For payment inquiries, please contact us at the numbers below.</p>
              <p>Thank you for your business!</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                Jay Kay Digital Press<br>
                St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                Phone: +232 34 788711 | +232 30 741062<br>
                Email: jaykaydigitalpress@gmail.com
              </p>
            </div>
          </body>
        </html>
      `;
    }
  }

  /**
   * Generate invoice SMS content
   */
  private generateInvoiceSMSContent(data: InvoiceNotificationData, recipient: 'admin' | 'customer'): string {
    if (recipient === 'admin') {
      return `JKDP: Invoice ${data.invoice_no} generated for ${data.customer_name}. Amount: SLL ${data.amount.toLocaleString()}. Due: ${data.due_date}.`;
    } else {
      return `JKDP: New invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()}. Due: ${data.due_date}. Contact us for payment options.`;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types for use in other files
export type {
  JobNotificationData,
  PaymentNotificationData,
  InvoiceNotificationData,
  NotificationData
};