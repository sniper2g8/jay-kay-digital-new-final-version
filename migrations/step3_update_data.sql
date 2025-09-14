-- Step 3: Update existing data
-- Execute this after steps 1 and 2 complete successfully

-- Update existing customers with default business names based on their current name
UPDATE customers 
SET business_name = COALESCE(name, 'Customer ' || human_id)
WHERE business_name IS NULL;

-- Make business_name required after populating it
ALTER TABLE customers ALTER COLUMN business_name SET NOT NULL;
