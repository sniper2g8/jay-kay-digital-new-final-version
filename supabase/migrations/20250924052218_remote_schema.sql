


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";




ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."expense_category" AS ENUM (
    'materials',
    'equipment',
    'utilities',
    'salaries',
    'maintenance',
    'transport',
    'office',
    'marketing',
    'other'
);


ALTER TYPE "public"."expense_category" OWNER TO "postgres";


CREATE TYPE "public"."inventory_status" AS ENUM (
    'in_stock',
    'low_stock',
    'out_of_stock',
    'ordered',
    'discontinued'
);


ALTER TYPE "public"."inventory_status" OWNER TO "postgres";


CREATE TYPE "public"."job_status_new" AS ENUM (
    'submitted',
    'quoted',
    'approved',
    'in_production',
    'quality_check',
    'completed',
    'delivered',
    'cancelled',
    'on_hold'
);


ALTER TYPE "public"."job_status_new" OWNER TO "postgres";


CREATE TYPE "public"."job_type_enum" AS ENUM (
    'business_cards',
    'flyers',
    'banners',
    'books',
    'brochures',
    'letterheads',
    'calendars',
    'stickers',
    'certificates',
    'other'
);


ALTER TYPE "public"."job_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'job_update',
    'payment_due',
    'delivery_ready',
    'system_alert',
    'promotion',
    'reminder'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'bank_transfer',
    'mobile_money',
    'card',
    'cheque',
    'credit'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'staff',
    'customer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_running_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  prev_balance DECIMAL(10,2) := 0;
BEGIN
  -- Get the previous balance for this customer up to this transaction date
  SELECT COALESCE(running_balance, 0) INTO prev_balance
  FROM customer_statement_transactions
  WHERE customer_id = NEW.customer_id
    AND transaction_date <= NEW.transaction_date
    AND id != NEW.id
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- Only calculate if running_balance is not already set
  IF NEW.running_balance IS NULL THEN
    -- Calculate new running balance based on transaction type
    IF NEW.transaction_type IN ('charge') THEN
      NEW.running_balance := prev_balance + NEW.amount;
    ELSE -- payment, adjustment, credit
      NEW.running_balance := prev_balance - NEW.amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_running_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_statement_transaction_from_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_period_id UUID;
BEGIN
  -- Only create statement transaction for finalized invoices
  IF NEW.invoice_status IN ('sent', 'paid') AND (OLD.invoice_status IS NULL OR OLD.invoice_status != NEW.invoice_status) THEN
    
    -- Find current statement period for customer
    SELECT id INTO current_period_id
    FROM customer_statement_periods
    WHERE customer_id = NEW.customer_id
      AND is_current_period = TRUE
      AND period_start <= NEW.invoice_date
      AND period_end >= NEW.invoice_date
    LIMIT 1;
    
    -- Create statement transaction if period exists
    IF current_period_id IS NOT NULL THEN
      INSERT INTO customer_statement_transactions (
        statement_period_id,
        customer_id,
        transaction_date,
        transaction_type,
        description,
        reference_number,
        amount,
        invoice_id,
        created_by
      ) VALUES (
        current_period_id,
        NEW.customer_id,
        NEW.invoice_date,
        'charge',
        'Invoice #' || COALESCE(NEW.invoiceNo, NEW.id::text),
        NEW.invoiceNo,
        COALESCE(NEW.total, NEW.grandTotal, 0),
        NEW.id,
        NEW.generated_by
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_statement_transaction_from_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_statement_transaction_from_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_period_id UUID;
  customer_id_val UUID;
BEGIN
  -- Get customer ID from payment
  SELECT customer_id INTO customer_id_val FROM invoices WHERE id = NEW.applied_to_invoice_id;
  
  IF customer_id_val IS NULL THEN
    customer_id_val := NEW.customer_id;
  END IF;
  
  -- Only create statement transaction for completed payments
  IF NEW.payment_status = 'completed' THEN
    
    -- Find current statement period for customer
    SELECT id INTO current_period_id
    FROM customer_statement_periods
    WHERE customer_id = customer_id_val
      AND is_current_period = TRUE
      AND period_start <= NEW.payment_date
      AND period_end >= NEW.payment_date
    LIMIT 1;
    
    -- Create statement transaction if period exists
    IF current_period_id IS NOT NULL THEN
      INSERT INTO customer_statement_transactions (
        statement_period_id,
        customer_id,
        transaction_date,
        transaction_type,
        description,
        reference_number,
        amount,
        payment_id,
        created_by
      ) VALUES (
        current_period_id,
        customer_id_val,
        NEW.payment_date::date,
        'payment',
        'Payment #' || NEW.payment_number,
        NEW.payment_number,
        NEW.amount,
        NEW.id,
        NEW.received_by
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_statement_transaction_from_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."firebase_id_to_uuid"("firebase_id" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN md5(firebase_id)::uuid;
END;
$$;


ALTER FUNCTION "public"."firebase_id_to_uuid"("firebase_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_number"("counter_name" "text", "prefix" "text" DEFAULT ''::"text", "suffix" "text" DEFAULT ''::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_val INTEGER;
    formatted_number TEXT;
BEGIN
    next_val := public.get_next_counter(counter_name);
    formatted_number := prefix || LPAD(next_val::TEXT, 4, '0') || suffix;
    RETURN formatted_number;
END;
$$;


ALTER FUNCTION "public"."generate_number"("counter_name" "text", "prefix" "text", "suffix" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_number"("counter_name" "text", "prefix" "text", "suffix" "text") IS 'Generates formatted numbers with prefix/suffix';



CREATE OR REPLACE FUNCTION "public"."generate_sequential_number"("counter_name" "text", "prefix" "text" DEFAULT ''::"text", "year_prefix" boolean DEFAULT true) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
            DECLARE
                next_number INTEGER;
                final_number TEXT;
                year_part TEXT;
            BEGIN
                -- Get and increment the counter
                UPDATE "counters" 
                SET last = last + 1, updated_at = NOW() 
                WHERE counter_id = counter_name 
                RETURNING last INTO next_number;
                
                -- If counter doesn't exist, create it
                IF next_number IS NULL THEN
                    INSERT INTO "counters" (counter_id, last, created_at, updated_at)
                    VALUES (counter_name, 1, NOW(), NOW());
                    next_number := 1;
                END IF;
                
                -- Build the final number
                IF year_prefix THEN
                    year_part := EXTRACT(YEAR FROM NOW())::TEXT || '-';
                ELSE
                    year_part := '';
                END IF;
                
                final_number := prefix || year_part || LPAD(next_number::TEXT, 4, '0');
                
                RETURN final_number;
            END;
            $$;


ALTER FUNCTION "public"."generate_sequential_number"("counter_name" "text", "prefix" "text", "year_prefix" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_tracking_url"("entity_type" "text", "entity_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
            BEGIN
                RETURN 'https://jaykaydigitalpress.com/track/' || entity_type || '/' || entity_id::TEXT;
            END;
            $$;


ALTER FUNCTION "public"."generate_tracking_url"("entity_type" "text", "entity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() OR auth_user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_counter"("counter_name" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    next_value integer;
BEGIN
    -- Atomically increment and get the next counter value
    UPDATE counters 
    SET last = last + 1, updated_at = NOW()
    WHERE counter_id = counter_name
    RETURNING last INTO next_value;
    
    -- If counter doesn't exist, create it
    IF next_value IS NULL THEN
        INSERT INTO counters (counter_id, last, created_at, updated_at)
        VALUES (counter_name, 1, NOW(), NOW())
        RETURNING last INTO next_value;
    END IF;
    
    RETURN next_value;
END;
$$;


ALTER FUNCTION "public"."get_next_counter"("counter_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_by_email"("user_email" "text") RETURNS TABLE("id" "uuid", "email" "text", "name" "text", "role" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT p.id, p.email, p.name, p.role::text
  FROM profiles p
  WHERE p.email = user_email;
$$;


ALTER FUNCTION "public"."get_profile_by_email"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_by_id"("user_id" "uuid") RETURNS TABLE("id" "uuid", "email" "text", "name" "text", "role" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT p.id, p.email, p.name, p.role::text
  FROM profiles p
  WHERE p.id = user_id;
$$;


ALTER FUNCTION "public"."get_profile_by_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_role_hierarchy"() RETURNS TABLE("role_id" "uuid", "role_name" character varying, "user_count" bigint, "permission_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    r.id,
                    r.name,
                    COUNT(DISTINCT au.id) AS user_count,
                    COUNT(DISTINCT rp.permission_id) AS permission_count
                FROM roles r
                LEFT JOIN "appUsers" au ON r.name = au.primary_role
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                GROUP BY r.id, r.name
                ORDER BY 
                    CASE r.name
                        WHEN 'super_admin' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'manager' THEN 3
                        WHEN 'staff' THEN 4
                        WHEN 'customer' THEN 5
                        ELSE 6
                    END;
            END;
            $$;


ALTER FUNCTION "public"."get_role_hierarchy"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    AS $$
            DECLARE
                user_permissions TEXT[];
            BEGIN
                -- Get permissions from primary role
                SELECT ARRAY_AGG(DISTINCT p.name)
                INTO user_permissions
                FROM "appUsers" au
                JOIN roles r ON au.primary_role = r.name
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE au.id = user_id;
                
                -- Add permissions from additional roles in user_roles table
                SELECT ARRAY_AGG(DISTINCT p.name) || COALESCE(user_permissions, ARRAY[]::TEXT[])
                INTO user_permissions
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = user_id;
                
                RETURN COALESCE(user_permissions, ARRAY[]::TEXT[]);
            END;
            $$;


ALTER FUNCTION "public"."get_user_permissions"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_primary_role"("user_id" "uuid") RETURNS TABLE("role_id" "uuid", "role_name" character varying, "role_description" "text", "permissions" "text"[])
    LANGUAGE "plpgsql" STABLE
    AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    r.id,
                    r.name,
                    r.description,
                    ARRAY_AGG(p.name) AS permissions
                FROM "appUsers" au
                JOIN roles r ON au.primary_role = r.name
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE au.id = user_id
                GROUP BY r.id, r.name, r.description;
            END;
            $$;


ALTER FUNCTION "public"."get_user_primary_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"("user_uuid" "uuid") RETURNS TABLE("role_name" "text", "role_display_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
            BEGIN
                RETURN QUERY
                SELECT r.name, r.display_name
                FROM "user_roles" ur
                JOIN "roles" r ON ur.role_id = r.id
                WHERE ur.user_id = user_uuid 
                AND ur.is_active = true;
            END;
            $$;


ALTER FUNCTION "public"."get_user_roles"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_counter"("counter_name" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    counter_value integer;
BEGIN
    -- Try to increment existing counter
    UPDATE counters 
    SET last = last + 1 
    WHERE name = counter_name 
    RETURNING last INTO counter_value;
    
    -- If no rows were updated, insert new counter
    IF NOT FOUND THEN
        INSERT INTO counters (name, last) 
        VALUES (counter_name, 1) 
        RETURNING last INTO counter_value;
    END IF;
    
    RETURN counter_value;
END;
$$;


ALTER FUNCTION "public"."increment_counter"("counter_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_profile_to_auth"("auth_user_id" "uuid", "profile_email" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE profiles
  SET id = auth_user_id
  WHERE email = profile_email;
  
  SELECT TRUE;
$$;


ALTER FUNCTION "public"."link_profile_to_auth"("auth_user_id" "uuid", "profile_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_job_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
  job_title TEXT;
  previous_status TEXT;
BEGIN
  -- Get customer email and name from the customers table
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
    
    -- Instead of making an HTTP call, we'll just log that a notification should be sent
    -- The actual notification will be sent by the application layer
    INSERT INTO email_notifications (
      type, 
      recipient_email, 
      recipient_name, 
      subject, 
      sent_at,
      metadata
    ) VALUES (
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'job_created'
        ELSE 'job_status_change'
      END,
      customer_email,
      customer_name,
      'Job Status Update: ' || COALESCE(NEW.title, 'Untitled Job'),
      NOW(),
      jsonb_build_object(
        'jobId', NEW.id::text,
        'jobTitle', job_title,
        'status', NEW.status,
        'previousStatus', previous_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_job_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_payment_received"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    
    -- Instead of making an HTTP call, we'll just log that a notification should be sent
    -- The actual notification will be sent by the application layer
    INSERT INTO email_notifications (
      type, 
      recipient_email, 
      recipient_name, 
      subject, 
      sent_at,
      metadata
    ) VALUES (
      'payment_received',
      customer_email,
      customer_name,
      'Payment Received',
      NOW(),
      jsonb_build_object(
        'paymentAmount', NEW.amount,
        'paymentDate', NEW.created_at::date
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_payment_received"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_invoice_status_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Attempt to get the current user's ID. This might be null if run by a system process.
  user_id := auth.uid();

  -- Only create a history entry if the status has actually changed.
  IF OLD.invoice_status IS DISTINCT FROM NEW.invoice_status THEN
    INSERT INTO public.invoice_status_history (
      invoice_id,
      status_from,
      status_to,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.invoice_status,
      NEW.invoice_status,
      user_id, -- Insert the user_id, which may be null.
      'Status updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_invoice_status_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_estimates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_estimates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_allocated DECIMAL(10,2) := 0;
  invoice_total DECIMAL(10,2) := 0;
  new_status VARCHAR(20);
BEGIN
  -- Get total allocated amount for this invoice
  SELECT COALESCE(SUM(allocated_amount), 0) INTO total_allocated
  FROM payment_allocations 
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get invoice total
  SELECT COALESCE(total, grandTotal, 0) INTO invoice_total
  FROM invoices 
  WHERE id = NEW.invoice_id;
  
  -- Determine new payment status
  IF total_allocated >= invoice_total THEN
    new_status := 'paid';
  ELSIF total_allocated > 0 THEN
    new_status := 'partial';
  ELSE
    new_status := 'pending';
  END IF;
  
  -- Update invoice payment status
  UPDATE invoices SET
    payment_status = new_status::payment_status,
    amountPaid = total_allocated,
    amountDue = invoice_total - total_allocated,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invoice_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  invoice_subtotal DECIMAL(10,2) := 0;
  invoice_tax_total DECIMAL(10,2) := 0;
  invoice_discount_total DECIMAL(10,2) := 0;
  invoice_grand_total DECIMAL(10,2) := 0;
BEGIN
  -- Calculate totals from line items
  SELECT 
    COALESCE(SUM(total_price), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(discount_amount), 0)
  INTO 
    invoice_subtotal,
    invoice_tax_total,
    invoice_discount_total
  FROM invoice_line_items 
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate grand total
  invoice_grand_total := invoice_subtotal + invoice_tax_total - invoice_discount_total;
  
  -- Update the invoice
  UPDATE invoices SET
    subtotal = invoice_subtotal,
    tax = invoice_tax_total,
    discount = invoice_discount_total,
    total = invoice_grand_total,
    grandTotal = invoice_grand_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_invoice_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invoice_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_statement_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_statement_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_primary_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
            BEGIN
                -- Update the appUsers primary_role when user_roles changes
                UPDATE "appUsers" 
                SET primary_role = get_user_primary_role(NEW.user_id),
                    last_role_update = NOW()
                WHERE id = NEW.user_id;
                
                RETURN NEW;
            END;
            $$;


ALTER FUNCTION "public"."update_user_primary_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
            DECLARE
                has_permission BOOLEAN := FALSE;
            BEGIN
                SELECT EXISTS(
                    SELECT 1 
                    FROM "user_roles" ur
                    JOIN "role_permissions" rp ON ur.role_id = rp.role_id
                    JOIN "permissions" p ON rp.permission_id = p.id
                    WHERE ur.user_id = user_uuid 
                    AND ur.is_active = true
                    AND p.name = permission_name
                ) INTO has_permission;
                
                RETURN has_permission;
            END;
            $$;


ALTER FUNCTION "public"."user_has_permission"("user_uuid" "uuid", "permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("required_role" "public"."user_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid() OR auth_user_id = auth.uid() LIMIT 1) = required_role, false);
$$;


ALTER FUNCTION "public"."user_has_role"("required_role" "public"."user_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_admin_or_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid() OR auth_user_id = auth.uid() LIMIT 1) IN ('admin', 'staff'), false);
$$;


ALTER FUNCTION "public"."user_is_admin_or_staff"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "private"."user_admin_flags" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "flag" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "private"."user_admin_flags" OWNER TO "postgres";


ALTER TABLE "private"."user_admin_flags" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "private"."user_admin_flags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "private"."user_backups_auth_users" (
    "instance_id" "uuid",
    "id" "uuid",
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text",
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text",
    "phone_change_token" character varying(255),
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "email_change_token_current" character varying(255),
    "email_change_confirm_status" smallint,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255),
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean,
    "backed_up_at" timestamp with time zone
);


ALTER TABLE "private"."user_backups_auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appUsers" (
    "createdAt" "jsonb",
    "name" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "human_id" "text",
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "public"."user_status" DEFAULT 'active'::"public"."user_status",
    "last_role_update" timestamp with time zone DEFAULT "now"(),
    "primary_role" character varying(50)
);


ALTER TABLE "public"."appUsers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."counters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "counter_id" "text" NOT NULL,
    "last" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_account_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "current_balance" numeric(10,2) DEFAULT 0,
    "outstanding_invoices" numeric(10,2) DEFAULT 0,
    "credits_available" numeric(10,2) DEFAULT 0,
    "credit_limit" numeric(10,2) DEFAULT 0,
    "credit_used" numeric(10,2) DEFAULT 0,
    "payment_terms_days" integer DEFAULT 30,
    "last_transaction_date" "date",
    "last_payment_date" "date",
    "last_statement_date" "date",
    "account_status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customer_account_balances_account_status_check" CHECK ((("account_status")::"text" = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_account_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_estimates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estimate_number" character varying(50) NOT NULL,
    "customer_id" "uuid",
    "customer_name" character varying(255) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "specifications" "jsonb",
    "unit_price" numeric(10,2),
    "quantity" integer DEFAULT 1,
    "subtotal" numeric(10,2),
    "tax_amount" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(10,2) NOT NULL,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "responded_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "customer_response" "text",
    "approved_by" character varying(255),
    "converted_to_job_id" "uuid",
    "created_by" "uuid",
    "version" integer DEFAULT 1,
    "is_current_version" boolean DEFAULT true,
    "parent_estimate_id" "uuid",
    CONSTRAINT "customer_estimates_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "customer_estimates_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'viewed'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying, 'converted'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_estimates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_statement_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "statement_number" character varying(50) NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "statement_date" "date" DEFAULT CURRENT_DATE,
    "opening_balance" numeric(10,2) DEFAULT 0,
    "closing_balance" numeric(10,2) DEFAULT 0,
    "current_balance" numeric(10,2) DEFAULT 0,
    "total_charges" numeric(10,2) DEFAULT 0,
    "total_payments" numeric(10,2) DEFAULT 0,
    "total_adjustments" numeric(10,2) DEFAULT 0,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "is_current_period" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid",
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    CONSTRAINT "customer_statement_periods_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'generated'::character varying, 'sent'::character varying, 'viewed'::character varying, 'paid'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_statement_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_statement_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "statement_period_id" "uuid",
    "customer_id" "uuid",
    "transaction_date" "date" NOT NULL,
    "transaction_type" character varying(20) NOT NULL,
    "description" "text" NOT NULL,
    "reference_number" character varying(100),
    "amount" numeric(10,2) NOT NULL,
    "running_balance" numeric(10,2) NOT NULL,
    "job_id" "uuid",
    "invoice_id" "uuid",
    "payment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "customer_statement_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['charge'::character varying, 'payment'::character varying, 'adjustment'::character varying, 'credit'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_statement_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_statements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "statement_number" character varying(20) NOT NULL,
    "customer_id" "uuid",
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "opening_balance" numeric(10,2) DEFAULT 0,
    "closing_balance" numeric(10,2) DEFAULT 0,
    "total_charges" numeric(10,2) DEFAULT 0,
    "total_payments" numeric(10,2) DEFAULT 0,
    "statement_data" "jsonb",
    "generated_by" "uuid",
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_statements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" NOT NULL,
    "human_id" character varying(20),
    "business_name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "customer_status" "text" DEFAULT 'active'::"text",
    "notes" "text",
    "customer_type" "text" DEFAULT 'business'::"text",
    "app_user_id" "text",
    "payment_terms" "text" DEFAULT 'Net 30'::"text",
    "credit_limit" numeric(10,2) DEFAULT 0.00,
    "tax_id" "text",
    "contact_person_id" "uuid",
    CONSTRAINT "chk_customer_status" CHECK (("customer_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text"]))),
    CONSTRAINT "chk_customer_type" CHECK (("customer_type" = ANY (ARRAY['business'::"text", 'individual'::"text"])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" character varying(50) NOT NULL,
    "recipient_email" character varying(255) NOT NULL,
    "recipient_name" character varying(255),
    "subject" character varying(500) NOT NULL,
    "sent_at" timestamp with time zone NOT NULL,
    "resend_id" character varying(100),
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "subject" character varying(500) NOT NULL,
    "content" "text" NOT NULL,
    "type" character varying(50) DEFAULT 'custom'::character varying,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_number" character varying(20) NOT NULL,
    "category" "public"."expense_category" NOT NULL,
    "subcategory" character varying(100),
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "payment_method" "public"."payment_method",
    "reference_number" character varying(100),
    "supplier_vendor" character varying(255),
    "receipt_url" "text",
    "tax_amount" numeric(10,2) DEFAULT 0,
    "approved_by" "uuid",
    "recorded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_type" character varying(50),
    "file_size" integer,
    "file_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "is_primary" boolean DEFAULT false,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_id" "uuid",
    "invoice_id" "uuid",
    "file_name" "text" NOT NULL,
    "original_name" "text",
    "file_size" bigint,
    "file_type" "text",
    "file_url" "text" NOT NULL,
    "storage_path" "text",
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finish_options" (
    "name" "text",
    "category" "text",
    "active" boolean,
    "pricing" "jsonb",
    "createdAt" "jsonb",
    "appliesTo" "jsonb",
    "parameters" "jsonb",
    "updatedAt" "jsonb",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."finish_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_code" character varying(50) NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "unit_of_measure" character varying(20) DEFAULT 'pieces'::character varying,
    "current_stock" integer DEFAULT 0,
    "minimum_stock" integer DEFAULT 10,
    "unit_cost" numeric(10,2),
    "supplier_info" "jsonb",
    "status" "public"."inventory_status" DEFAULT 'in_stock'::"public"."inventory_status",
    "location" character varying(100),
    "last_updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_id" "uuid",
    "movement_type" character varying(20) NOT NULL,
    "quantity" integer NOT NULL,
    "unit_cost" numeric(10,2),
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "notes" "text",
    "moved_by" "uuid",
    "movement_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventory_movements_movement_type_check" CHECK ((("movement_type")::"text" = ANY (ARRAY[('in'::character varying)::"text", ('out'::character varying)::"text", ('adjustment'::character varying)::"text"])))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" bigint NOT NULL,
    "invoice_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "job_id" "text",
    "job_no" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoice_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invoice_items_id_seq" OWNED BY "public"."invoice_items"."id";



CREATE TABLE IF NOT EXISTS "public"."invoice_line_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoice_id" "uuid",
    "service_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(12,2),
    "total_price" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "line_order" integer DEFAULT 1,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "job_id" "uuid"
);


ALTER TABLE "public"."invoice_line_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoice_line_items" IS 'Individual line items for invoices';



CREATE TABLE IF NOT EXISTS "public"."invoice_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid",
    "status_from" character varying(20),
    "status_to" character varying(20) NOT NULL,
    "change_date" timestamp with time zone DEFAULT "now"(),
    "changed_by" "uuid",
    "reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_name" character varying(100) NOT NULL,
    "template_type" character varying(20) DEFAULT 'standard'::character varying,
    "is_default" boolean DEFAULT false,
    "header_html" "text",
    "footer_html" "text",
    "terms_conditions" "text",
    "payment_instructions" "text",
    "primary_color" character varying(7) DEFAULT '#000000'::character varying,
    "secondary_color" character varying(7) DEFAULT '#666666'::character varying,
    "logo_url" "text",
    "font_family" character varying(50) DEFAULT 'Arial'::character varying,
    "show_line_numbers" boolean DEFAULT true,
    "show_tax_breakdown" boolean DEFAULT true,
    "show_payment_terms" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "invoice_templates_template_type_check" CHECK ((("template_type")::"text" = ANY ((ARRAY['standard'::character varying, 'service'::character varying, 'product'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."invoice_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "notes" "text",
    "taxable" numeric,
    "grandTotal" numeric,
    "dueDate" "jsonb",
    "discount" numeric,
    "tax" numeric,
    "customerName" "text",
    "amountDue" numeric,
    "taxRate" numeric,
    "createdAt" "jsonb",
    "total" numeric,
    "amountPaid" numeric,
    "subtotal" numeric,
    "currency" "text",
    "invoiceNo" "text",
    "issueDate" "jsonb",
    "items" "jsonb",
    "status" "text",
    "updatedAt" "jsonb",
    "id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "due_date" "date",
    "invoice_qr" "text",
    "payment_link" "text",
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "invoice_status" character varying(20) DEFAULT 'draft'::character varying,
    "invoice_date" "date" DEFAULT CURRENT_DATE,
    "terms_days" integer DEFAULT 30,
    "discount_percentage" numeric(5,2) DEFAULT 0,
    "late_fee_percentage" numeric(5,2) DEFAULT 0,
    "pdf_generated" boolean DEFAULT false,
    "pdf_url" "text",
    "last_sent_at" timestamp with time zone,
    "last_viewed_at" timestamp with time zone,
    "generated_by" "uuid",
    "template_id" "uuid",
    CONSTRAINT "invoices_invoice_status_check" CHECK ((("invoice_status")::"text" = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'viewed'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "activity_type" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "new_value" "text",
    "notes" "text",
    "performed_by" "uuid",
    "activity_timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_specifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "size_type" character varying(20) DEFAULT 'standard'::character varying,
    "size_preset" character varying(50),
    "custom_width" numeric(8,2),
    "custom_height" numeric(8,2),
    "size_unit" character varying(10) DEFAULT 'mm'::character varying,
    "paper_type" character varying(50),
    "paper_weight" integer,
    "finishing_options" "jsonb",
    "special_instructions" "text",
    "requirements" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_specifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_tracking" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "status_from" "text",
    "status_to" "text" NOT NULL,
    "notes" "text",
    "location" "text",
    "updated_by" "uuid",
    "tracking_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "title" "text",
    "jobNo" "text",
    "description" "text",
    "quantity" integer DEFAULT 1,
    "createdBy" "text",
    "status" "text",
    "invoiced" boolean,
    "submittedDate" "text",
    "customerName" "text",
    "serviceName" "text",
    "invoiceNo" "text",
    "__open" boolean,
    "id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "service_id" "uuid",
    "invoice_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "qr_code" "text",
    "tracking_url" "text",
    "estimated_delivery" "date",
    "actual_delivery" "date",
    "assigned_to" "uuid",
    "job_type" "public"."job_type_enum" DEFAULT 'other'::"public"."job_type_enum",
    "priority" "public"."priority_level" DEFAULT 'normal'::"public"."priority_level",
    "unit_price" numeric(10,2),
    "estimate_price" numeric(10,2),
    "final_price" numeric(10,2) DEFAULT 0,
    "size_type" character varying(20) DEFAULT 'standard'::character varying,
    "size_preset" character varying(50),
    "custom_width" numeric(8,2),
    "custom_height" numeric(8,2),
    "size_unit" character varying(10) DEFAULT 'mm'::character varying,
    "paper_type" character varying(50),
    "paper_weight" integer,
    "finishing_options" "jsonb",
    "special_instructions" "text",
    "requirements" "text",
    CONSTRAINT "jobs_final_price_positive" CHECK (("final_price" >= (0)::numeric)),
    CONSTRAINT "jobs_quantity_positive" CHECK (("quantity" > 0)),
    CONSTRAINT "jobs_unit_price_positive" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs_backup_data" (
    "id" "uuid",
    "estimate" "jsonb",
    "finishIds" "jsonb",
    "finishOptions" "jsonb",
    "finishPrices" "jsonb",
    "delivery" "jsonb",
    "paper" "jsonb",
    "size" "jsonb",
    "specifications" "jsonb",
    "files" "jsonb",
    "lf" "jsonb",
    "createdAt" "jsonb",
    "updatedAt" "jsonb",
    "dueDate" "jsonb"
);


ALTER TABLE "public"."jobs_backup_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "email_notifications" boolean,
    "sms_notifications" boolean,
    "job_status_updates" boolean,
    "delivery_updates" boolean,
    "promotional_messages" boolean,
    "user_id" "uuid",
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'User notification preferences';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid",
    "type" "public"."notification_type" NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "related_entity_type" character varying(50),
    "related_entity_id" "uuid",
    "read_at" timestamp with time zone,
    "email_sent" boolean DEFAULT false,
    "sms_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paper_sizes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "series" character varying(10) NOT NULL,
    "width_mm" numeric(8,2) NOT NULL,
    "height_mm" numeric(8,2) NOT NULL,
    "width_inches" numeric(8,3) NOT NULL,
    "height_inches" numeric(8,3) NOT NULL,
    "category" character varying(20) DEFAULT 'standard'::character varying,
    "description" "text",
    "common_uses" "text"[],
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paper_sizes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paper_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "category" character varying(30) NOT NULL,
    "description" "text",
    "finish" character varying(30),
    "grain_direction" character varying(20),
    "compatible_weights" integer[],
    "common_uses" "text"[],
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paper_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paper_weights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gsm" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "category" character varying(30) NOT NULL,
    "description" "text",
    "common_uses" "text"[],
    "thickness_mm" numeric(6,3),
    "opacity_percent" integer,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paper_weights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid",
    "invoice_id" "uuid",
    "allocated_amount" numeric(10,2) NOT NULL,
    "allocation_date" timestamp with time zone DEFAULT "now"(),
    "allocation_type" character varying(20) DEFAULT 'payment'::character varying,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_allocations_allocation_type_check" CHECK ((("allocation_type")::"text" = ANY ((ARRAY['payment'::character varying, 'credit'::character varying, 'adjustment'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_number" character varying(20) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reference_number" character varying(100),
    "notes" "text",
    "received_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "invoice_no" character varying(50) NOT NULL,
    "customer_human_id" character varying(20) NOT NULL,
    "payment_status" character varying(20) DEFAULT 'completed'::character varying,
    "transaction_id" character varying(100),
    "payment_gateway" character varying(50),
    "customer_id" "uuid",
    "applied_to_invoice_id" "uuid",
    "overpayment_amount" numeric(10,2) DEFAULT 0,
    "refund_amount" numeric(10,2) DEFAULT 0,
    "fees" numeric(10,2) DEFAULT 0,
    CONSTRAINT "payments_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(150) NOT NULL,
    "description" "text",
    "module" character varying(50) NOT NULL,
    "action" character varying(50) NOT NULL,
    "resource" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "createdAt" "jsonb",
    "unit" "text",
    "meta" "jsonb",
    "ruleType" "text",
    "basePrice" numeric,
    "updatedAt" "jsonb",
    "service_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profiles" AS
 SELECT "id",
    "email",
    "name" AS "full_name",
    NULL::"text" AS "avatar_url",
    "created_at",
    "updated_at"
   FROM "public"."appUsers";


ALTER VIEW "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profiles_view" AS
 SELECT "id",
    "email",
    "name" AS "full_name",
    NULL::"text" AS "avatar_url",
    "created_at",
    "updated_at"
   FROM "public"."appUsers";


ALTER VIEW "public"."profiles_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quote_number" "text" NOT NULL,
    "customer_id" "uuid",
    "service_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text",
    "subtotal" numeric(12,2),
    "tax_rate" numeric(5,2) DEFAULT 0.00,
    "tax_amount" numeric(12,2),
    "total_amount" numeric(12,2),
    "valid_until" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "raw_data" "jsonb"
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotes" IS 'Customer quotes and estimates';



CREATE TABLE IF NOT EXISTS "public"."recurring_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_invoice_id" "uuid",
    "customer_id" "uuid",
    "frequency" character varying(20) NOT NULL,
    "interval_count" integer DEFAULT 1,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "next_generation_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "total_generated" integer DEFAULT 0,
    "max_occurrences" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "recurring_invoices_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::"text"[])))
);


ALTER TABLE "public"."recurring_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid",
    "permission_id" "uuid",
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_system_role" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "specSchema" "jsonb",
    "active" boolean,
    "slug" "text",
    "imageUrl" "text",
    "createdAt" "jsonb",
    "options" "jsonb",
    "description" "text",
    "title" "text",
    "updatedAt" "jsonb",
    "sortOrder" numeric,
    "isPopular" boolean,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "logo_url" "text",
    "website" "text",
    "address" "text",
    "phone" "text",
    "company_name" "text",
    "email" "text",
    "heroTitle" "text",
    "heroImageUrl" "text",
    "heroSubtitle" "text",
    "taxRate" numeric,
    "defaultRate" numeric,
    "emailNotifications" boolean,
    "smsNotifications" boolean,
    "appName" "text",
    "primary" "text",
    "background" "text",
    "accent" "text",
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statement_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auto_generate_monthly" boolean DEFAULT true,
    "statement_due_days" integer DEFAULT 30,
    "company_logo_url" "text",
    "company_address" "text",
    "company_phone" character varying(20),
    "company_email" character varying(100),
    "header_text" "text" DEFAULT 'Account Statement'::"text",
    "footer_text" "text" DEFAULT 'Thank you for your business!'::"text",
    "payment_instructions" "text",
    "currency_symbol" character varying(5) DEFAULT '$'::character varying,
    "date_format" character varying(20) DEFAULT 'MM/DD/YYYY'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."statement_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'general'::character varying,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_user_roles" AS
 SELECT "id" AS "user_id",
    "human_id",
    "name",
    "email",
    "primary_role",
    "status",
    "created_at",
    "updated_at"
   FROM "public"."appUsers" "au"
  ORDER BY "primary_role", "name";


ALTER VIEW "public"."unified_user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role_id" "uuid",
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_role_summary" AS
 SELECT "au"."id",
    "au"."human_id",
    "au"."name",
    "au"."email",
    "au"."status",
    "au"."primary_role" AS "primary_role_name",
    "r"."description" AS "primary_role_description",
    "r"."id" AS "primary_role_id",
    "au"."last_role_update",
    "au"."created_at",
    "au"."updated_at",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."user_roles" "ur"
          WHERE ("ur"."user_id" = "au"."id")), (0)::bigint) AS "total_roles",
    COALESCE("array_length"("public"."get_user_permissions"("au"."id"), 1), 0) AS "total_permissions"
   FROM ("public"."appUsers" "au"
     LEFT JOIN "public"."roles" "r" ON ((("au"."primary_role")::"text" = ("r"."name")::"text")));


ALTER VIEW "public"."user_role_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."invoice_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invoice_items_id_seq"'::"regclass");



ALTER TABLE ONLY "private"."user_admin_flags"
    ADD CONSTRAINT "user_admin_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appUsers"
    ADD CONSTRAINT "appUsers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counters"
    ADD CONSTRAINT "counters_counter_id_key" UNIQUE ("counter_id");



ALTER TABLE ONLY "public"."counters"
    ADD CONSTRAINT "counters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_account_balances"
    ADD CONSTRAINT "customer_account_balances_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."customer_account_balances"
    ADD CONSTRAINT "customer_account_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_estimates"
    ADD CONSTRAINT "customer_estimates_estimate_number_key" UNIQUE ("estimate_number");



ALTER TABLE ONLY "public"."customer_estimates"
    ADD CONSTRAINT "customer_estimates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_statement_periods"
    ADD CONSTRAINT "customer_statement_periods_customer_id_period_start_period__key" UNIQUE ("customer_id", "period_start", "period_end");



ALTER TABLE ONLY "public"."customer_statement_periods"
    ADD CONSTRAINT "customer_statement_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_statement_periods"
    ADD CONSTRAINT "customer_statement_periods_statement_number_key" UNIQUE ("statement_number");



ALTER TABLE ONLY "public"."customer_statement_transactions"
    ADD CONSTRAINT "customer_statement_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_statements"
    ADD CONSTRAINT "customer_statements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_statements"
    ADD CONSTRAINT "customer_statements_statement_number_key" UNIQUE ("statement_number");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_human_id_key" UNIQUE ("human_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_notifications"
    ADD CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_expense_number_key" UNIQUE ("expense_number");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_attachments"
    ADD CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finish_options"
    ADD CONSTRAINT "finishOptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_status_history"
    ADD CONSTRAINT "invoice_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoiceno_unique" UNIQUE ("invoiceNo");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_activity_log"
    ADD CONSTRAINT "job_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_specifications"
    ADD CONSTRAINT "job_specifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_tracking"
    ADD CONSTRAINT "job_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paper_sizes"
    ADD CONSTRAINT "paper_sizes_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."paper_sizes"
    ADD CONSTRAINT "paper_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paper_types"
    ADD CONSTRAINT "paper_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."paper_types"
    ADD CONSTRAINT "paper_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paper_weights"
    ADD CONSTRAINT "paper_weights_gsm_key" UNIQUE ("gsm");



ALTER TABLE ONLY "public"."paper_weights"
    ADD CONSTRAINT "paper_weights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_number_key" UNIQUE ("payment_number");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricingRules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statement_settings"
    ADD CONSTRAINT "statement_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



CREATE INDEX "idx_user_admin_flags_user_id" ON "private"."user_admin_flags" USING "btree" ("user_id");



CREATE INDEX "idx_account_balances_customer" ON "public"."customer_account_balances" USING "btree" ("customer_id");



CREATE INDEX "idx_account_balances_status" ON "public"."customer_account_balances" USING "btree" ("account_status");



CREATE INDEX "idx_appusers_human_id" ON "public"."appUsers" USING "btree" ("human_id");



CREATE INDEX "idx_appusers_primary_role_name" ON "public"."appUsers" USING "btree" ("primary_role") WHERE ("primary_role" IS NOT NULL);



CREATE INDEX "idx_appusers_primary_role_status" ON "public"."appUsers" USING "btree" ("primary_role", "status") WHERE (("primary_role" IS NOT NULL) AND ("status" IS NOT NULL));



CREATE INDEX "idx_appusers_status" ON "public"."appUsers" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_counters_counter_id" ON "public"."counters" USING "btree" ("counter_id");



CREATE INDEX "idx_counters_id_last" ON "public"."counters" USING "btree" ("counter_id", "last");



CREATE INDEX "idx_counters_last" ON "public"."counters" USING "btree" ("last");



CREATE INDEX "idx_customer_estimates_created_at" ON "public"."customer_estimates" USING "btree" ("created_at");



CREATE INDEX "idx_customer_estimates_customer_id" ON "public"."customer_estimates" USING "btree" ("customer_id");



CREATE INDEX "idx_customer_estimates_estimate_number" ON "public"."customer_estimates" USING "btree" ("estimate_number");



CREATE INDEX "idx_customer_estimates_status" ON "public"."customer_estimates" USING "btree" ("status");



CREATE INDEX "idx_customers_app_user_id" ON "public"."customers" USING "btree" ("app_user_id");



CREATE INDEX "idx_customers_business_name" ON "public"."customers" USING "btree" ("business_name");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_human_id" ON "public"."customers" USING "btree" ("human_id");



CREATE INDEX "idx_customers_name" ON "public"."customers" USING "btree" ("name");



CREATE INDEX "idx_customers_status" ON "public"."customers" USING "btree" ("customer_status");



CREATE INDEX "idx_email_notifications_recipient" ON "public"."email_notifications" USING "btree" ("recipient_email");



CREATE INDEX "idx_email_notifications_sent_at" ON "public"."email_notifications" USING "btree" ("sent_at");



CREATE INDEX "idx_email_notifications_type" ON "public"."email_notifications" USING "btree" ("type");



CREATE INDEX "idx_email_templates_created_by" ON "public"."email_templates" USING "btree" ("created_by");



CREATE INDEX "idx_email_templates_type" ON "public"."email_templates" USING "btree" ("type");



CREATE INDEX "idx_expenses_category" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "idx_expenses_expense_date" ON "public"."expenses" USING "btree" ("expense_date");



CREATE INDEX "idx_file_attachments_entity" ON "public"."file_attachments" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_file_uploads_invoice_id" ON "public"."file_uploads" USING "btree" ("invoice_id");



CREATE INDEX "idx_file_uploads_job_id" ON "public"."file_uploads" USING "btree" ("job_id");



CREATE INDEX "idx_file_uploads_uploaded_by" ON "public"."file_uploads" USING "btree" ("uploaded_by");



CREATE INDEX "idx_inventory_category" ON "public"."inventory" USING "btree" ("category");



CREATE INDEX "idx_inventory_status" ON "public"."inventory" USING "btree" ("status");



CREATE INDEX "idx_invoice_status_history_date" ON "public"."invoice_status_history" USING "btree" ("change_date");



CREATE INDEX "idx_invoice_status_history_invoice" ON "public"."invoice_status_history" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_customer_id" ON "public"."invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_invoices_customer_status" ON "public"."invoices" USING "btree" ("customer_id", "invoice_status");



CREATE INDEX "idx_invoices_customer_uuid" ON "public"."invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_invoices_date" ON "public"."invoices" USING "btree" ("invoice_date");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_invoice_no" ON "public"."invoices" USING "btree" ("invoiceNo");



CREATE INDEX "idx_invoices_payment_status" ON "public"."invoices" USING "btree" ("payment_status");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_job_activity_job_id" ON "public"."job_activity_log" USING "btree" ("job_id");



CREATE INDEX "idx_job_specifications_job_id" ON "public"."job_specifications" USING "btree" ("job_id");



CREATE INDEX "idx_job_specifications_paper_type" ON "public"."job_specifications" USING "btree" ("paper_type");



CREATE INDEX "idx_job_specifications_paper_weight" ON "public"."job_specifications" USING "btree" ("paper_weight");



CREATE INDEX "idx_job_tracking_job_id" ON "public"."job_tracking" USING "btree" ("job_id");



CREATE INDEX "idx_jobs_assigned_to" ON "public"."jobs" USING "btree" ("assigned_to");



CREATE INDEX "idx_jobs_created_at" ON "public"."jobs" USING "btree" ("created_at");



CREATE INDEX "idx_jobs_customer_id" ON "public"."jobs" USING "btree" ("customer_id");



CREATE INDEX "idx_jobs_customer_uuid" ON "public"."jobs" USING "btree" ("customer_id");



CREATE INDEX "idx_jobs_final_price" ON "public"."jobs" USING "btree" ("final_price");



CREATE INDEX "idx_jobs_invoice_uuid" ON "public"."jobs" USING "btree" ("invoice_id");



CREATE INDEX "idx_jobs_job_no" ON "public"."jobs" USING "btree" ("jobNo");



CREATE INDEX "idx_jobs_job_type" ON "public"."jobs" USING "btree" ("job_type");



CREATE INDEX "idx_jobs_priority" ON "public"."jobs" USING "btree" ("priority");



CREATE INDEX "idx_jobs_quantity" ON "public"."jobs" USING "btree" ("quantity");



CREATE INDEX "idx_jobs_service_uuid" ON "public"."jobs" USING "btree" ("service_id");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_unit_price" ON "public"."jobs" USING "btree" ("unit_price");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read_at");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_paper_sizes_active" ON "public"."paper_sizes" USING "btree" ("active");



CREATE INDEX "idx_paper_sizes_series" ON "public"."paper_sizes" USING "btree" ("series");



CREATE INDEX "idx_paper_types_active" ON "public"."paper_types" USING "btree" ("active");



CREATE INDEX "idx_paper_types_category" ON "public"."paper_types" USING "btree" ("category");



CREATE INDEX "idx_paper_weights_active" ON "public"."paper_weights" USING "btree" ("active");



CREATE INDEX "idx_paper_weights_category" ON "public"."paper_weights" USING "btree" ("category");



CREATE INDEX "idx_payment_allocations_invoice" ON "public"."payment_allocations" USING "btree" ("invoice_id");



CREATE INDEX "idx_payment_allocations_payment" ON "public"."payment_allocations" USING "btree" ("payment_id");



CREATE INDEX "idx_payments_customer" ON "public"."payments" USING "btree" ("customer_id");



CREATE INDEX "idx_payments_customer_human_id" ON "public"."payments" USING "btree" ("customer_human_id");



CREATE INDEX "idx_payments_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE INDEX "idx_payments_invoice" ON "public"."payments" USING "btree" ("applied_to_invoice_id");



CREATE INDEX "idx_payments_invoice_no" ON "public"."payments" USING "btree" ("invoice_no");



CREATE INDEX "idx_payments_payment_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("payment_status");



CREATE INDEX "idx_permissions_action" ON "public"."permissions" USING "btree" ("action");



CREATE INDEX "idx_permissions_module" ON "public"."permissions" USING "btree" ("module");



CREATE INDEX "idx_pricing_rule_type" ON "public"."pricing_rules" USING "btree" ("ruleType");



CREATE INDEX "idx_pricing_service_uuid" ON "public"."pricing_rules" USING "btree" ("service_id");



CREATE INDEX "idx_quotes_customer_id" ON "public"."quotes" USING "btree" ("customer_id");



CREATE INDEX "idx_quotes_quote_number" ON "public"."quotes" USING "btree" ("quote_number");



CREATE INDEX "idx_quotes_service_id" ON "public"."quotes" USING "btree" ("service_id");



CREATE INDEX "idx_quotes_status" ON "public"."quotes" USING "btree" ("status");



CREATE INDEX "idx_quotes_valid_until" ON "public"."quotes" USING "btree" ("valid_until");



CREATE INDEX "idx_recurring_invoices_active" ON "public"."recurring_invoices" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_recurring_invoices_next_date" ON "public"."recurring_invoices" USING "btree" ("next_generation_date");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_services_active" ON "public"."services" USING "btree" ("active");



CREATE INDEX "idx_services_slug" ON "public"."services" USING "btree" ("slug");



CREATE INDEX "idx_statement_periods_current" ON "public"."customer_statement_periods" USING "btree" ("is_current_period") WHERE ("is_current_period" = true);



CREATE INDEX "idx_statement_periods_customer_id" ON "public"."customer_statement_periods" USING "btree" ("customer_id");



CREATE INDEX "idx_statement_periods_date_range" ON "public"."customer_statement_periods" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_statement_periods_status" ON "public"."customer_statement_periods" USING "btree" ("status");



CREATE INDEX "idx_statement_transactions_customer" ON "public"."customer_statement_transactions" USING "btree" ("customer_id");



CREATE INDEX "idx_statement_transactions_date" ON "public"."customer_statement_transactions" USING "btree" ("transaction_date");



CREATE INDEX "idx_statement_transactions_period" ON "public"."customer_statement_transactions" USING "btree" ("statement_period_id");



CREATE INDEX "idx_statement_transactions_type" ON "public"."customer_statement_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_user_roles_active" ON "public"."user_roles" USING "btree" ("is_active");



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."appUsers" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "calculate_transaction_running_balance" BEFORE INSERT OR UPDATE ON "public"."customer_statement_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_running_balance"();



CREATE OR REPLACE TRIGGER "create_statement_transaction_from_invoice_trigger" AFTER INSERT OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."create_statement_transaction_from_invoice"();



CREATE OR REPLACE TRIGGER "create_statement_transaction_from_payment_trigger" AFTER INSERT OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."create_statement_transaction_from_payment"();



CREATE OR REPLACE TRIGGER "track_invoice_status_changes_trigger" AFTER UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."track_invoice_status_changes"();



CREATE OR REPLACE TRIGGER "trigger_job_status_notification" AFTER INSERT OR UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_job_status_change"();



CREATE OR REPLACE TRIGGER "trigger_update_primary_role" AFTER INSERT OR UPDATE OF "is_active" ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_primary_role"();



CREATE OR REPLACE TRIGGER "update_account_balances_updated_at" BEFORE UPDATE ON "public"."customer_account_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customer_estimates_updated_at" BEFORE UPDATE ON "public"."customer_estimates" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_estimates_updated_at"();



CREATE OR REPLACE TRIGGER "update_invoice_payment_status_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."payment_allocations" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_payment_status"();



CREATE OR REPLACE TRIGGER "update_invoice_templates_updated_at" BEFORE UPDATE ON "public"."invoice_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_updated_at"();



CREATE OR REPLACE TRIGGER "update_invoice_totals_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_quotes_updated_at" BEFORE UPDATE ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_recurring_invoices_updated_at" BEFORE UPDATE ON "public"."recurring_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_updated_at"();



CREATE OR REPLACE TRIGGER "update_statement_periods_updated_at" BEFORE UPDATE ON "public"."customer_statement_periods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statement_settings_updated_at" BEFORE UPDATE ON "public"."statement_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statement_transactions_updated_at" BEFORE UPDATE ON "public"."customer_statement_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "private"."user_admin_flags"
    ADD CONSTRAINT "user_admin_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customer_account_balances"
    ADD CONSTRAINT "customer_account_balances_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_estimates"
    ADD CONSTRAINT "customer_estimates_converted_to_job_id_fkey" FOREIGN KEY ("converted_to_job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_estimates"
    ADD CONSTRAINT "customer_estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_estimates"
    ADD CONSTRAINT "customer_estimates_parent_estimate_id_fkey" FOREIGN KEY ("parent_estimate_id") REFERENCES "public"."customer_estimates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_statement_periods"
    ADD CONSTRAINT "customer_statement_periods_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_statement_transactions"
    ADD CONSTRAINT "customer_statement_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_statement_transactions"
    ADD CONSTRAINT "customer_statement_transactions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_statement_transactions"
    ADD CONSTRAINT "customer_statement_transactions_statement_period_id_fkey" FOREIGN KEY ("statement_period_id") REFERENCES "public"."customer_statement_periods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_statements"
    ADD CONSTRAINT "customer_statements_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_statements"
    ADD CONSTRAINT "customer_statements_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_contact_person_id_fkey" FOREIGN KEY ("contact_person_id") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."file_attachments"
    ADD CONSTRAINT "file_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."appUsers"
    ADD CONSTRAINT "fk_appusers_primary_role_name" FOREIGN KEY ("primary_role") REFERENCES "public"."roles"("name") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "fk_invoices_customer_uuid" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "fk_jobs_customer_uuid" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "fk_jobs_invoice_uuid" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "fk_payments_customer_human_id" FOREIGN KEY ("customer_human_id") REFERENCES "public"."customers"("human_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "fk_payments_invoice_no" FOREIGN KEY ("invoice_no") REFERENCES "public"."invoices"("invoiceNo") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoice_status_history"
    ADD CONSTRAINT "invoice_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."invoice_status_history"
    ADD CONSTRAINT "invoice_status_history_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_templates"
    ADD CONSTRAINT "invoice_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."job_activity_log"
    ADD CONSTRAINT "job_activity_log_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_activity_log"
    ADD CONSTRAINT "job_activity_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."job_specifications"
    ADD CONSTRAINT "job_specifications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."appUsers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_allocations"
    ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_applied_to_invoice_id_fkey" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_invoices"
    ADD CONSTRAINT "recurring_invoices_template_invoice_id_fkey" FOREIGN KEY ("template_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."appUsers"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."appUsers"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and staff can update customer records" ON "public"."customers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can update jobs" ON "public"."jobs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all customer records" ON "public"."customers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all customers" ON "public"."customers" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[]))))) OR ("app_user_id" = ("auth"."uid"())::"text")));



CREATE POLICY "Admins and staff can view all invoice items" ON "public"."invoice_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all invoices" ON "public"."invoices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all jobs" ON "public"."jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all notifications" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins and staff can view all payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND ((("appUsers"."primary_role")::"text" = 'admin'::"text") OR (("appUsers"."primary_role")::"text" = 'staff'::"text"))))));



CREATE POLICY "Admins can delete customers" ON "public"."customers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can delete invoices" ON "public"."invoices" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can delete jobs" ON "public"."jobs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can delete payments" ON "public"."payments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage email templates" ON "public"."email_templates" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."role"() = 'authenticated'::"text") AND (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"))));



CREATE POLICY "Allow all operations on invoice_line_items" ON "public"."invoice_line_items" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on invoice_status_history" ON "public"."invoice_status_history" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on invoice_templates" ON "public"."invoice_templates" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on invoices" ON "public"."invoices" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on payment_allocations" ON "public"."payment_allocations" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on payments" ON "public"."payments" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on recurring_invoices" ON "public"."recurring_invoices" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service_role to insert history" ON "public"."invoice_status_history" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert customers" ON "public"."customers" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert estimates" ON "public"."customer_estimates" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert invoice status history" ON "public"."invoice_status_history" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert invoices" ON "public"."invoices" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert jobs" ON "public"."jobs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert payments" ON "public"."payments" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage invoice items" ON "public"."invoice_items" USING (("auth"."role"() = ANY (ARRAY['staff'::"text", 'manager'::"text", 'admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Authenticated users can manage invoices" ON "public"."invoices" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage payments" ON "public"."payments" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can update estimates" ON "public"."customer_estimates" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Customers can update their own jobs" ON "public"."jobs" FOR UPDATE USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "Customers can update their own record" ON "public"."customers" FOR UPDATE USING (("app_user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Service role can access all profiles" ON "public"."appUsers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage all invoice line items" ON "public"."invoice_line_items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage email notifications" ON "public"."email_notifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to customers" ON "public"."customers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to invoice items" ON "public"."invoice_items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to invoices" ON "public"."invoices" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to jobs" ON "public"."jobs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to notifications" ON "public"."notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to payments" ON "public"."payments" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to statement periods" ON "public"."customer_statement_periods" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Staff can create jobs" ON "public"."jobs" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'staff'::character varying, 'manager'::character varying, 'super_admin'::character varying])::"text"[])))))));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((("recipient_id" = "auth"."uid"()) OR ("recipient_id" IS NULL)));



CREATE POLICY "Users can insert statement periods" ON "public"."customer_statement_periods" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[]))))));



CREATE POLICY "Users can manage invoice items for their organization" ON "public"."invoice_items" USING ((EXISTS ( SELECT 1
   FROM "public"."invoices"
  WHERE ("invoices"."id" = "invoice_items"."invoice_id"))));



CREATE POLICY "Users can manage own preferences" ON "public"."notification_preferences" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read jobs" ON "public"."jobs" FOR SELECT USING (true);



CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT USING ((("recipient_id" = "auth"."uid"()) OR ("recipient_id" IS NULL)));



CREATE POLICY "Users can update customers" ON "public"."customers" FOR UPDATE USING ((("app_user_id" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can update invoices" ON "public"."invoices" FOR UPDATE USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can update jobs" ON "public"."jobs" FOR UPDATE USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can update payments" ON "public"."payments" FOR UPDATE USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."appUsers" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view all estimates" ON "public"."customer_estimates" FOR SELECT USING (true);



CREATE POLICY "Users can view and update their own statement periods" ON "public"."customer_statement_periods" USING (((("customer_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can view invoice items" ON "public"."invoice_items" FOR SELECT USING (true);



CREATE POLICY "Users can view invoice items for their organization" ON "public"."invoice_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices"
  WHERE ("invoices"."id" = "invoice_items"."invoice_id"))));



CREATE POLICY "Users can view invoice line items based on appUsers role" ON "public"."invoice_line_items" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."appUsers" "au"
  WHERE (("au"."id" = "auth"."uid"()) AND (("au"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))) OR (EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND ("i"."generated_by" = "auth"."uid"()))))));



CREATE POLICY "Users can view invoices" ON "public"."invoices" FOR SELECT USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can view jobs" ON "public"."jobs" FOR SELECT USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can view payments" ON "public"."payments" FOR SELECT USING ((("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."app_user_id" = ("auth"."uid"())::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))))));



CREATE POLICY "Users can view their own customer record" ON "public"."customers" FOR SELECT USING (("app_user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their own email notifications" ON "public"."email_notifications" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("recipient_email")::"text" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text")));



CREATE POLICY "Users can view their own invoice items" ON "public"."invoice_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices"
  WHERE (("invoices"."id" = "invoice_items"."invoice_id") AND ("invoices"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own invoices" ON "public"."invoices" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own jobs" ON "public"."jobs" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."appUsers" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "admin_full_access_finish_options" ON "public"."finish_options" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "admin_full_access_inventory" ON "public"."inventory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "admin_full_access_paper_specs" ON "public"."paper_sizes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "admin_full_access_paper_types" ON "public"."paper_types" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "admin_full_access_paper_weights" ON "public"."paper_weights" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."appUsers"
  WHERE (("appUsers"."id" = "auth"."uid"()) AND (("appUsers"."primary_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



ALTER TABLE "public"."appUsers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auth_users_manage_job_specifications" ON "public"."job_specifications" TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_finish_options" ON "public"."finish_options" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_inventory" ON "public"."inventory" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_job_specifications" ON "public"."job_specifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_paper_sizes" ON "public"."paper_sizes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_paper_types" ON "public"."paper_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_paper_weights" ON "public"."paper_weights" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_permissions" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_users_select_user_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_access_file_attachments" ON "public"."file_attachments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_read_invoices" ON "public"."invoices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_write_invoices" ON "public"."invoices" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_write_payments" ON "public"."payments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "counters_service_role_bypass" ON "public"."counters" USING (true) WITH CHECK (true);



ALTER TABLE "public"."customer_estimates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_statement_periods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_service_role_bypass" ON "public"."customers" USING (true) WITH CHECK (true);



ALTER TABLE "public"."email_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "file_attachments_authenticated_users" ON "public"."file_attachments" USING (true);



ALTER TABLE "public"."finish_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_specifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_service_role_bypass" ON "public"."notifications" USING (true) WITH CHECK (true);



ALTER TABLE "public"."paper_sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paper_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paper_weights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_bypass_account_balances" ON "public"."customer_account_balances" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_appusers" ON "public"."appUsers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_customers" ON "public"."customers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_invoices" ON "public"."invoices" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_jobs" ON "public"."jobs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_notification_preferences" ON "public"."notification_preferences" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_notifications" ON "public"."notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_payments" ON "public"."payments" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_preferences" ON "public"."notification_preferences" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_statement_periods" ON "public"."customer_statement_periods" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_statement_settings" ON "public"."statement_settings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_statement_transactions" ON "public"."customer_statement_transactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "services_service_role_bypass" ON "public"."services" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_read_own_record" ON "public"."appUsers" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "users_update_own_record" ON "public"."appUsers" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."counters";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."jobs";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "anon";









SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;













































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;








































































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;




































GRANT ALL ON FUNCTION "public"."get_next_counter"("counter_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_counter"("counter_name" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_profile_by_email"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_by_id"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_profile_to_auth"("auth_user_id" "uuid", "profile_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_invoice_status_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."track_invoice_status_changes"() TO "authenticated";


















GRANT SELECT ON TABLE "public"."appUsers" TO "anon";
GRANT ALL ON TABLE "public"."appUsers" TO "authenticated";
GRANT ALL ON TABLE "public"."appUsers" TO "service_role";



GRANT ALL ON TABLE "public"."customer_account_balances" TO "authenticated";



GRANT ALL ON TABLE "public"."customer_statement_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_statement_periods" TO "service_role";



GRANT ALL ON TABLE "public"."customer_statement_transactions" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT SELECT,INSERT ON TABLE "public"."file_attachments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."file_attachments" TO "authenticated";



GRANT SELECT ON TABLE "public"."inventory" TO "anon";
GRANT SELECT ON TABLE "public"."inventory" TO "authenticated";



GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invoice_items" TO "authenticated";



GRANT SELECT ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT SELECT,INSERT ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT SELECT ON TABLE "public"."paper_sizes" TO "anon";
GRANT SELECT ON TABLE "public"."paper_sizes" TO "authenticated";



GRANT SELECT ON TABLE "public"."paper_types" TO "anon";
GRANT SELECT ON TABLE "public"."paper_types" TO "authenticated";



GRANT SELECT ON TABLE "public"."paper_weights" TO "anon";
GRANT SELECT ON TABLE "public"."paper_weights" TO "authenticated";



GRANT SELECT ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT SELECT ON TABLE "public"."permissions" TO "anon";
GRANT SELECT ON TABLE "public"."permissions" TO "authenticated";



GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";



GRANT SELECT ON TABLE "public"."roles" TO "anon";
GRANT SELECT ON TABLE "public"."roles" TO "authenticated";



GRANT SELECT ON TABLE "public"."services" TO "anon";
GRANT SELECT ON TABLE "public"."services" TO "authenticated";



GRANT ALL ON TABLE "public"."statement_settings" TO "authenticated";


































RESET ALL;

  create policy "authenticated_users_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_users_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_users_upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_users_view"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (true);



