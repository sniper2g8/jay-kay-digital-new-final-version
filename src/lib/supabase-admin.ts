import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Create a Supabase client with new secret key for server-side admin operations
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// For backward compatibility, export a default instance
export const supabaseAdmin = createServiceRoleClient();