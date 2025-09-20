import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNotificationService() {
  console.log('Testing Notification Service API...');
  
  // Test data for different notification types
  const testCases = [
    {
      type: 'job_submission',
      recipient_type: 'customer',
      email: 'test@example.com',
      test_data: {
        job_id: 'test-job-001',
        job_number: 'JKDP-2024-TEST-001',
        customer_id: 'test-customer-001',
        customer_name: 'Test Customer'
      }
    },
    {
      type: 'job_status_change',
      recipient_type: 'customer',
      email: 'test@example.com',
      test_data: {
        job_id: 'test-job-001',
        job_number: 'JKDP-2024-TEST-001',
        customer_id: 'test-customer-001',
        customer_name: 'Test Customer',
        old_status: 'submitted',
        new_status: 'in_production'
      }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting ${testCase.type} notification...`);
      
      const response = await fetch('http://localhost:3000/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase),
      });
      
      const result = await response.json();
      
      console.log(`Response status: ${response.status}`);
      if (response.ok) {
        console.log(`✅ ${testCase.type} test successful`);
        console.log(`Message: ${result.message}`);
      } else {
        console.log(`❌ ${testCase.type} test failed`);
        console.log(`Error: ${result.error}`);
        if (result.details) {
          console.log(`Details: ${result.details}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${testCase.type} test error:`, error.message);
    }
  }
}

testNotificationService().catch(console.error);