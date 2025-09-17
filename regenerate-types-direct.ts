import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

async function regenerateTypes() {
  console.log("🔄 Regenerating database types...");

  try {
    // Get current types file content
    const typesFilePath = path.join(
      __dirname,
      "src/lib/database-generated.types.ts",
    );
    const currentContent = fs.readFileSync(typesFilePath, "utf8");

    // Check if customer_statement_periods is already in the types
    if (currentContent.includes("customer_statement_periods")) {
      console.log("✅ customer_statement_periods already exists in types file");
      return;
    }

    // Add the customer_statement_periods table type definition
    const customerStatementPeriodsType = `
      customer_statement_periods: {
        Row: {
          id: string
          customer_id: string | null
          statement_number: string
          period_start: string
          period_end: string
          statement_date: string | null
          opening_balance: number | null
          closing_balance: number | null
          current_balance: number | null
          total_charges: number | null
          total_payments: number | null
          total_adjustments: number | null
          status: string | null
          is_current_period: boolean | null
          created_at: string | null
          updated_at: string | null
          generated_by: string | null
          sent_at: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          statement_number: string
          period_start: string
          period_end: string
          statement_date?: string | null
          opening_balance?: number | null
          closing_balance?: number | null
          current_balance?: number | null
          total_charges?: number | null
          total_payments?: number | null
          total_adjustments?: number | null
          status?: string | null
          is_current_period?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          generated_by?: string | null
          sent_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          statement_number?: string
          period_start?: string
          period_end?: string
          statement_date?: string | null
          opening_balance?: number | null
          closing_balance?: number | null
          current_balance?: number | null
          total_charges?: number | null
          total_payments?: number | null
          total_adjustments?: number | null
          status?: string | null
          is_current_period?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          generated_by?: string | null
          sent_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_statement_periods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }`;

    // Find where to insert the new table type (after another table definition)
    const insertAfterPattern = /(\s+)(customers: \{[\s\S]*?\n\s+\})/;
    const match = currentContent.match(insertAfterPattern);

    if (match) {
      const indentation = match[1];
      const newContent = currentContent.replace(
        insertAfterPattern,
        `$1$2\n${indentation}customer_statement_periods: {${customerStatementPeriodsType.replace(/\n/g, "\n" + indentation).slice(indentation.length)}\n${indentation}}`,
      );

      // Write the updated content back to the file
      fs.writeFileSync(typesFilePath, newContent, "utf8");
      console.log(
        "✅ Successfully added customer_statement_periods to database types",
      );
    } else {
      console.log("❌ Could not find insertion point in types file");
    }
  } catch (error) {
    console.error("❌ Error regenerating types:", error);
  }
}

regenerateTypes();
