// Test notification API endpoint
require('dotenv').config({ path: '.env.local' });

async function testNotificationAPI() {
  console.log('Testing notification API...');
  
  try {
    const testData = {
      type: 'job_submission',
      recipient_type: 'customer',
      email: 'test@example.com',
      phone: '+1234567890'
    };
    
    console.log('Sending request to notification API...');
    const response = await fetch('http://localhost:3001/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 200) {
      console.log('✅ Notification API test successful!');
    } else {
      console.log('❌ Notification API test failed');
    }
    
  } catch (error) {
    console.error('Error calling notification API:', error.message);
  }
}

testNotificationAPI();