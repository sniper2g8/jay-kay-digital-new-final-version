const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log(
    "Need either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function regenerateTypes() {
  console.log("🔄 Regenerating database types...");

  try {
    // Get schema information for all tables
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE");

    if (tablesError) {
      console.error("❌ Error fetching tables:", tablesError);
      return;
    }

    console.log(
      "📋 Found tables:",
      tables?.map((t) => t.table_name).join(", "),
    );

    // Check if the paper tables exist
    const paperTables = ["paper_types", "paper_sizes", "paper_weights"];
    const existingPaperTables = tables?.filter((t) =>
      paperTables.includes(t.table_name),
    );

    console.log(
      "📄 Paper tables found:",
      existingPaperTables?.map((t) => t.table_name).join(", "),
    );

    if (existingPaperTables && existingPaperTables.length > 0) {
      console.log("✅ Paper tables exist in database");

      // Manual type generation for now since we don't have Supabase CLI set up
      console.log(
        "🛠️ Manually adding paper table types to database-generated.types.ts",
      );

      const typesFilePath = path.join(
        __dirname,
        "src",
        "lib",
        "database-generated.types.ts",
      );
      let typesContent = fs.readFileSync(typesFilePath, "utf8");

      // Check if paper types are already added
      if (
        !typesContent.includes("paper_types") &&
        !typesContent.includes("paper_sizes") &&
        !typesContent.includes("paper_weights")
      ) {
        // Find the Tables section and add paper tables
        const paperTypesDefinition = `
      paper_sizes: {
        Row: {
          id: string
          name: string
          series: string | null
          width_mm: number
          height_mm: number
          category: string | null
          description: string | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          series?: string | null
          width_mm: number
          height_mm: number
          category?: string | null
          description?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          series?: string | null
          width_mm?: number
          height_mm?: number
          category?: string | null
          description?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      paper_types: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          finish: string | null
          texture: string | null
          color: string | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          finish?: string | null
          texture?: string | null
          color?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          description?: string | null
          finish?: string | null
          texture?: string | null
          color?: string | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      paper_weights: {
        Row: {
          id: string
          gsm: number
          name: string
          category: string | null
          description: string | null
          thickness_microns: number | null
          opacity: number | null
          brightness: number | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          gsm: number
          name: string
          category?: string | null
          description?: string | null
          thickness_microns?: number | null
          opacity?: number | null
          brightness?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          gsm?: number
          name?: string
          category?: string | null
          description?: string | null
          thickness_microns?: number | null
          opacity?: number | null
          brightness?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }`;

        // Find the insertion point (before the closing of Tables)
        const insertionPoint = typesContent.lastIndexOf("      }");
        if (insertionPoint > -1) {
          const beforeInsertion = typesContent.substring(0, insertionPoint);
          const afterInsertion = typesContent.substring(insertionPoint);

          const updatedContent =
            beforeInsertion + paperTypesDefinition + "\n" + afterInsertion;

          // Create backup
          fs.writeFileSync(typesFilePath + ".backup", typesContent);

          // Write updated types
          fs.writeFileSync(typesFilePath, updatedContent);

          console.log(
            "✅ Successfully added paper table types to database-generated.types.ts",
          );
          console.log(
            "📄 Backup created at database-generated.types.ts.backup",
          );
        } else {
          console.error("❌ Could not find insertion point in types file");
        }
      } else {
        console.log("ℹ️ Paper table types already exist in the types file");
      }
    } else {
      console.log(
        "⚠️ Paper tables not found in database. You may need to create them first.",
      );
    }
  } catch (error) {
    console.error("❌ Error regenerating types:", error);
  }
}

// Also provide instructions for proper type generation
console.log(`
🔧 DATABASE TYPES REGENERATION

This script provides a manual approach to add paper table types.
For a more robust solution, consider:

1. Install Supabase CLI:
   npm install -g supabase

2. Initialize Supabase in your project:
   supabase init

3. Generate types properly:
   supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database-generated.types.ts

4. Or use the official Supabase type generation:
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID

Starting manual type addition...
`);

regenerateTypes();
