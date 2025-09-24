-- Test that our RLS policies are working correctly for different user types

-- 1. Check what roles exist in the appUsers table
SELECT 
    primary_role,
    COUNT(*) as user_count
FROM appUsers
GROUP BY primary_role
ORDER BY user_count DESC;

-- 2. Check sample appUsers with different roles
SELECT 
    id,
    email,
    primary_role
FROM appUsers
WHERE primary_role IN ('admin', 'super_admin', 'manager', 'staff')
LIMIT 10;

-- 3. Check if there are any appUsers that match the customer_id from our sample
SELECT 
    id,
    email,
    primary_role
FROM appUsers
WHERE id = 'c2f79ec2-4153-4164-9abc-dca719faae8f';

-- 4. Test a query that should work with our RLS policies
-- This simulates what would happen with an admin user
SELECT 
    ii.id,
    ii.description,
    ii.quantity,
    ii.unit_price,
    i.invoiceNo,
    i.customer_id
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE EXISTS (
    SELECT 1 
    FROM appUsers 
    WHERE id = 'c2f79ec2-4153-4164-9abc-dca719faae8f' 
    AND primary_role IN ('admin', 'super_admin', 'manager', 'staff')
)
LIMIT 5;

-- 5. Check if service_role can access all data
SELECT 
    COUNT(*) as total_invoice_items
FROM invoice_items;