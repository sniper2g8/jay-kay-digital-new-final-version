import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Debug API: Received request');
    
    // Try to get the body
    const body = await request.json();
    console.log('Debug API: Body received', body);
    
    // Test the notification service with minimal data
    const testData = {
      job_id: 'test-job-001',
      job_number: 'JKDP-2024-TEST-001',
      customer_id: 'test-customer-001',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+23234788711',
      new_status: 'submitted'
    };
    
    console.log('Debug API: Calling notification service');
    await notificationService.sendJobSubmissionNotification(testData);
    console.log('Debug API: Notification service completed');
    
    return NextResponse.json({ success: true, message: 'Test completed' });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}