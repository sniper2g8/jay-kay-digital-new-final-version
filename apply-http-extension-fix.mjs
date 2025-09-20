#!/usr/bin/env node

/**
 * Script to apply HTTP extension fix to Supabase database
 * This script enables the HTTP extension and updates function calls to use the correct schema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyHttpExtensionFix() {
  console.log('🔧 Applying HTTP extension fix to Supabase database...');
  
  try {
    // Enable the HTTP extension
    console.log('1. Enabling HTTP extension...');
    const { error: extensionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create the extensions schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS extensions;
        
        -- Enable the http extension
        CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
        
        -- Grant usage on the extensions schema
        GRANT USAGE ON SCHEMA extensions TO authenticator;
        GRANT USAGE ON SCHEMA extensions TO service_role;
        
        -- Grant execute permission on the http_post function
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticator;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
      `
    });
    
    if (extensionError) {
      console.error('❌ Error enabling HTTP extension:', extensionError);
      throw extensionError;
    }
    
    console.log('✅ HTTP extension enabled successfully');
    
    // Update the notify_job_status_change function to use extensions.http_post
    console.log('2. Updating notify_job_status_change function...');
    const { error: jobFunctionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION notify_job_status_change()
        RETURNS TRIGGER AS $$
        DECLARE
          customer_email TEXT;
          customer_name TEXT;
          job_title TEXT;
          previous_status TEXT;
        BEGIN
          -- Get customer email and name
          SELECT 
            c.email, 
            c.business_name,
            NEW.title
          INTO customer_email, customer_name, job_title
          FROM customers c
          WHERE c.id = NEW.customer_id;

          -- If no business name, try to get from contact info
          IF customer_name IS NULL AND customer_email IS NOT NULL THEN
            customer_name := split_part(customer_email, '@', 1);
          END IF;

          -- Get previous status if this is an update
          IF TG_OP = 'UPDATE' THEN
            previous_status := OLD.status;
          END IF;

          -- Only trigger if status actually changed and we have customer email
          IF (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) 
             AND customer_email IS NOT NULL THEN
            
            -- Call the Edge Function via HTTP request
            PERFORM
              extensions.http_post(
                url := '${supabaseUrl}/functions/v1/email-notifications',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                  'type', CASE 
                    WHEN TG_OP = 'INSERT' THEN 'job_created'
                    ELSE 'job_status_change'
                  END,
                  'recipientEmail', customer_email,
                  'recipientName', customer_name,
                  'data', jsonb_build_object(
                    'jobId', NEW.id::text,
                    'jobTitle', job_title,
                    'status', NEW.status,
                    'previousStatus', previous_status
                  )
                )
              );
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (jobFunctionError) {
      console.error('❌ Error updating notify_job_status_change function:', jobFunctionError);
      throw jobFunctionError;
    }
    
    console.log('✅ notify_job_status_change function updated successfully');
    
    // Update the notify_payment_received function to use extensions.http_post
    console.log('3. Updating notify_payment_received function...');
    const { error: paymentFunctionError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION notify_payment_received()
        RETURNS TRIGGER AS $$
        DECLARE
          customer_email TEXT;
          customer_name TEXT;
        BEGIN
          -- Get customer email and name
          SELECT 
            c.email, 
            c.business_name
          INTO customer_email, customer_name
          FROM customers c
          WHERE c.id = NEW.customer_id;

          -- If no business name, try to get from contact info
          IF customer_name IS NULL AND customer_email IS NOT NULL THEN
            customer_name := split_part(customer_email, '@', 1);
          END IF;

          -- Only trigger if we have customer email and payment is confirmed
          IF customer_email IS NOT NULL AND NEW.status = 'paid' THEN
            
            -- Call the Edge Function via HTTP request
            PERFORM
              extensions.http_post(
                url := '${supabaseUrl}/functions/v1/email-notifications',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                  'type', 'payment_received',
                  'recipientEmail', customer_email,
                  'recipientName', customer_name,
                  'data', jsonb_build_object(
                    'paymentAmount', NEW.amount,
                    'paymentDate', NEW.created_at::date
                  )
                )
              );
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (paymentFunctionError) {
      console.error('❌ Error updating notify_payment_received function:', paymentFunctionError);
      throw paymentFunctionError;
    }
    
    console.log('✅ notify_payment_received function updated successfully');
    
    console.log('🎉 HTTP extension fix applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Redeploy your Supabase functions if needed');
    console.log('2. Test job status updates to verify the fix');
    console.log('3. Check Supabase function logs for any remaining issues');
    
  } catch (error) {
    console.error('❌ Failed to apply HTTP extension fix:', error);
    process.exit(1);
  }
}

// Run the script
if (process.argv[1] === import.meta.url) {
  applyHttpExtensionFix();
}

export { applyHttpExtensionFix };