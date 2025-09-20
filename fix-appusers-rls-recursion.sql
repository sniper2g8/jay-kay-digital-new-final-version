-- Fix infinite recursion in appUsers RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_view_all_users" ON "appUsers";

-- Keep the simple policy for users viewing their own record
-- Users can view their own record
CREATE POLICY "users_view_own_record" 
ON "appUsers" 
FOR SELECT 
USING (id = auth.uid());

-- For now, let's remove the admin policy that was causing recursion
-- We can add a simpler admin policy later if needed
-- The service role bypass policy will still allow server-side access

-- Ensure service role can still access all users
ALTER POLICY "service_role_bypass_appusers" ON "appUsers" 
USING (true) 
WITH CHECK (true);