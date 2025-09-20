#!/usr/bin/env node

/**
 * Debug script to test the notification API endpoint directly
 */

import { notificationService } from './src/lib/notification-service.ts';

async function testNotificationService() {
  console.log('Testing notification service...');
  
  try {
    // Test data similar to what the API endpoint would receive
    const testData = {
      job_id: 'test-job-001',
      job_number: 'JKDP-2024-TEST-001',
      customer_id: 'test-customer-001',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+23234788711',
      new_status: 'submitted'
    };

    console.log('Calling sendJobSubmissionNotification...');
    await notificationService.sendJobSubmissionNotification(testData);
    console.log('✅ Notification sent successfully!');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// Run the test
testNotificationService().catch(console.error);