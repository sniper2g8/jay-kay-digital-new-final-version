// Setup RBAC system: Create roles and set up user auto-assignment
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function setupRBACSystem() {
  console.log("🎭 Setting up RBAC system...");

  try {
    // Step 1: Create default roles
    console.log("\n1. Creating default roles...");

    const defaultRoles = [
      {
        id: "customer",
        name: "Customer",
        description: "Regular customer with limited access to own data",
        permissions: JSON.stringify([
          "jobs.create",
          "jobs.read.own",
          "customers.read.own",
          "invoices.read.own",
        ]),
      },
      {
        id: "staff",
        name: "Staff",
        description: "Staff member with operational access",
        permissions: JSON.stringify([
          "jobs.read",
          "jobs.update",
          "customers.read",
          "inventory.read",
        ]),
      },
      {
        id: "manager",
        name: "Manager",
        description: "Manager with extended access",
        permissions: JSON.stringify([
          "jobs.create",
          "jobs.read",
          "jobs.update",
          "customers.read",
          "customers.update",
          "inventory.read",
          "inventory.update",
          "reports.operational",
        ]),
      },
      {
        id: "admin",
        name: "Admin",
        description: "Administrator with full operational access",
        permissions: JSON.stringify([
          "jobs.*",
          "customers.*",
          "invoices.*",
          "payments.*",
          "inventory.*",
          "reports.*",
        ]),
      },
      {
        id: "super_admin",
        name: "Super Admin",
        description: "Super administrator with system access",
        permissions: JSON.stringify(["*"]),
      },
    ];

    for (const role of defaultRoles) {
      const { data, error } = await supabase
        .from("roles")
        .upsert(role, { onConflict: "id" });

      if (error) {
        console.error(`❌ Error creating role ${role.id}:`, error.message);
      } else {
        console.log(`✅ Role created/updated: ${role.id} - ${role.name}`);
      }
    }

    // Step 2: Check if roles were created
    console.log("\n2. Verifying roles creation...");
    const { data: rolesVerify, error: rolesVerifyError } = await supabase
      .from("roles")
      .select("*")
      .order("id");

    if (rolesVerifyError) {
      console.error("❌ Error verifying roles:", rolesVerifyError.message);
    } else {
      console.log(`✅ Total roles in database: ${rolesVerify.length}`);
      rolesVerify.forEach((role) => {
        console.log(`   - ${role.id}: ${role.name}`);
      });
    }

    // Step 3: Add our test user to appUsers table with customer role
    console.log("\n3. Setting up test user in appUsers...");

    // First, get the auth user ID for our test user
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: "testuser@confirmed.com",
        password: "TestPassword123!",
      });

    if (signInError) {
      console.error("❌ Cannot sign in test user:", signInError.message);
    } else {
      console.log("✅ Test user signed in:", signInData.user.email);

      // Add to appUsers table
      const appUserRecord = {
        id: signInData.user.id,
        email: signInData.user.email,
        name: signInData.user.user_metadata?.full_name || "Test User",
        primary_role: "customer", // Default role
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: appUserData, error: appUserError } = await supabase
        .from("appUsers")
        .upsert(appUserRecord, { onConflict: "id" });

      if (appUserError) {
        console.error(
          "❌ Error creating appUser record:",
          appUserError.message,
        );
      } else {
        console.log("✅ Test user added to appUsers with customer role");
      }

      // Sign out after setup
      await supabase.auth.signOut();
    }

    // Step 4: Verify appUsers setup
    console.log("\n4. Verifying appUsers setup...");
    const { data: appUsersVerify, error: appUsersError } = await supabase
      .from("appUsers")
      .select("*");

    if (appUsersError) {
      console.error("❌ Error verifying appUsers:", appUsersError.message);
    } else {
      console.log(`✅ Total users in appUsers: ${appUsersVerify.length}`);
      appUsersVerify.forEach((user) => {
        console.log(
          `   - ${user.email}: ${user.primary_role} (${user.status})`,
        );
      });
    }

    console.log("\n🎉 RBAC system setup complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Log in with: testuser@confirmed.com / TestPassword123!");
    console.log('2. User will have "customer" role by default');
    console.log("3. Implement dashboard routing based on roles");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

setupRBACSystem();
