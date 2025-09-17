const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJobCounter() {
  console.log("🔍 Testing job counter functionality...");

  try {
    // Test if get_next_counter function exists and works
    console.log("⚡ Testing get_next_counter function...");

    const { data: nextJobNumber, error: counterError } = await supabase.rpc(
      "get_next_counter",
      { counter_name: "job" },
    );

    if (counterError) {
      console.error("❌ Error calling get_next_counter:", counterError);
      console.log("");
      console.log("🔧 SOLUTION: Run this SQL in your Supabase dashboard:");
      console.log(`
-- Create or update the job counter
INSERT INTO counters (counter_id, last) 
VALUES ('job', 0) 
ON CONFLICT (counter_id) 
DO UPDATE SET last = EXCLUDED.last;

-- Create get_next_counter function if it doesn't exist
CREATE OR REPLACE FUNCTION get_next_counter(counter_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_value integer;
BEGIN
    UPDATE counters 
    SET last = last + 1, updated_at = NOW()
    WHERE counter_id = counter_name
    RETURNING last INTO next_value;
    
    IF next_value IS NULL THEN
        INSERT INTO counters (counter_id, last, created_at, updated_at)
        VALUES (counter_name, 1, NOW(), NOW())
        RETURNING last INTO next_value;
    END IF;
    
    RETURN next_value;
END;
$$;
      `);
      return;
    }

    console.log("✅ get_next_counter function works!");
    console.log("📝 Next job number would be:", nextJobNumber);

    // Generate a sample job number
    const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
    console.log("🎯 Generated job number:", jobNumber);

    // Check current counter state
    const { data: counterState, error: stateError } = await supabase
      .from("counters")
      .select("*")
      .eq("counter_id", "job")
      .single();

    if (stateError) {
      console.warn("⚠️  Could not check counter state:", stateError);
    } else {
      console.log("📊 Current counter state:", counterState);
    }

    console.log("🎉 Job counter test completed successfully!");
  } catch (error) {
    console.error("❌ Job counter test failed:", error);
  }
}

testJobCounter();
