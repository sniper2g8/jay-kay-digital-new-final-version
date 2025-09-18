import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailNotificationRequest {
  type: 'job_created' | 'job_status_change' | 'payment_received' | 'statement_ready' | 'invoice_sent' | 'custom_email';
  recipientEmail: string;
  recipientName?: string;
  data: {
    jobId?: string;
    jobTitle?: string;
    status?: string;
    previousStatus?: string;
    paymentAmount?: number;
    paymentDate?: string;
    statementPeriod?: string;
    invoiceNumber?: string;
    invoiceAmount?: number;
    customSubject?: string;
    customMessage?: string;
    customHtml?: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { type, recipientEmail, recipientName, data }: EmailNotificationRequest = await req.json();

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    // Generate email content based on type
    const emailContent = generateEmailContent(type, recipientName, data);

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'JayKay Digital Press <noreply@jaykaydigitalpress.com>',
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const resendResult = await resendResponse.json();

    // Log the notification in the database
    const { error: logError } = await supabaseClient
      .from('email_notifications')
      .insert({
        type,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: emailContent.subject,
        sent_at: new Date().toISOString(),
        resend_id: resendResult.id,
        status: 'sent',
        metadata: data,
      });

    if (logError) {
      console.error('Failed to log email notification:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendResult.id,
        message: 'Email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Email notification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateEmailContent(type: string, recipientName: string | undefined, data: any) {
  const name = recipientName || 'Valued Customer';
  
  switch (type) {
    case 'job_created':
      return {
        subject: `Job Created: ${data.jobTitle}`,
        html: generateJobCreatedTemplate(name, data),
      };
    
    case 'job_status_change':
      return {
        subject: `Job Update: ${data.jobTitle} - ${data.status}`,
        html: generateJobStatusTemplate(name, data),
      };
    
    case 'payment_received':
      return {
        subject: `Payment Received - Thank You!`,
        html: generatePaymentReceivedTemplate(name, data),
      };
    
    case 'statement_ready':
      return {
        subject: `Your Monthly Statement is Ready`,
        html: generateStatementReadyTemplate(name, data),
      };
    
    case 'invoice_sent':
      return {
        subject: `Invoice #${data.invoiceNumber} - JayKay Digital Press`,
        html: generateInvoiceTemplate(name, data),
      };
    
    case 'custom_email':
      return {
        subject: data.customSubject || 'Message from JayKay Digital Press',
        html: data.customHtml || generateCustomEmailTemplate(name, data.customMessage),
      };
    
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

function generateJobCreatedTemplate(name: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .job-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 New Job Created!</h1>
        <p>Your print job has been successfully submitted</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>Thank you for choosing JayKay Digital Press! We've received your new print job and our team is already reviewing the details.</p>
        
        <div class="job-info">
          <h3>📋 Job Details</h3>
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Job ID:</strong> ${data.jobId}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Received</span></p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>🔄 <strong>What happens next?</strong></p>
        <ul>
          <li>Our team will review your specifications</li>
          <li>We'll prepare a detailed quote if needed</li>
          <li>Production will begin once approved</li>
          <li>You'll receive updates throughout the process</li>
        </ul>

        <p>You can track your job progress anytime through your customer portal.</p>
        
        <div style="text-align: center;">
          <a href="https://jaykaydigitalpress.com/dashboard/jobs" class="button">View Job Status</a>
        </div>

        <p>If you have any questions, feel free to contact us. We're here to help!</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}

function generateJobStatusTemplate(name: string, data: any) {
  const statusColors: { [key: string]: string } = {
    'in_progress': '#ffc107',
    'printing': '#17a2b8',
    'quality_check': '#6f42c1',
    'ready_for_pickup': '#28a745',
    'completed': '#28a745',
    'on_hold': '#dc3545',
  };

  const statusEmojis: { [key: string]: string } = {
    'in_progress': '⚙️',
    'printing': '🖨️',
    'quality_check': '🔍',
    'ready_for_pickup': '📦',
    'completed': '✅',
    'on_hold': '⏸️',
  };

  const statusColor = statusColors[data.status] || '#6c757d';
  const statusEmoji = statusEmojis[data.status] || '📋';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
        .status-badge { background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${statusEmoji} Job Status Update</h1>
        <p>Your print job has been updated</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>We have an update on your print job. Here are the latest details:</p>
        
        <div class="status-update">
          <h3>📋 Job Details</h3>
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Job ID:</strong> ${data.jobId}</p>
          <p><strong>Previous Status:</strong> ${data.previousStatus || 'N/A'}</p>
          <p><strong>Current Status:</strong> <span class="status-badge">${data.status.replace('_', ' ').toUpperCase()}</span></p>
          <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        ${getStatusMessage(data.status)}

        <div style="text-align: center;">
          <a href="https://jaykaydigitalpress.com/dashboard/jobs" class="button">View Full Details</a>
        </div>

        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'in_progress':
      return '<p>🚀 Great news! We\'ve started working on your job. Our team is currently preparing your materials for production.</p>';
    case 'printing':
      return '<p>🖨️ Your job is now in production! Our high-quality printing equipment is working on your order.</p>';
    case 'quality_check':
      return '<p>🔍 Your print job is complete and we\'re conducting our final quality inspection to ensure everything meets our high standards.</p>';
    case 'ready_for_pickup':
      return '<p>📦 Excellent! Your order is ready for pickup. Please visit our location during business hours to collect your items.</p>';
    case 'completed':
      return '<p>✅ Your job has been completed successfully! Thank you for choosing JayKay Digital Press.</p>';
    case 'on_hold':
      return '<p>⏸️ Your job is temporarily on hold. Our team will contact you shortly with more information.</p>';
    default:
      return '<p>Your job status has been updated. Please check your dashboard for more details.</p>';
  }
}

function generatePaymentReceivedTemplate(name: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .payment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .amount { font-size: 24px; color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💳 Payment Received!</h1>
        <p>Thank you for your payment</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>We've successfully received your payment. Thank you for your prompt payment!</p>
        
        <div class="payment-info">
          <h3>💰 Payment Details</h3>
          <p><strong>Amount:</strong> <span class="amount">$${data.paymentAmount?.toFixed(2)}</span></p>
          <p><strong>Date:</strong> ${data.paymentDate || new Date().toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
        </div>

        <p>Your payment has been processed and applied to your account. A receipt has been generated for your records.</p>

        <p>If you have any questions about this payment or need additional documentation, please don't hesitate to contact us.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}

function generateStatementReadyTemplate(name: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Statement Ready</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .statement-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6f42c1; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Statement Ready</h1>
        <p>Your account statement is now available</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>Your account statement for the specified period is now ready for review.</p>
        
        <div class="statement-info">
          <h3>📋 Statement Details</h3>
          <p><strong>Period:</strong> ${data.statementPeriod}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Available</span></p>
        </div>

        <p>Your statement includes a detailed breakdown of all transactions, payments, and account activity for the specified period.</p>

        <div style="text-align: center;">
          <a href="https://jaykaydigitalpress.com/dashboard/finances" class="button">View Statement</a>
        </div>

        <p>If you have any questions about your statement or need additional information, please contact us.</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}

function generateInvoiceTemplate(name: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .invoice-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fd7e14; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #fd7e14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .amount { font-size: 24px; color: #fd7e14; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧾 Invoice Sent</h1>
        <p>Your invoice is ready for payment</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>We've prepared an invoice for your recent services. Please review the details below:</p>
        
        <div class="invoice-info">
          <h3>💰 Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> <span class="amount">$${data.invoiceAmount?.toFixed(2)}</span></p>
          <p><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Terms:</strong> Net 30 days</p>
        </div>

        <p>You can view the complete invoice details and make payment through your customer portal.</p>

        <div style="text-align: center;">
          <a href="https://jaykaydigitalpress.com/dashboard/finances" class="button">View & Pay Invoice</a>
        </div>

        <p>Thank you for your business! If you have any questions about this invoice, please contact us.</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}

function generateCustomEmailTemplate(name: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message from JayKay Digital Press</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💌 Personal Message</h1>
        <p>A message from our team</p>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        
        <div class="message">
          ${message.replace(/\n/g, '<br>')}
        </div>

        <p>Thank you for your continued business!</p>
        
        <p>Best regards,<br>
        <strong>The JayKay Digital Press Team</strong></p>
      </div>
      <div class="footer">
        <p>JayKay Digital Press | Professional Printing Services</p>
        <p>📧 info@jaykaydigitalpress.com | 📞 (555) 123-4567</p>
      </div>
    </body>
    </html>
  `;
}