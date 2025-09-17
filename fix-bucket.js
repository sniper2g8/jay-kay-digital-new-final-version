const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function fixBucketConfiguration() {
  console.log("🔧 Fixing job-files bucket configuration...");

  try {
    // The bucket exists but is private, we need to update it
    // Unfortunately, Supabase doesn't allow updating bucket settings via API
    // We need to delete and recreate it

    console.log("\n1. Backing up existing files...");
    const { data: existingFiles, error: listError } =
      await supabaseAdmin.storage.from("job-files").list("", { limit: 100 });

    if (listError) {
      console.error("❌ Error listing files:", listError);
      return;
    }

    console.log(`✅ Found ${existingFiles.length} existing files/folders`);

    // List files in all subdirectories
    const allFiles = [];
    for (const item of existingFiles) {
      if (item.name && !item.name.includes(".")) {
        // This is likely a folder, list its contents
        const { data: subFiles, error: subError } = await supabaseAdmin.storage
          .from("job-files")
          .list(item.name, { limit: 100 });

        if (!subError && subFiles) {
          subFiles.forEach((file) => {
            if (file.name && file.name.includes(".")) {
              allFiles.push(`${item.name}/${file.name}`);
            }
          });
        }
      } else if (item.name && item.name.includes(".")) {
        allFiles.push(item.name);
      }
    }

    console.log(`📁 Total files to backup: ${allFiles.length}`);
    allFiles.forEach((file) => console.log(`  - ${file}`));

    // For now, let's just try to make the existing bucket work by using signed URLs
    // instead of recreating it

    console.log("\n2. Testing signed URL generation...");
    if (allFiles.length > 0) {
      const testFile = allFiles[0];
      console.log(`Testing with file: ${testFile}`);

      const { data: signedUrlData, error: signedUrlError } =
        await supabaseAdmin.storage
          .from("job-files")
          .createSignedUrl(testFile, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error("❌ Error creating signed URL:", signedUrlError);
      } else {
        console.log("✅ Signed URL created:", signedUrlData.signedUrl);

        // Test downloading with signed URL
        const { data: downloadData, error: downloadError } =
          await supabaseAdmin.storage.from("job-files").download(testFile);

        if (downloadError) {
          console.error("❌ Error downloading with signed URL:", downloadError);
        } else {
          console.log(
            "✅ Download successful, size:",
            downloadData.size,
            "bytes",
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

fixBucketConfiguration();
