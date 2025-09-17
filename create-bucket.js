const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function createJobFilesBucket() {
  console.log("🪣 Creating job-files storage bucket...");

  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket("job-files", {
      public: true,
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
      ],
      fileSizeLimit: 10485760, // 10MB
    });

    if (error) {
      if (error.message.includes("already exists")) {
        console.log("✅ Bucket already exists!");
        return true;
      }
      console.error("❌ Error creating bucket:", error);
      return false;
    } else {
      console.log("✅ Bucket created successfully:", data);
      return true;
    }
  } catch (err) {
    console.error("❌ Exception:", err);
    return false;
  }
}

createJobFilesBucket();
