import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Testing Resend API key...');

// Check if API key exists
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in environment variables');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY is set');

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Test the API key
async function testResendKey() {
  try {
    console.log('Testing Resend API connection...');
    
    // Try to validate the API key by getting the account info
    // This is a simple test that doesn't send any emails
    const result = await resend.contacts.list({ audienceId: 'test' });
    
    // If we get here, the API key is valid
    console.log('✅ Resend API key is valid');
    console.log('API response:', result);
  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      console.error('❌ Resend API key is invalid or unauthorized');
    } else if (error.message.includes('audience') || error.message.includes('contact')) {
      // This is expected since we're using a fake audience ID
      console.log('✅ Resend API key is valid (got expected error for test request)');
    } else {
      console.error('❌ Resend API test failed:', error.message);
    }
  }
}

testResendKey().catch(console.error);