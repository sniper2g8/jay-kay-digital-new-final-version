// deno-lint-ignore-file
/// <reference lib="deno.ns" />

// Updated email notification function that aligns with the provided database schema
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobDetails {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
  customer_email: string;
  customer_name: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

interface EmailPayload {
  type:
    | "job_submitted"
    | "job_status_update"
    | "invoice_sent"
    | "payment_received"
    | "direct_message";
  job?: JobDetails;
  recipient_email?: string;
  recipient_name?: string;
  message?: string;
  invoice_url?: string;
  amount?: number;
}

interface AdminUser {
  email: string;
  name: string;
}

interface AdminEmailOnly {
  email: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use service role key for internal functions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      type,
      job,
      recipient_email,
      recipient_name,
      message,
      invoice_url,
      amount,
    }: EmailPayload = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailsToSend: {
      to: string[];
      subject: string;
      html: string;
    }[] = [];

    switch (type) {
      case "job_submitted":
        {
          if (!job)
            throw new Error(
              "Job details required for job_submitted notification",
            );

          // Get all admin emails
          const { data: admins, error: adminError } = await supabase
            .from("users")
            .select("email, name")
            .eq("role", "admin");

          if (adminError) throw adminError;

          // Send notification to all admins
          if (admins && admins.length > 0) {
            emailsToSend.push({
              to: (admins as AdminUser[]).map((admin) => admin.email),
              subject: `New Job Submitted: ${job.title}`,
              html: generateJobNotificationTemplate(job, "admin"),
            });
          }

          // Send confirmation to customer
          emailsToSend.push({
            to: [job.customer_email],
            subject: `Job Received: ${job.title}`,
            html: generateJobReceivedTemplate(job),
          });
        }
        break;

      case "job_status_update":
        if (!job)
          throw new Error(
            "Job details required for status update notification",
          );

        emailsToSend.push({
          to: [job.customer_email],
          subject: `Job Status Update: ${job.title}`,
          html: generateJobStatusUpdateTemplate(job),
        });
        break;

      case "invoice_sent":
        if (!job || !invoice_url)
          throw new Error("Job details and invoice URL required");

        emailsToSend.push({
          to: [job.customer_email],
          subject: `Invoice for Job: ${job.title}`,
          html: generateInvoiceTemplate(job, invoice_url),
        });
        break;

      case "payment_received":
        {
          if (!job || !amount) throw new Error("Job details and amount required");

          // Notify customer
          emailsToSend.push({
            to: [job.customer_email],
            subject: `Payment Received: ${job.title}`,
            html: generatePaymentReceivedTemplate(job, amount),
          });

          // Notify all admins
          const { data: adminUsers, error: adminUsersError } = await supabase
            .from("users")
            .select("email")
            .eq("role", "admin");

          if (!adminUsersError && adminUsers && adminUsers.length > 0) {
            emailsToSend.push({
              to: (adminUsers as AdminEmailOnly[]).map((admin) => admin.email),
              subject: `Payment Received: ${job.title}`,
              html: generatePaymentReceivedAdminTemplate(job, amount),
            });
          }
        }
        break;

      case "direct_message":
        if (!recipient_email || !message)
          throw new Error("Recipient email and message required");

        emailsToSend.push({
          to: [recipient_email],
          subject: "Direct Message Notification",
          html: generateDirectMessageTemplate(message, recipient_name),
        });
        break;

      default:
        throw new Error("Invalid notification type");
    }

    // Send all emails
    const emailPromises = emailsToSend.map(async (email) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "notifications@jaykaydigitalpress.com",
          to: email.to,
          subject: email.subject,
          html: email.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    });

    const results = await Promise.all(emailPromises);

    // Log notifications in database
    for (const email of emailsToSend) {
      await supabase.from("email_notifications").insert({
        type: type,
        job_id: job?.id,
        recipient_email: email.to[0],
        subject: email.subject,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.length} email(s) sent successfully`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending emails:", error);

    // Log error in database
    try {
      const { type, job, recipient_email } = await req.json();

      // Create a new Supabase client instance for error handling
      const supabaseErrorClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      await supabaseErrorClient.from("email_notifications").insert({
        type: type,
        job_id: job?.id,
        recipient_email: recipient_email || job?.customer_email,
        subject: `Failed: ${type}`,
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error),
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

// Email Templates
function generateJobNotificationTemplate(
  job: JobDetails,
  userType: "admin" | "customer",
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Job Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .job-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            .status.pending { background: #ffc107; color: #212529; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 New Job Submitted</h1>
            </div>
            <div class="content">
                <h2>Hello ${userType === "admin" ? "Admin" : job.customer_name}!</h2>
                <p>A new job has been submitted and requires your attention.</p>
                
                <div class="job-details">
                    <h3>📋 Job Details</h3>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>Title:</strong> ${job.title}</p>
                    <p><strong>Description:</strong> ${job.description}</p>
                    <p><strong>Customer:</strong> ${job.customer_name} (${job.customer_email})</p>
                    <p><strong>Status:</strong> <span class="status ${job.status}">${job.status.toUpperCase()}</span></p>
                    <p><strong>Submitted:</strong> ${new Date(job.created_at).toLocaleString()}</p>
                    ${job.amount ? `<p><strong>Amount:</strong> $${job.amount}</p>` : ""}
                </div>

                ${
                  userType === "admin"
                    ? "<p>Please log into the admin dashboard to review and manage this job.</p>"
                    : "<p>We will review your job submission and get back to you shortly.</p>"
                }
            </div>
            <div class="footer">
                <p>Best regards,<br>Your Job Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateJobReceivedTemplate(job: JobDetails): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Job Received Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .job-summary { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Job Received Successfully</h1>
            </div>
            <div class="content">
                <h2>Thank you, ${job.customer_name}!</h2>
                <p>We have successfully received your job submission. Here are the details:</p>
                
                <div class="job-summary">
                    <h3>📝 Your Job Summary</h3>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>Title:</strong> ${job.title}</p>
                    <p><strong>Description:</strong> ${job.description}</p>
                    <p><strong>Submitted:</strong> ${new Date(job.created_at).toLocaleString()}</p>
                </div>

                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>Our team will review your job requirements</li>
                    <li>You'll receive updates via email as the status changes</li>
                    <li>We'll contact you if we need any additional information</li>
                </ul>
            </div>
            <div class="footer">
                <p>Thank you for choosing our services!<br>The Job Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateJobStatusUpdateTemplate(job: JobDetails): string {
  const statusColors: Record<string, string> = {
    pending: "#ffc107",
    in_progress: "#17a2b8",
    completed: "#28a745",
    cancelled: "#dc3545",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Job Status Update</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColors[job.status]}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .status-update { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔄 Job Status Update</h1>
            </div>
            <div class="content">
                <h2>Hello ${job.customer_name},</h2>
                <p>Your job status has been updated!</p>
                
                <div class="status-update">
                    <h3>📊 Status Update</h3>
                    <p><strong>Job:</strong> ${job.title}</p>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>New Status:</strong> <strong style="color: ${statusColors[job.status]}">${job.status.toUpperCase().replace("_", " ")}</strong></p>
                    <p><strong>Updated:</strong> ${new Date(job.updated_at).toLocaleString()}</p>
                </div>

                <p>You can track your job progress in your customer dashboard or contact us for any questions.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>Your Job Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateInvoiceTemplate(job: JobDetails, invoiceUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .invoice-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .cta-button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Invoice Ready</h1>
            </div>
            <div class="content">
                <h2>Hello ${job.customer_name},</h2>
                <p>Your invoice is ready for the completed job.</p>
                
                <div class="invoice-details">
                    <h3>🧾 Invoice Details</h3>
                    <p><strong>Job:</strong> ${job.title}</p>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    ${job.amount ? `<p><strong>Amount:</strong> $${job.amount}</p>` : ""}
                    <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="text-align: center;">
                    <a href="${invoiceUrl}" class="cta-button">View & Pay Invoice</a>
                </div>

                <p><strong>Payment Instructions:</strong></p>
                <ul>
                    <li>Click the button above to view your detailed invoice</li>
                    <li>Multiple payment methods are accepted</li>
                    <li>Payment confirmation will be sent automatically</li>
                </ul>
            </div>
            <div class="footer">
                <p>Thank you for your business!<br>The Job Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePaymentReceivedTemplate(
  job: JobDetails,
  amount: number,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Payment Received</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Payment Received</h1>
            </div>
            <div class="content">
                <h2>Thank you, ${job.customer_name}!</h2>
                <p>We have successfully received your payment.</p>
                
                <div class="payment-details">
                    <h3>💰 Payment Confirmation</h3>
                    <p><strong>Job:</strong> ${job.title}</p>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>Amount Paid:</strong> $${amount}</p>
                    <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">PAID</span></p>
                </div>

                <p>Your payment has been processed successfully. A receipt will be sent to you separately for your records.</p>
                
                <p>If you have any questions about your payment or need additional support, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>Thank you for your business!<br>The Job Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePaymentReceivedAdminTemplate(
  job: JobDetails,
  amount: number,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Payment Received - Admin Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Payment Received</h1>
            </div>
            <div class="content">
                <h2>Hello Admin,</h2>
                <p>A payment has been received for a job.</p>
                
                <div class="payment-details">
                    <h3>💳 Payment Details</h3>
                    <p><strong>Job:</strong> ${job.title}</p>
                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>Customer:</strong> ${job.customer_name} (${job.customer_email})</p>
                    <p><strong>Amount:</strong> $${amount}</p>
                    <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p>The payment has been processed successfully. Please update the job status and any necessary records in the admin dashboard.</p>
            </div>
            <div class="footer">
                <p>Admin Notification System</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateDirectMessageTemplate(
  message: string,
  recipientName?: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Direct Message</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fd7e14; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .message { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #fd7e14; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📧 Direct Message</h1>
            </div>
            <div class="content">
                <h2>Hello ${recipientName || "there"}!</h2>
                <p>You have received a direct message:</p>
                
                <div class="message">
                    ${message.replace(/\n/g, "<br>")}
                </div>

                <p>If this message requires a response, please reply accordingly.</p>
            </div>
            <div class="footer">
                <p>Direct Communication System</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
