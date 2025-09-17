// Diagnostic script for password recovery issues
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function diagnosePwdRecovery() {
  try {
    console.log("🔍 Diagnosing Password Recovery Issues...");
    console.log("===============================================");

    // Check 1: Environment variables
    console.log("1️⃣ Environment Variables Check:");
    console.log(
      "   SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
    );
    console.log(
      "   ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
    );
    console.log("   URL Domain:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Check 2: Test basic auth connection
    console.log("\n2️⃣ Basic Auth Connection Test:");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("   Auth connection: ✅ Working");
    } catch (err) {
      console.log("   Auth connection: ❌ Failed -", err.message);
    }

    // Check 3: Test with a known email (admin)
    console.log("\n3️⃣ Testing Password Recovery with Known Email:");
    const testEmail = "admin@jaykaydigitalpress.com";

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        testEmail,
        {
          redirectTo: "http://localhost:3000/auth/reset-password",
        },
      );

      if (error) {
        console.log("   ❌ Password recovery failed:", error.message);
        console.log("   Error code:", error.status);
        console.log("   Full error:", error);
      } else {
        console.log("   ✅ Password recovery request successful");
        console.log("   Data:", data);
      }
    } catch (err) {
      console.log("   ❌ Unexpected error:", err.message);
    }

    // Check 4: URL validation
    console.log("\n4️⃣ URL Configuration Check:");
    const redirectUrl = "http://localhost:3000/auth/reset-password";
    console.log("   Redirect URL:", redirectUrl);
    console.log(
      "   Protocol:",
      redirectUrl.startsWith("http") ? "✅ Valid" : "❌ Invalid",
    );

    // Check 5: Common issues checklist
    console.log("\n5️⃣ Common Issues Checklist:");
    console.log("   ❓ Check these in your Supabase Dashboard:");
    console.log(
      "   1. Authentication > Settings > Site URL includes http://localhost:3000",
    );
    console.log(
      "   2. Authentication > Settings > Redirect URLs includes http://localhost:3000/**",
    );
    console.log(
      "   3. Authentication > Settings > Email templates are configured",
    );
    console.log(
      "   4. Authentication > Settings > SMTP settings (if using custom email)",
    );
    console.log(
      "   5. Check Auth logs in Supabase Dashboard for detailed error info",
    );

    console.log("\n📧 Email Configuration Status:");
    console.log("   If using Supabase built-in email: Should work by default");
    console.log("   If using custom SMTP: Check SMTP settings in Dashboard");
  } catch (err) {
    console.error("💥 Diagnostic error:", err.message);
  }
}

diagnosePwdRecovery();
