-- Consolidate job cost columns migration
-- This will streamline the jobs table by:
-- 1. Adding unit_price and final_price columns
-- 2. Migrating data from existing cost columns
-- 3. Dropping redundant JSON and complex columns
-- 4. Ensuring quantity column exists

BEGIN;

-- Step 1: Add new simplified cost columns
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT 0;

-- Step 2: Ensure quantity column exists and has proper type
-- (It already exists as number | null, this ensures it's not null with default)
ALTER TABLE jobs 
ALTER COLUMN quantity SET DEFAULT 1,
ALTER COLUMN quantity TYPE INTEGER USING COALESCE(quantity, 1);

-- Step 3: Migrate existing cost data to new columns
-- Migrate estimated_cost to unit_price
UPDATE jobs 
SET unit_price = COALESCE(estimated_cost, 0)
WHERE unit_price = 0 AND estimated_cost IS NOT NULL;

-- Migrate final_cost to final_price
UPDATE jobs 
SET final_price = COALESCE(final_cost, 0)
WHERE final_price = 0 AND final_cost IS NOT NULL;

-- For jobs that have final_cost but no unit_price, use final_cost / quantity as unit_price
UPDATE jobs 
SET unit_price = CASE 
    WHEN quantity > 0 THEN final_cost / quantity 
    ELSE final_cost 
END
WHERE unit_price = 0 
  AND final_cost IS NOT NULL 
  AND final_cost > 0;

-- Step 4: Update final_price based on unit_price * quantity where final_price is 0
UPDATE jobs 
SET final_price = unit_price * COALESCE(quantity, 1)
WHERE final_price = 0 
  AND unit_price > 0;

-- Step 5: Drop redundant columns (after backing up important data)
-- First, let's preserve any important data from JSON columns in a backup table
CREATE TABLE IF NOT EXISTS jobs_backup_data AS
SELECT 
    id,
    estimate,
    "finishIds",
    "finishOptions", 
    "finishPrices",
    delivery,
    paper,
    size,
    specifications,
    files,
    lf,
    "createdAt",
    "updatedAt",
    "dueDate"
FROM jobs 
WHERE estimate IS NOT NULL 
   OR "finishIds" IS NOT NULL 
   OR "finishOptions" IS NOT NULL 
   OR "finishPrices" IS NOT NULL 
   OR delivery IS NOT NULL 
   OR paper IS NOT NULL 
   OR size IS NOT NULL 
   OR specifications IS NOT NULL 
   OR files IS NOT NULL 
   OR lf IS NOT NULL;

-- Now drop the redundant columns
ALTER TABLE jobs 
DROP COLUMN IF EXISTS estimated_cost,
DROP COLUMN IF EXISTS final_cost,
DROP COLUMN IF EXISTS estimate,
DROP COLUMN IF EXISTS "finishIds",
DROP COLUMN IF EXISTS "finishOptions",
DROP COLUMN IF EXISTS "finishPrices",
DROP COLUMN IF EXISTS delivery,
DROP COLUMN IF EXISTS paper,
DROP COLUMN IF EXISTS size,
DROP COLUMN IF EXISTS specifications,
DROP COLUMN IF EXISTS files,
DROP COLUMN IF EXISTS lf,
DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "dueDate";

-- Step 6: Add constraints and indexes for performance
ALTER TABLE jobs 
ADD CONSTRAINT jobs_unit_price_positive CHECK (unit_price >= 0),
ADD CONSTRAINT jobs_final_price_positive CHECK (final_price >= 0),
ADD CONSTRAINT jobs_quantity_positive CHECK (quantity > 0);

-- Add indexes for better performance on cost queries
CREATE INDEX IF NOT EXISTS idx_jobs_unit_price ON jobs(unit_price);
CREATE INDEX IF NOT EXISTS idx_jobs_final_price ON jobs(final_price);
CREATE INDEX IF NOT EXISTS idx_jobs_quantity ON jobs(quantity);

-- Step 7: Update any views or triggers that might reference old columns
-- (Note: This would need to be customized based on actual views/triggers in the system)

COMMIT;

-- Verification queries (run these after the migration)
-- SELECT COUNT(*) as total_jobs, 
--        COUNT(CASE WHEN unit_price > 0 THEN 1 END) as jobs_with_unit_price,
--        COUNT(CASE WHEN final_price > 0 THEN 1 END) as jobs_with_final_price,
--        AVG(unit_price) as avg_unit_price,
--        AVG(final_price) as avg_final_price
-- FROM jobs;

-- SELECT id, title, quantity, unit_price, final_price 
-- FROM jobs 
-- WHERE unit_price > 0 OR final_price > 0 
-- ORDER BY created_at DESC 
-- LIMIT 10;