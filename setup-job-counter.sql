-- Create job counter functionality for sequential job numbers
-- Run this in your Supabase SQL Editor

-- 1. Create or update the job counter entry
INSERT INTO counters (counter_id, last, created_at, updated_at) 
VALUES ('job', 0, NOW(), NOW()) 
ON CONFLICT (counter_id) 
DO UPDATE SET updated_at = NOW();

-- 2. Create get_next_counter function for atomic counter increments
CREATE OR REPLACE FUNCTION get_next_counter(counter_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_next_counter(text) TO anon, authenticated;

-- 4. Test the function (optional - can be removed after testing)
SELECT get_next_counter('job') as next_job_number;

-- 5. Check current state
SELECT * FROM counters WHERE counter_id = 'job';

-- This will generate job numbers like: JKDP-JOB-0001, JKDP-JOB-0002, etc.