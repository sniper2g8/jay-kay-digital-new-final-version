import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Create a Supabase client with new secret key for server-side admin operations
export const createServiceRoleClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!, // Use new secret key instead of old service_role
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