import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testJobStatusAPI() {
  console.log('Testing Job Status Notification API...');
  
  // Test data
  const testData = {
    customerEmail: 'test@example.com',
    customerName: 'Test Customer',
    jobNumber: 'JKDP-TEST-001',
    jobTitle: 'Test Job',
    oldStatus: 'pending',
    newStatus: 'in_progress',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'This is a test notification'
  };
  
  try {
    console.log('Sending test request to /api/notifications/job-status...');
    
    const response = await fetch('http://localhost:3000/api/notifications/job-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API test successful');
    } else {
      console.log('❌ API test failed');
    }
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testJobStatusAPI().catch(console.error);