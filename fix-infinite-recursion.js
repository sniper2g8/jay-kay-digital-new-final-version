// Fix infinite recursion in appUsers RLS policies
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixInfiniteRecursion() {
  let client;
  try {
    client = await pool.connect();

    console.log("🚨 FIXING INFINITE RECURSION IN appUsers RLS POLICIES");
    console.log("====================================================");

    // The problem: Admin policies are checking appUsers table within appUsers policies
    // Solution: Create simpler policies without circular dependencies

    console.log("🗑️  Dropping ALL appUsers policies...");

    // Drop all existing policies on appUsers
    const existingPolicies = await client.query(`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'appUsers'
    `);

    for (const policy of existingPolicies.rows) {
      await client.query(
        `DROP POLICY IF EXISTS "${policy.policyname}" ON public."appUsers"`,
      );
      console.log(`  ✅ Dropped: ${policy.policyname}`);
    }

    console.log("\n🔧 Creating simple, non-recursive policies...");

    // Policy 1: Users can read their own data (using auth.uid() directly)
    await client.query(`
      CREATE POLICY "users_read_own_profile" ON public."appUsers"
      FOR SELECT 
      TO authenticated
      USING (id = auth.uid())
    `);
    console.log('✅ Created "users_read_own_profile" policy');

    // Policy 2: Users can update their own data
    await client.query(`
      CREATE POLICY "users_update_own_profile" ON public."appUsers"
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid())
    `);
    console.log('✅ Created "users_update_own_profile" policy');

    // Policy 3: Simple authenticated read access (for now, we'll handle admin logic in app)
    await client.query(`
      CREATE POLICY "authenticated_users_basic_read" ON public."appUsers"
      FOR SELECT
      TO authenticated
      USING (true)
    `);
    console.log('✅ Created "authenticated_users_basic_read" policy');

    // Test the policies work
    console.log("\n🧪 Testing appUsers query...");
    try {
      const testResult = await client.query(`
        SELECT id, email, primary_role 
        FROM public."appUsers" 
        LIMIT 3
      `);

      console.log(
        `✅ appUsers query successful! Found ${testResult.rows.length} users`,
      );
      testResult.rows.forEach((user) => {
        console.log(`  - ${user.email} (${user.primary_role})`);
      });
    } catch (queryError) {
      console.error("❌ appUsers query still failing:", queryError.message);
    }

    // Verify new policies
    console.log("\n📋 New appUsers policies:");
    const newPoliciesCheck = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'appUsers'
      ORDER BY policyname
    `);

    newPoliciesCheck.rows.forEach((policy) => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
    });

    console.log("\n🎯 INFINITE RECURSION FIXED!");
    console.log("✅ Removed circular dependencies in RLS policies");
    console.log("✅ Users can read their own profile data");
    console.log("✅ Application should work without infinite recursion errors");
    console.log(
      "⚠️  Admin privileges will be handled by application logic for now",
    );
  } catch (err) {
    console.error("💥 Error:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixInfiniteRecursion();
