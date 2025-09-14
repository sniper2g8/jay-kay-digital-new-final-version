-- Add sample data to test the new customer schema
-- Execute this in Supabase SQL Editor to populate some test data

-- Update existing customers with sample data
UPDATE customers 
SET 
  contact_person = 'John Smith',
  email = 'john@company1.com',
  phone = '(555) 123-4567',
  address = '123 Main St',
  city = 'Anytown',
  state = 'CA',
  zip_code = '12345',
  customer_status = 'active',
  customer_type = 'business',
  notes = 'Regular customer, good payment history'
WHERE name = 'Customer 1' OR business_name LIKE '%Customer 1%'
LIMIT 1;

-- Add a completely new test customer
INSERT INTO customers (
  id,
  human_id,
  name,
  business_name,
  contact_person,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  customer_status,
  customer_type,
  payment_terms,
  credit_limit,
  notes
) VALUES (
  gen_random_uuid(),
  'CUST-' || LPAD((COALESCE((SELECT MAX(CAST(SUBSTRING(human_id FROM 6) AS INTEGER)) FROM customers WHERE human_id LIKE 'CUST-%'), 0) + 1)::TEXT, 4, '0'),
  'Acme Corporation',
  'Acme Corporation',
  'Jane Doe',
  'jane.doe@acmecorp.com',
  '(555) 987-6543',
  '456 Business Blvd',
  'Commerce City',
  'NY',
  '54321',
  'active',
  'business',
  'Net 30',
  5000.00,
  'Large volume customer, handles corporate printing'
);

-- Add another test customer (individual)
INSERT INTO customers (
  id,
  human_id,
  name,
  business_name,
  contact_person,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  customer_status,
  customer_type,
  payment_terms,
  credit_limit,
  notes
) VALUES (
  gen_random_uuid(),
  'CUST-' || LPAD((COALESCE((SELECT MAX(CAST(SUBSTRING(human_id FROM 6) AS INTEGER)) FROM customers WHERE human_id LIKE 'CUST-%'), 0) + 1)::TEXT, 4, '0'),
  'Mike Johnson',
  'Mike Johnson Photography',
  'Mike Johnson',
  'mike@mjphoto.com',
  '(555) 555-1234',
  '789 Creative Ave',
  'Art District',
  'TX',
  '67890',
  'active',
  'individual',
  'Net 15',
  1000.00,
  'Professional photographer, frequent small orders'
);
