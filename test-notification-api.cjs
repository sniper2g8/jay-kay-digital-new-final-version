// Test notification API endpoint
require('dotenv').config({ path: '.env.local' });

async function testNotificationAPI() {
  console.log('Testing notification API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'job_submission',
        recipient_type: 'customer',
        email: 'test@example.com'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error calling notification API:', error.message);
  }
}

testNotificationAPI();