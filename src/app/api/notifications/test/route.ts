/**
 * Notification Test API Endpoint
 * Allows testing of email and SMS notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { v4 as uuidv4 } from 'uuid';

interface TestNotificationRequest {
  type: 'job_submission' | 'job_status_change' | 'payment_recorded' | 'invoice_generated';
  recipient_type: 'admin' | 'customer';
  email?: string;
  phone?: string;
  test_data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestNotificationRequest = await request.json();
    const { type, recipient_type, email, phone, test_data } = body;

    // Validate required fields
    if (!type || !recipient_type) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipient_type' },
        { status: 400 }
      );
    }

    // Test the basic email sending functionality first
    if (type === 'job_submission' && recipient_type === 'customer') {
      try {
        // Test email sending directly without database dependency
        const emailResponse = await fetch('http://localhost:3000/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email || 'test@example.com',
            subject: 'Test Notification from Jay Kay Digital Press',
            html: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc2626;">Test Notification - Jay Kay Digital Press</h2>
                    <p>This is a test notification email to verify the email system is working correctly.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p><strong>Test Type:</strong> ${type}</p>
                      <p><strong>Recipient Type:</strong> ${recipient_type}</p>
                      <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p>If you received this email, the notification system is working properly!</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                      Jay Kay Digital Press<br>
                      St. Edward School Avenue, By Caritas, Freetown, Sierra Leone<br>
                      Phone: +232 34 788711 | +232 30 741062<br>
                      Email: noreply@jaykaydigitalpress.com
                    </p>
                  </div>
                </body>
              </html>
            `,
            from: 'noreply@jaykaydigitalpress.com',
            fromName: 'Jay Kay Digital Press'
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Email sending failed: ${emailResponse.status} - ${errorData}`);
        }

        const emailResult = await emailResponse.json();
        
        return NextResponse.json(
          { 
            success: true, 
            message: `Test email sent successfully to ${email || 'test@example.com'}`,
            email_result: emailResult,
            test_mode: true
          },
          { status: 200 }
        );

      } catch (emailError) {
        console.error('Email test error:', emailError);
        return NextResponse.json(
          { 
            error: 'Email sending failed', 
            details: emailError instanceof Error ? emailError.message : 'Unknown email error',
            test_mode: true
          },
          { status: 500 }
        );
      }
    }

    // For other notification types, return a simple success response for now
    return NextResponse.json(
      { 
        success: true, 
        message: `Test ${type} notification for ${recipient_type} (placeholder)`,
        note: 'Full notification system temporarily bypassed for testing'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Test notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Notification Test API',
      endpoints: {
        'POST /api/notifications/test': 'Send test notifications',
        'POST /api/notifications/job-submission': 'Send job submission notification',
        'POST /api/notifications/job-status': 'Send job status change notification',
        'POST /api/notifications/payment': 'Send payment notification',
        'POST /api/notifications/invoice': 'Send invoice notification'
      }
    },
    { status: 200 }
  );
}