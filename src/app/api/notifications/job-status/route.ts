import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface JobNotificationData {
  customerEmail: string;
  customerName: string;
  jobNumber: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  estimatedDelivery?: string;
  notes?: string;
}

const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pending Review',
    'in_progress': 'In Production',
    'review': 'Under Review',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'on_hold': 'On Hold',
    'quote_sent': 'Quote Sent'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'pending': '#f59e0b',
    'in_progress': '#3b82f6',
    'review': '#8b5cf6',
    'completed': '#10b981',
    'cancelled': '#ef4444',
    'on_hold': '#6b7280',
    'quote_sent': '#06b6d4'
  };
  return colorMap[status] || '#6b7280';
};

const generateEmailTemplate = (data: JobNotificationData): string => {
  const statusColor = getStatusColor(data.newStatus);
  const statusDisplay = getStatusDisplayName(data.newStatus);
  const oldStatusDisplay = getStatusDisplayName(data.oldStatus);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Status Update - ${data.jobNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Jay Kay Digital Press</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Job Status Update</p>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Greeting -->
            <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">Hello ${data.customerName},</h2>
            
            <!-- Status Update Card -->
            <div style="background: #f8fafc; border-left: 4px solid ${statusColor}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">Status Update for Job #${data.jobNumber}</h3>
                <p style="margin: 10px 0; font-size: 16px;"><strong>Job Title:</strong> ${data.jobTitle}</p>
                
                <div style="margin: 20px 0;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="background: #e2e8f0; color: #4a5568; padding: 6px 12px; border-radius: 20px; font-size: 14px; margin-right: 10px;">Previous</span>
                        <span style="color: #718096;">${oldStatusDisplay}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; margin-right: 10px;">Current</span>
                        <span style="color: #2d3748; font-weight: 600;">${statusDisplay}</span>
                    </div>
                </div>
            </div>

            <!-- Status-specific messages -->
            ${data.newStatus === 'completed' ? `
                <div style="background: #f0fff4; border: 1px solid #9ae6b4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #276749; margin: 0 0 10px 0;">🎉 Great News!</h4>
                    <p style="color: #276749; margin: 0;">Your order is ready for pickup or delivery. Please contact us to arrange collection.</p>
                </div>
            ` : ''}

            ${data.newStatus === 'in_progress' ? `
                <div style="background: #ebf8ff; border: 1px solid #90cdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #2c5282; margin: 0 0 10px 0;">🔄 In Production</h4>
                    <p style="color: #2c5282; margin: 0;">Your job is now being processed. We'll keep you updated on the progress.</p>
                </div>
            ` : ''}

            ${data.newStatus === 'on_hold' ? `
                <div style="background: #fffbeb; border: 1px solid #f6d55c; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0;">⏸️ On Hold</h4>
                    <p style="color: #92400e; margin: 0;">Your job has been temporarily paused. We'll contact you with more details.</p>
                </div>
            ` : ''}

            ${data.estimatedDelivery ? `
                <p style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 6px;">
                    <strong>Estimated Delivery:</strong> ${new Date(data.estimatedDelivery).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </p>
            ` : ''}

            ${data.notes ? `
                <div style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 6px;">
                    <strong>Additional Notes:</strong>
                    <p style="margin: 10px 0 0 0;">${data.notes}</p>
                </div>
            ` : ''}

            <!-- Contact Information -->
            <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h4 style="color: #2d3748; margin: 0 0 15px 0;">Need Help?</h4>
                <p style="margin: 5px 0;">📞 <strong>Phone:</strong> +232 34 788711 | +232 30 741062</p>
                <p style="margin: 5px 0;">📧 <strong>Email:</strong> jaykaydigitalpress@gmail.com</p>
                <p style="margin: 5px 0;">📍 <strong>Address:</strong> St. Edward School Avenue, By Caritas, Freetown, Sierra Leone</p>
            </div>

            <!-- Footer Message -->
            <p style="margin: 30px 0 0 0; color: #718096; font-size: 14px; text-align: center;">
                Thank you for choosing Jay Kay Digital Press for your printing needs.
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; color: #a0aec0; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Jay Kay Digital Press. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
  `;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      jobNumber,
      jobTitle,
      oldStatus,
      newStatus,
      estimatedDelivery,
      notes
    }: JobNotificationData = body;

    // Validate required fields
    if (!customerEmail || !customerName || !jobNumber || !jobTitle || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const statusDisplay = getStatusDisplayName(newStatus);
    const emailHtml = generateEmailTemplate({
      customerEmail,
      customerName,
      jobNumber,
      jobTitle,
      oldStatus: oldStatus || 'unknown',
      newStatus,
      estimatedDelivery,
      notes
    });

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Jay Kay Digital Press <noreply@jaykaydigitalpress.com>',
      to: [customerEmail],
      subject: `Job Status Update: ${jobNumber} - ${statusDisplay}`,
      html: emailHtml,
      replyTo: 'jaykaydigitalpress@gmail.com'
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Email sent successfully to ${customerEmail}`
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}