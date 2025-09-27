/**
 * Enhanced Notification Service for Jay Kay Digital Press
 * Handles email and SMS notifications with RESEND API integration and comprehensive logging
 * Supports: job updates, payment receipts, invoice sending, statement delivery
 *
 * Available notification types: delivery_ready, job_update, payment_due, promotion, reminder, system_alert
 */

// import { supabase } from './supabase.ts'; // Remove unused import
import { createServiceRoleClient } from "./supabase-admin.ts";
import { Database } from "./database.types.ts";

type NotificationType = Database["public"]["Enums"]["notification_type"];

// Email template types for professional templates
type EmailTemplateType =
  | "send_invoice"
  | "send_statement"
  | "payment_receipt"
  | "job_update"
  | "job_status_change"
  | "job_received";

interface NotificationData {
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType; // Using existing types: delivery_ready, job_update, payment_due, promotion, reminder, system_alert
  related_entity_id?: string;
  related_entity_type?: string;
  email_content?: string;
  sms_content?: string;
  template_type?: EmailTemplateType;
  template_variables?: Record<string, any>;
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

interface StatementNotificationData {
  statement_id: string;
  statement_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
}

class NotificationService {
  private readonly EMAIL_API_URL =
    process.env.NEXT_PUBLIC_EMAIL_API_URL || "/api/send-email";
  private readonly SMS_API_URL =
    process.env.NEXT_PUBLIC_SMS_API_URL || "/api/send-sms";

  /**
   * Send notification when a job is submitted (new job_received notification type)
   */
  async sendJobSubmissionNotification(
    data: JobNotificationData,
  ): Promise<void> {
    try {
      // Notify admins about new job submission using job_received type
      await this.sendAdminJobNotification(data, "submitted");

      // Send confirmation to customer
      await this.sendCustomerJobConfirmation(data);

      console.log(
        `Job submission notifications sent for job ${data.job_number}`,
      );
    } catch (error) {
      console.error("Error sending job submission notification:", error);
      // TODO: Add notification error logging once logNotificationError method is implemented
      throw error;
    }
  }

  /**
   * Send notification when job status changes (using job_status_change type)
   */
  async sendJobStatusChangeNotification(
    data: JobNotificationData,
  ): Promise<void> {
    try {
      // Notify admins about status change
      await this.sendAdminJobNotification(data, "status_changed");

      // Notify customer about status change
      await this.sendCustomerJobStatusUpdate(data);

      console.log(
        `Job status change notifications sent for job ${data.job_number}: ${data.old_status} → ${data.new_status}`,
      );
    } catch (error) {
      console.error("Error sending job status change notification:", error);
      // TODO: Add notification error logging once logNotificationError method is implemented
      throw error;
    }
  }

  /**
   * Send notification when payment is recorded (using payment_received type)
   */
  async sendPaymentRecordNotification(
    data: PaymentNotificationData,
  ): Promise<void> {
    try {
      // Notify admins about payment
      await this.sendAdminPaymentNotification(data);

      // Send receipt confirmation to customer
      await this.sendCustomerPaymentConfirmation(data);

      console.log(
        `Payment received notifications sent for payment ${data.payment_id}: SLL ${data.amount.toLocaleString()}`,
      );
    } catch (error) {
      console.error("Error sending payment notification:", {
        message:
          error instanceof Error
            ? error.message
            : "Unknown payment notification error",
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        context: "sendPaymentNotification",
      });
      // TODO: Add notification error logging once logNotificationError method is implemented
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
      console.error("Error sending invoice notification:", error);
      throw error;
    }
  }

  /**
   * Send statement notification (account statement available)
   */
  async sendStatementNotification(
    data: StatementNotificationData,
  ): Promise<void> {
    try {
      // Notify customer with statement summary
      const notification: NotificationData = {
        recipient_id: data.customer_id,
        title: `Your Account Statement: ${data.statement_number}`,
        message: `Statement ${data.statement_number} is available for ${new Date(data.period_start).toLocaleDateString()} to ${new Date(data.period_end).toLocaleDateString()}. Closing balance: SLL ${data.closing_balance.toLocaleString()}.`,
        type: "payment_due",
        related_entity_id: data.statement_id,
        related_entity_type: "statement",
        email_content: this.generateStatementEmailContent(data, "customer"),
        sms_content: this.generateStatementSMSContent(data, "customer"),
      };

      await this.createNotification(notification);

      if (
        data.customer_email &&
        (await this.shouldSendEmail(data.customer_id))
      ) {
        await this.sendEmail(
          data.customer_email,
          notification.title,
          notification.email_content || notification.message,
        );
      }

      if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
        await this.sendSMS(
          data.customer_phone,
          notification.sms_content || notification.message,
        );
      }

      // Notify admins a statement was generated
      const admins = await this.getAdminUsers();
      for (const admin of admins) {
        const adminNotif: NotificationData = {
          recipient_id: admin.id,
          title: `Statement Generated: ${data.statement_number}`,
          message: `Statement ${data.statement_number} generated for ${data.customer_name}. Closing balance: SLL ${data.closing_balance.toLocaleString()}.`,
          type: "payment_due",
          related_entity_id: data.statement_id,
          related_entity_type: "statement",
          email_content: this.generateStatementEmailContent(data, "admin"),
          sms_content: this.generateStatementSMSContent(data, "admin"),
        };
        await this.createNotification(adminNotif);
        if (admin.email && (await this.shouldSendEmail(admin.id))) {
          await this.sendEmail(
            admin.email,
            adminNotif.title,
            adminNotif.email_content || adminNotif.message,
          );
        }
        if (admin.phone && (await this.shouldSendSMS(admin.id))) {
          await this.sendSMS(
            admin.phone,
            adminNotif.sms_content || adminNotif.message,
          );
        }
      }
    } catch (error) {
      console.error("Error sending statement notification:", error);
      throw error;
    }
  }

  /**
   * Send job notification to admins (using appropriate notification types)
   */
  private async sendAdminJobNotification(
    data: JobNotificationData,
    action: "submitted" | "status_changed",
  ): Promise<void> {
    const admins = await this.getAdminUsers();

    for (const admin of admins) {
      const notificationType: NotificationType =
        action === "submitted" ? "job_update" : "job_update"; // Using job_update for both cases

      const notification: NotificationData = {
        recipient_id: admin.id,
        title:
          action === "submitted"
            ? `New Job Received: ${data.job_number}`
            : `Job Status Changed: ${data.job_number}`,
        message:
          action === "submitted"
            ? `A new job has been received from ${data.customer_name}. Job Number: ${data.job_number}`
            : `Job ${data.job_number} status changed from ${data.old_status} to ${data.new_status}`,
        type: notificationType,
        related_entity_id: data.job_id,
        related_entity_type: "job",
        template_type: "job_update",
        template_variables: {
          job_number: data.job_number,
          customer_name: data.customer_name,
          old_status: data.old_status,
          new_status: data.new_status,
          admin_message: data.admin_message,
          action: action,
          recipient_type: "admin",
        },
      };

      const _notificationId = await this.createNotification(notification);  // Prefix with _ to indicate intentionally unused
      if (data.customer_email && (await this.shouldSendEmail(data.customer_id))) {
        await this.sendEmail(
          data.customer_email,
          notification.title,
          notification.email_content || notification.message,
        );
      }

      if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
        await this.sendSMS(
          data.customer_phone,
          notification.sms_content || notification.message,
        );
      }

      // Send email using existing method if enabled for admin
      if (admin.email && (await this.shouldSendEmail(admin.id))) {
        await this.sendEmail(
          admin.email,
          notification.title,
          this.generateJobEmailContent(data, action, "admin"),
          "job_update", // Use template type
        );
      }

      if (admin.phone && (await this.shouldSendSMS(admin.id))) {
        await this.sendSMS(
          admin.phone,
          this.generateJobSMSContent(data, action, "admin"),
        );
      }
    }
  }

  /**
   * Send job confirmation to customer
   */
  private async sendCustomerJobConfirmation(
    data: JobNotificationData,
  ): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Job Submission Confirmed: ${data.job_number}`,
      message: `Your job has been successfully submitted. Job Number: ${data.job_number}. We will notify you of any status updates.`,
      type: "job_update",
      related_entity_id: data.job_id,
      related_entity_type: "job",
      template_type: "job_update",
      template_variables: {
        job_number: data.job_number,
        customer_name: data.customer_name,
        new_status: data.new_status,
        action: "submitted",
        recipient_type: "customer",
      },
    };

    const _notificationId = await this.createNotification(notification);

    // Send email and SMS if customer provided contact info
    if (data.customer_email && (await this.shouldSendEmail(data.customer_id))) {
      await this.sendEmail(
        data.customer_email,
        notification.title,
        this.generateJobEmailContent(data, "submitted", "customer"),
        "job_update", // Use template type
      );
    }

    if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
      await this.sendSMS(
        data.customer_phone,
        this.generateJobSMSContent(data, "submitted", "customer"),
      );
    }
  }

  /**
   * Send job status update to customer
   */
  private async sendCustomerJobStatusUpdate(
    data: JobNotificationData,
  ): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Job Status Update: ${data.job_number}`,
      message: `Your job ${data.job_number} status has been updated to: ${data.new_status}`,
      type: "job_update",
      related_entity_id: data.job_id,
      related_entity_type: "job",
      template_type: "job_update",
      template_variables: {
        job_number: data.job_number,
        customer_name: data.customer_name,
        old_status: data.old_status,
        new_status: data.new_status,
        admin_message: data.admin_message,
        action: "status_changed",
        recipient_type: "customer",
      },
    };

    const _notificationId = await this.createNotification(notification);

    if (data.customer_email && (await this.shouldSendEmail(data.customer_id))) {
      await this.sendEmail(
        data.customer_email,
        notification.title,
        this.generateJobEmailContent(data, "status_changed", "customer"),
        "job_update", // Use template type
      );
    }

    if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
      await this.sendSMS(
        data.customer_phone,
        this.generateJobSMSContent(data, "status_changed", "customer"),
      );
    }
  }

  /**
   * Send payment notification to admins
   */
  private async sendAdminPaymentNotification(
    data: PaymentNotificationData,
  ): Promise<void> {
    const admins = await this.getAdminUsers();

    for (const admin of admins) {
      const notification: NotificationData = {
        recipient_id: admin.id,
        title: `Payment Received: ${data.invoice_no}`,
        message: `Payment of SLL ${data.amount.toLocaleString()} received from ${data.customer_name} for invoice ${data.invoice_no}`,
        type: "payment_due",
        related_entity_id: data.payment_id,
        related_entity_type: "payment",
        email_content: this.generatePaymentEmailContent(data, "admin"),
        sms_content: this.generatePaymentSMSContent(data, "admin"),
      };

      await this.createNotification(notification);

      if (admin.email && (await this.shouldSendEmail(admin.id))) {
        await this.sendEmail(
          admin.email,
          notification.title,
          notification.email_content || notification.message,
        );
      }

      if (admin.phone && (await this.shouldSendSMS(admin.id))) {
        await this.sendSMS(
          admin.phone,
          notification.sms_content || notification.message,
        );
      }
    }
  }

  /**
   * Send payment confirmation to customer
   */
  private async sendCustomerPaymentConfirmation(
    data: PaymentNotificationData,
  ): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `Payment Confirmation: ${data.invoice_no}`,
      message: `Your payment of SLL ${data.amount.toLocaleString()} has been received for invoice ${data.invoice_no}. Thank you!`,
      type: "payment_due",
      related_entity_id: data.payment_id,
      related_entity_type: "payment",
      email_content: this.generatePaymentEmailContent(data, "customer"),
      sms_content: this.generatePaymentSMSContent(data, "customer"),
    };

    await this.createNotification(notification);

    if (data.customer_email && (await this.shouldSendEmail(data.customer_id))) {
      await this.sendEmail(
        data.customer_email,
        notification.title,
        notification.email_content || notification.message,
      );
    }

    if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
      await this.sendSMS(
        data.customer_phone,
        notification.sms_content || notification.message,
      );
    }
  }

  /**
   * Send invoice notification to customer
   */
  private async sendCustomerInvoiceNotification(
    data: InvoiceNotificationData,
  ): Promise<void> {
    const notification: NotificationData = {
      recipient_id: data.customer_id,
      title: `New Invoice: ${data.invoice_no}`,
      message: `A new invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()} has been generated. Due date: ${data.due_date}`,
      type: "payment_due",
      related_entity_id: data.invoice_id,
      related_entity_type: "invoice",
      email_content: this.generateInvoiceEmailContent(data, "customer"),
      sms_content: this.generateInvoiceSMSContent(data, "customer"),
    };

    await this.createNotification(notification);

    if (data.customer_email && (await this.shouldSendEmail(data.customer_id))) {
      await this.sendEmail(
        data.customer_email,
        notification.title,
        notification.email_content || notification.message,
      );
    }

    if (data.customer_phone && (await this.shouldSendSMS(data.customer_id))) {
      await this.sendSMS(
        data.customer_phone,
        notification.sms_content || notification.message,
      );
    }
  }

  /**
   * Send invoice notification to admins
   */
  private async sendAdminInvoiceNotification(
    data: InvoiceNotificationData,
  ): Promise<void> {
    const admins = await this.getAdminUsers();

    for (const admin of admins) {
      const notification: NotificationData = {
        recipient_id: admin.id,
        title: `Invoice Generated: ${data.invoice_no}`,
        message: `Invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()} has been generated for ${data.customer_name}`,
        type: "payment_due",
        related_entity_id: data.invoice_id,
        related_entity_type: "invoice",
        email_content: this.generateInvoiceEmailContent(data, "admin"),
        sms_content: this.generateInvoiceSMSContent(data, "admin"),
      };

      await this.createNotification(notification);

      if (admin.email && (await this.shouldSendEmail(admin.id))) {
        await this.sendEmail(
          admin.email,
          notification.title,
          notification.email_content || notification.message,
        );
      }

      if (admin.phone && (await this.shouldSendSMS(admin.id))) {
        await this.sendSMS(
          admin.phone,
          notification.sms_content || notification.message,
        );
      }
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotification(data: NotificationData): Promise<string> {
    try {
      // Use service role client for server-side operations
      const adminSupabase = createServiceRoleClient();

      // Validate recipient_id is a valid UUID or skip if empty
      if (!data.recipient_id || data.recipient_id.trim() === "") {
        console.warn("Skipping notification creation: Invalid recipient_id");
        return "skipped";
      }

      const { data: notificationData, error } = await adminSupabase
        .from("notifications")
        .insert({
          recipient_id: data.recipient_id,
          title: data.title,
          message: data.message,
          type: data.type,
          related_entity_id: data.related_entity_id,
          related_entity_type: data.related_entity_type,
          email_sent: false,
          sms_sent: false,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        throw error;
      }

      return notificationData.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Send email notification using existing email templates with logging
   */
  private async sendEmail(
    to: string,
    subject: string,
    content: string,
    templateType?: string,
    recipientName?: string,
  ): Promise<void> {
    try {
      // If template type is provided, try to use email template from database
      let emailContent = content;

      if (templateType) {
        const template = await this.getEmailTemplate(templateType);
        if (template) {
          // Replace template variables with actual content
          emailContent = this.processTemplate(template.content, {
            subject: subject,
            content: content,
            company_name: "Jay Kay Digital Press",
            company_address:
              "St. Edward School Avenue, By Caritas, Freetown, Sierra Leone",
            company_phone: "+232 34 788711 | +232 30 741062",
            company_email: "jaykaydigitalpress@gmail.com",
            recipient_name: recipientName || "Valued Customer",
          });
          subject = template.subject || subject;
        }
      }

      // Send email via RESEND API or fallback
      const response = await fetch(this.EMAIL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          html: emailContent,
          from: "noreply@jaykaydigitalpress.com",
          fromName: "Jay Kay Digital Press",
        }),
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      const resendId = responseData?.id || null;

      // Log the email notification to database
      await this.logEmailNotification({
        type: templateType || "general",
        recipient_email: to,
        recipient_name: recipientName || null,
        subject: subject,
        resend_id: resendId,
        status: "sent",
        metadata: {
          template_type: templateType,
          sent_via: "api",
          response_data: responseData,
        },
      });
    } catch (error) {
      console.error("Error sending email:", error);

      // Log failed email attempt
      await this.logEmailNotification({
        type: templateType || "general",
        recipient_email: to,
        recipient_name: recipientName || null,
        subject: subject,
        status: "failed",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          template_type: templateType,
          failed_at: new Date().toISOString(),
        },
      });

      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    try {
      const response = await fetch(this.SMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          message,
          from: "JKDP",
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS sending failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }

  /**
   * Get all admin users
   */
  private async getAdminUsers(): Promise<
    { id: string; email?: string; phone?: string }[]
  > {
    try {
      // Use service role client for server-side operations
      const adminSupabase = createServiceRoleClient();

      const { data, error } = await adminSupabase
        .from("appUsers")
        .select("id, email, phone")
        .eq("primary_role", "admin");

      if (error) {
        console.error("Error fetching admin users:", error);
        return [];
      }

      return (data || []).map((user) => ({
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
      }));
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }

  /**
   * Check if user has email notifications enabled
   */
  private async shouldSendEmail(userId: string): Promise<boolean> {
    try {
      // Use service role client for server-side operations
      const adminSupabase = createServiceRoleClient();

      const { data, error } = await adminSupabase
        .from("notification_preferences")
        .select("email_notifications")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return true; // Default to enabled if no preferences found
      }

      return data.email_notifications !== false;
    } catch (error) {
      console.error("Error checking email preferences:", error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Check if user has SMS notifications enabled
   */
  private async shouldSendSMS(userId: string): Promise<boolean> {
    try {
      // Use service role client for server-side operations
      const adminSupabase = createServiceRoleClient();

      const { data, error } = await adminSupabase
        .from("notification_preferences")
        .select("sms_notifications")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        return false; // Default to disabled if no preferences found
      }

      return data.sms_notifications === true;
    } catch (error) {
      console.error("Error checking SMS preferences:", error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Generate job email content
   */
  private generateJobEmailContent(
    data: JobNotificationData,
    action: "submitted" | "status_changed",
    recipient: "admin" | "customer",
  ): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://jaykaydigitalpress.com";

    if (recipient === "admin") {
      if (action === "submitted") {
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
                ${data.admin_message ? `<p><strong>Message:</strong> ${data.admin_message}</p>` : ""}
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
      if (action === "submitted") {
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
                ${data.admin_message ? `<p><strong>Update Message:</strong> ${data.admin_message}</p>` : ""}
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
  private generateJobSMSContent(
    data: JobNotificationData,
    action: "submitted" | "status_changed",
    recipient: "admin" | "customer",
  ): string {
    if (recipient === "admin") {
      if (action === "submitted") {
        return `JKDP: New job submitted by ${data.customer_name}. Job: ${data.job_number}. Status: ${data.new_status}. Please review.`;
      } else {
        return `JKDP: Job ${data.job_number} status changed from ${data.old_status} to ${data.new_status}.`;
      }
    } else {
      if (action === "submitted") {
        return `JKDP: Your job ${data.job_number} has been submitted successfully. We'll keep you updated on progress. Track: jaykaydigitalpress.com/track/${data.job_id}`;
      } else {
        return `JKDP: Job ${data.job_number} status updated to: ${data.new_status}. Track: jaykaydigitalpress.com/track/${data.job_id}`;
      }
    }
  }

  /**
   * Generate payment email content
   */
  private generatePaymentEmailContent(
    data: PaymentNotificationData,
    recipient: "admin" | "customer",
  ): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://jaykaydigitalpress.com";

    if (recipient === "admin") {
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
  private generatePaymentSMSContent(
    data: PaymentNotificationData,
    recipient: "admin" | "customer",
  ): string {
    if (recipient === "admin") {
      return `JKDP: Payment of SLL ${data.amount.toLocaleString()} received from ${data.customer_name} for invoice ${data.invoice_no}. Method: ${data.payment_method}.`;
    } else {
      return `JKDP: Payment confirmed! SLL ${data.amount.toLocaleString()} received for invoice ${data.invoice_no}. Thank you for your business!`;
    }
  }

  /**
   * Generate invoice email content
   */
  private generateInvoiceEmailContent(
    data: InvoiceNotificationData,
    recipient: "admin" | "customer",
  ): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://jaykaydigitalpress.com";

    if (recipient === "admin") {
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
   * Generate statement email content (professional template)
   */
  private generateStatementEmailContent(
    data: StatementNotificationData,
    recipient: "admin" | "customer",
  ): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://jaykaydigitalpress.com";
    const period = `${new Date(data.period_start).toLocaleDateString()} - ${new Date(data.period_end).toLocaleDateString()}`;
    const header =
      recipient === "admin" ? "Statement Generated" : "Your Account Statement";
    const ctaHref =
      recipient === "admin"
        ? `${baseUrl}/dashboard/statements/${data.statement_id}`
        : `${baseUrl}/dashboard/statements/${data.statement_id}`;
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
            <div style="text-align:center; margin-bottom: 16px;">
              <img src="${baseUrl}/JK_Logo.jpg" alt="Jay Kay Digital Press" style="height:64px; object-fit:contain;"/>
            </div>
            <h2 style="color: #dc2626; margin: 0 0 8px 0;">${header}</h2>
            <p style="margin: 0 0 16px 0;">Statement <strong>${data.statement_number}</strong> for <strong>${data.customer_name}</strong></p>
            <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px;">
              <p style="margin:6px 0;"><strong>Period:</strong> ${period}</p>
              <p style="margin:6px 0;"><strong>Opening Balance:</strong> SLL ${data.opening_balance.toLocaleString()}</p>
              <p style="margin:6px 0;"><strong>Closing Balance:</strong> SLL ${data.closing_balance.toLocaleString()}</p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${ctaHref}" style="background-color: #dc2626; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Statement</a>
            </div>
            <hr style="margin: 24px 0; border:none; border-top:1px solid #e5e7eb;"/>
            <p style="font-size: 12px; color: #6b7280;">
              Jay Kay Digital Press · St. Edward School Avenue, By Caritas, Freetown, Sierra Leone · +232 34 788711 | +232 30 741062
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate statement SMS content
   */
  private generateStatementSMSContent(
    data: StatementNotificationData,
    recipient: "admin" | "customer",
  ): string {
    const period = `${new Date(data.period_start).toLocaleDateString()}-${new Date(data.period_end).toLocaleDateString()}`;
    if (recipient === "admin") {
      return `JKDP: Statement ${data.statement_number} generated for ${data.customer_name}. Closing: SLL ${data.closing_balance.toLocaleString()} (${period}).`;
    } else {
      return `JKDP: Your statement ${data.statement_number} is ready (${period}). Closing balance: SLL ${data.closing_balance.toLocaleString()}.`;
    }
  }

  /**
   * Generate invoice SMS content
   */
  private generateInvoiceSMSContent(
    data: InvoiceNotificationData,
    recipient: "admin" | "customer",
  ): string {
    if (recipient === "admin") {
      return `JKDP: Invoice ${data.invoice_no} generated for ${data.customer_name}. Amount: SLL ${data.amount.toLocaleString()}. Due: ${data.due_date}.`;
    } else {
      return `JKDP: New invoice ${data.invoice_no} for SLL ${data.amount.toLocaleString()}. Due: ${data.due_date}. Contact us for payment options.`;
    }
  }

  /**
   * Get email template from database
   */
  private async getEmailTemplate(
    templateType: string,
  ): Promise<{ subject: string; content: string } | null> {
    try {
      const adminSupabase = createServiceRoleClient();

      const { data, error } = await adminSupabase
        .from("email_templates")
        .select("subject, content")
        .eq("type", templateType)
        .single();

      if (error || !data) {
        console.log(
          `Email template '${templateType}' not found, using default content`,
        );
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching email template:", error);
      return null;
    }
  }

  /**
   * Process email template with variable substitution
   */
  private processTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    let processedTemplate = template;

    // Replace variables in format {{variable_name}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      processedTemplate = processedTemplate.replace(regex, String(value || ""));
    });

    return processedTemplate;
  }

  /**
   * Log notification errors for debugging
   */
  private async logNotificationError(
    notificationType: string,
    error: any,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      console.error(`Notification Error [${notificationType}]:`, {
        error: error instanceof Error ? error.message : String(error),
        context,
        timestamp: new Date().toISOString(),
      });

      // Optionally store in database notification_log table if implemented
      // This would require the notification_log table from the migration
    } catch (logError) {
      console.error("Failed to log notification error:", logError);
    }
  }

  /**
   * Log email notification to database
   */
  private async logEmailNotification(logData: {
    type: string;
    recipient_email: string;
    recipient_name?: string | null;
    subject: string;
    resend_id?: string | null;
    status: "sent" | "failed" | "delivered" | "bounced";
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const adminSupabase = createServiceRoleClient();

      const { error } = await adminSupabase.from("email_notifications").insert({
        type: logData.type,
        recipient_email: logData.recipient_email,
        recipient_name: logData.recipient_name,
        subject: logData.subject,
        sent_at: new Date().toISOString(),
        resend_id: logData.resend_id,
        status: logData.status,
        metadata: logData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error logging email notification:", error);
      }
    } catch (error) {
      console.error("Failed to log email notification:", error);
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
  NotificationData,
};
