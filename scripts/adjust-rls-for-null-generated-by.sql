-- Adjust RLS policies to account for NULL generated_by values in invoices table

-- 1. Check how many invoices have NULL generated_by vs non-NULL
SELECT 
    COUNT(*) as total_invoices,
    COUNT(generated_by) as invoices_with_generated_by,
    COUNT(*) - COUNT(generated_by) as invoices_without_generated_by,
    ROUND((COUNT(*) - COUNT(generated_by)) * 100.0 / COUNT(*), 2) as percentage_null
FROM invoices;

-- 2. Check if customer_id is always populated
SELECT 
    COUNT(*) as total_invoices,
    COUNT(customer_id) as invoices_with_customer_id,
    COUNT(*) - COUNT(customer_id) as invoices_without_customer_id
FROM invoices;

-- 3. Check the relationship between appUsers and customers
-- See if customer_id in invoices links to appUsers
SELECT 
    COUNT(*) as total_invoices,
    COUNT(au.id) as invoices_with_matching_appuser
FROM invoices i
LEFT JOIN appUsers au ON i.customer_id = au.id;

-- 4. Test our current RLS policy logic with NULL generated_by
-- This simulates what happens with our "Users can view their own invoice items" policy
SELECT 
    ii.id,
    ii.invoice_id,
    i.customer_id,
    i.generated_by,
    -- Check if our policy conditions work with NULL generated_by
    (i.generated_by = 'c2f79ec2-4153-4164-9abc-dca719faae8f') as matches_generated_by,
    (i.customer_id = 'c2f79ec2-4153-4164-9abc-dca719faae8f') as matches_customer_id,
    -- Our policy should work with customer_id when generated_by is NULL
    (i.generated_by = 'c2f79ec2-4153-4164-9abc-dca719faae8f' OR 
     i.customer_id = 'c2f79ec2-4153-4164-9abc-dca719faae8f') as policy_condition
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE ii.invoice_id = 'a0afea9e-8d7b-4a2e-afe0-1e104805a11d'
LIMIT 5;

-- 5. Check if we need to adjust our policies to rely more on customer_id
SELECT 
    'Policy Adjustment Needed' as recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM invoices WHERE generated_by IS NULL) > 
             (SELECT COUNT(*) * 0.5 FROM invoices)
        THEN 'YES - Most invoices have NULL generated_by, rely on customer_id'
        ELSE 'NO - generated_by is mostly populated'
    END as should_rely_on_customer_id;