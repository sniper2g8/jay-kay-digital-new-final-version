/**
 * SMS API Endpoint for Jay Kay Digital Press
 * Handles sending SMS using Twilio service
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client only if credentials are available and valid
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if credentials are valid (not placeholder values)
const hasValidCredentials = accountSid && 
  authToken && 
  accountSid.startsWith('AC') && 
  accountSid !== 'your_twilio_account_sid' && 
  authToken !== 'your_twilio_auth_token';

const client = hasValidCredentials ? twilio(accountSid, authToken) : null;

interface SMSRequest {
  to: string;
  message: string;
  from?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Twilio is configured
    if (!client || !fromNumber) {
      console.warn('SMS service not configured - Twilio credentials missing');
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body: SMSRequest = await request.json();
    const { to, message, from = fromNumber } = body;

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format phone number for Sierra Leone if needed
    let formattedTo = to;
    if (to.startsWith('0')) {
      formattedTo = '+232' + to.substring(1);
    } else if (!to.startsWith('+')) {
      formattedTo = '+232' + to;
    }

    // Send SMS using Twilio
    const messageResponse = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo,
    });

    return NextResponse.json(
      { 
        success: true, 
        messageSid: messageResponse.sid,
        message: 'SMS sent successfully',
        to: formattedTo
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('SMS API error:', error);
    
    // Handle Twilio specific errors
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      return NextResponse.json(
        { 
          error: 'SMS sending failed', 
          details: error.message,
          code: error.code 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}