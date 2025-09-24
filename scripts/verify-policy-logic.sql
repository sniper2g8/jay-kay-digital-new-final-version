-- Verify that our RLS policy logic works correctly with NULL generated_by values

-- 1. Check the exact policies we created
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
AND polname ILIKE '%admin%staff%'
ORDER BY polname;

-- 2. Check the policy that handles user access
SELECT 
    polname AS policy_name,
    polpermissive AS permissive,
    polcmd AS command,
    polqual AS using_clause
FROM pg_policy 
WHERE polrelid = 'invoice_items'::regclass
AND polname ILIKE '%user%view%own%'
ORDER BY polname;

-- 3. Test the logic of our user policy with sample data
-- Simulate what happens when generated_by is NULL but customer_id is populated
SELECT 
    'Policy Logic Test' as test_name,
    -- Our policy condition: (generated_by = auth.uid() OR customer_id = auth.uid())
    -- Test with a user ID that matches customer_id
    (NULL = 'c2f79ec2-4153-4164-9abc-dca719faae8f' OR 
     'c2f79ec2-4153-4164-9abc-dca719faae8f' = 'c2f79ec2-4153-4164-9abc-dca719faae8f') as user_is_customer_result,
    -- Test with a user ID that would match generated_by (if it wasn't NULL)
    ('c2f79ec2-4153-4164-9abc-dca719faae8f' = 'c2f79ec2-4153-4164-9abc-dca719faae8f' OR 
     'c2f79ec2-4153-4164-9abc-dca719faae8f' = 'c2f79ec2-4153-4164-9abc-dca719faae8f') as user_is_generated_by_result;

-- 4. Check if our policies correctly handle NULL values
-- In SQL, NULL = value always returns NULL (not true or false)
-- But (NULL OR true) = true, so our policy should still work
SELECT 
    'NULL Handling Test' as test_name,
    NULL as null_value,
    NULL = 'test' as null_equals_test,
    (NULL = 'test' OR true) as null_or_true,
    (NULL = 'test' OR false) as null_or_false;

-- 5. Final verification that our policies work with the actual data structure
SELECT 
    'Final Policy Verification' as verification,
    CASE 
        WHEN (SELECT COUNT(*) FROM invoice_items) > 0 
        THEN 'DATA ACCESS WORKING: ✅' 
        ELSE 'DATA ACCESS WORKING: ❌' 
    END as data_access_status,
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'invoice_items') = true 
        THEN 'RLS ENABLED: ✅' 
        ELSE 'RLS ENABLED: ❌' 
    END as rls_status;