/**
 * Notification Test API Endpoint
 * Allows testing of email and SMS notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';

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

    // Default test data based on notification type
    let notificationData;
    
    switch (type) {
      case 'job_submission':
        notificationData = {
          job_id: 'test-job-001',
          job_number: 'JKDP-2024-TEST-001',
          customer_id: 'test-customer-001',
          customer_name: 'Test Customer',
          customer_email: email || 'test@example.com',
          customer_phone: phone || '+23234788711',
          new_status: 'submitted',
          ...test_data
        };
        
        await notificationService.sendJobSubmissionNotification(notificationData);
        break;

      case 'job_status_change':
        notificationData = {
          job_id: 'test-job-001',
          job_number: 'JKDP-2024-TEST-001',
          customer_id: 'test-customer-001',
          customer_name: 'Test Customer',
          customer_email: email || 'test@example.com',
          customer_phone: phone || '+23234788711',
          old_status: 'submitted',
          new_status: 'in_production',
          admin_message: 'Your job is now being processed.',
          ...test_data
        };
        
        await notificationService.sendJobStatusChangeNotification(notificationData);
        break;

      case 'payment_recorded':
        notificationData = {
          payment_id: 'test-payment-001',
          invoice_no: 'JKDP-2024-INV-001',
          customer_id: 'test-customer-001',
          customer_name: 'Test Customer',
          customer_email: email || 'test@example.com',
          customer_phone: phone || '+23234788711',
          amount: 250000,
          payment_method: 'mobile_money',
          payment_date: new Date().toLocaleDateString(),
          ...test_data
        };
        
        await notificationService.sendPaymentRecordNotification(notificationData);
        break;

      case 'invoice_generated':
        notificationData = {
          invoice_id: 'test-invoice-001',
          invoice_no: 'JKDP-2024-INV-001',
          customer_id: 'test-customer-001',
          customer_name: 'Test Customer',
          customer_email: email || 'test@example.com',
          customer_phone: phone || '+23234788711',
          amount: 250000,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          ...test_data
        };
        
        await notificationService.sendInvoiceNotification(notificationData);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Test ${type} notification sent to ${recipient_type}`,
        data: notificationData
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