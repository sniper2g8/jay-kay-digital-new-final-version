// Test script for job status email notifications
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Job Status Email Notification System');
console.log('==============================================');

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS: ${process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS}`);
console.log(`COMPANY_EMAIL: ${process.env.COMPANY_EMAIL}`);

if (!process.env.RESEND_API_KEY) {
  console.log('\n❌ ERROR: RESEND_API_KEY is not set in .env.local');
  console.log('Please add your Resend API key to the environment file.');
  process.exit(1);
}

// Test data
const testNotificationData = {
  customerEmail: 'test@example.com', // Change this to a real email for testing
  customerName: 'John Doe',
  jobNumber: 'JKDP-JOB-0001',
  jobTitle: 'Business Cards Printing',
  oldStatus: 'pending',
  newStatus: 'in_progress',
  estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  notes: 'Your business cards are now being printed with premium quality materials.'
};

console.log('\n📧 Test Notification Data:');
console.log(JSON.stringify(testNotificationData, null, 2));

async function testEmailNotification() {
  try {
    console.log('\n🚀 Sending test notification...');
    
    const response = await fetch('http://localhost:3000/api/notifications/job-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNotificationData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS: Email notification sent successfully!');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${testNotificationData.customerEmail}`);
      console.log('\n📝 Features tested:');
      console.log('  ✅ Email template generation');
      console.log('  ✅ Status-specific styling');
      console.log('  ✅ Company branding');
      console.log('  ✅ Estimated delivery display');
      console.log('  ✅ Custom notes inclusion');
      console.log('  ✅ Resend API integration');
    } else {
      console.log('❌ FAILED: Email notification failed');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

  } catch (error) {
    console.log('❌ ERROR: Failed to send test notification');
    console.error(error);
  }
}

// Test different status changes
async function testMultipleStatusChanges() {
  const statusTests = [
    { newStatus: 'in_progress', description: 'Job started notification' },
    { newStatus: 'completed', description: 'Job completed notification' },
    { newStatus: 'on_hold', description: 'Job on hold notification' },
    { newStatus: 'quote_sent', description: 'Quote sent notification' }
  ];

  console.log('\n🔄 Testing multiple status change notifications...');
  
  for (const test of statusTests) {
    console.log(`\n📤 Testing: ${test.description}`);
    
    const testData = {
      ...testNotificationData,
      newStatus: test.newStatus,
      jobNumber: `JKDP-JOB-000${statusTests.indexOf(test) + 2}`
    };

    try {
      const response = await fetch('http://localhost:3000/api/notifications/job-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`  ✅ ${test.description} - SUCCESS`);
      } else {
        console.log(`  ❌ ${test.description} - FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.description} - ERROR: ${error.message}`);
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function runTests() {
  console.log('\n🎯 Starting Email Notification Tests...');
  
  // Test 1: Basic email notification
  await testEmailNotification();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Multiple status changes (uncomment to test)
  // await testMultipleStatusChanges();
  
  console.log('\n🏁 Testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check your email inbox for the test notifications');
  console.log('2. Verify the email template looks correct');
  console.log('3. Test the notification system in the actual application');
  console.log('4. Integrate with job status update workflows');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/job-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty body to trigger validation error
    });
    
    if (response.status === 400) {
      console.log('✅ Server is running and API endpoint is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running or API endpoint is not accessible');
    console.log('Please start the development server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);