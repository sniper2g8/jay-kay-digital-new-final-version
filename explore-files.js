const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

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

async function exploreJobFilesStructure() {
  console.log("🔍 Exploring job-files bucket structure...");

  try {
    // List all items at root level
    const { data: rootItems, error: rootError } = await supabaseAdmin.storage
      .from("job-files")
      .list("", { limit: 100 });

    if (rootError) {
      console.error("❌ Error listing root items:", rootError);
      return;
    }

    console.log(`✅ Root level items: ${rootItems.length}`);

    for (const item of rootItems) {
      console.log(`\n📁 Item: ${item.name}`);
      console.log(`   Type: ${item.id ? "File" : "Folder"}`);
      console.log(`   Size: ${item.metadata?.size || "N/A"} bytes`);
      console.log(
        `   Modified: ${item.updated_at || item.created_at || "N/A"}`,
      );

      // If it's a directory (no file extension), explore it
      if (!item.name.includes(".") || item.name === "jobs") {
        console.log(`   🔍 Exploring subdirectory: ${item.name}`);

        const { data: subItems, error: subError } = await supabaseAdmin.storage
          .from("job-files")
          .list(item.name, { limit: 100 });

        if (subError) {
          console.error(`   ❌ Error listing ${item.name}:`, subError);
        } else {
          console.log(`   ✅ Found ${subItems.length} items in ${item.name}/`);

          for (const subItem of subItems) {
            console.log(
              `     📄 ${subItem.name} (${subItem.metadata?.size || "unknown"} bytes)`,
            );

            // If this is another directory, explore one level deeper
            if (!subItem.name.includes(".")) {
              const deepPath = `${item.name}/${subItem.name}`;
              const { data: deepItems, error: deepError } =
                await supabaseAdmin.storage
                  .from("job-files")
                  .list(deepPath, { limit: 100 });

              if (!deepError && deepItems.length > 0) {
                console.log(
                  `       🔍 ${deepPath}/ contains ${deepItems.length} items:`,
                );
                deepItems.forEach((deepItem) => {
                  console.log(
                    `         📄 ${deepItem.name} (${deepItem.metadata?.size || "unknown"} bytes)`,
                  );
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

exploreJobFilesStructure();
