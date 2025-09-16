-- Table Relationship Strategy for appUsers, profiles, and customers
-- This defines the proper structure and relationships

/*
PROBLEM ANALYSIS:
- appUsers contains mixed roles: staff/admins AND customers  
- profiles table exists for Supabase auth compatibility
- customers table should be for business entities (companies)
- Current confusion between "customer users" vs "customer businesses"

PROPOSED SOLUTION:
*/

-- ====================================================================
-- STRATEGY 1: Three-Table Approach (Recommended)
-- ====================================================================

/*
1. APPUSERS TABLE (User Accounts)
   Purpose: All user accounts that can log into the system
   Contains: Staff, admins, and customer account users
   Roles: super_admin, admin, manager, staff, customer
   Key: These are PEOPLE who have login credentials

2. PROFILES TABLE (Auth Compatibility) 
   Purpose: Supabase auth compatibility layer
   Contains: Minimal user data for auth system
   Source: View or sync with appUsers
   Key: Required for Supabase auth to work properly

3. CUSTOMERS TABLE (Business Entities)
   Purpose: Business customers who place orders
   Contains: Companies, organizations, business contacts
   Relationship: customers.contact_person_id -> appUsers.id (optional)
   Key: These are BUSINESSES that order printing services
*/

-- Current appUsers roles breakdown:
SELECT 'Current appUsers role distribution:' as analysis;
SELECT 
  primary_role,
  COUNT(*) as count,
  string_agg(name, ', ') as users
FROM public."appUsers" 
GROUP BY primary_role
ORDER BY count DESC;

-- ====================================================================
-- RECOMMENDED STRUCTURE:
-- ====================================================================

/*
APPUSERS (User Accounts):
- Keep current structure
- These are people who can log in
- Includes staff AND customer account users
- primary_role determines permissions

PROFILES (Auth Layer):
- Make this a VIEW of appUsers 
- Only contains what Supabase auth needs
- Automatically syncs with appUsers changes

CUSTOMERS (Business Entities):
- Separate table for businesses/companies
- NOT for individual user accounts
- Links to appUsers via contact_person_id
- Stores company info: business_name, address, etc.

RELATIONSHIPS:
- auth.users.id = appUsers.id (1:1)
- appUsers.id = profiles.id (1:1 view)
- customers.contact_person_id = appUsers.id (optional many:1)
*/

-- Check what's currently in customers that might be user accounts
SELECT 'Customers table analysis:' as analysis;
SELECT 
  id,
  human_id,
  business_name,
  contact_person,
  email,
  created_at
FROM public.customers 
LIMIT 5;

-- Look for potential conflicts
SELECT 'Potential user/customer conflicts:' as analysis;
SELECT 
  c.business_name,
  c.email as customer_email,
  u.email as user_email,
  u.name as user_name,
  u.primary_role
FROM public.customers c
LEFT JOIN public."appUsers" u ON c.email = u.email
WHERE c.email IS NOT NULL;