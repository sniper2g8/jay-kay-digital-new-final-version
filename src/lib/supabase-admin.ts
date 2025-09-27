import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Create a Supabase client with new secret key for server-side admin operations
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;

  // Check if we have the required keys
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// For backward compatibility, export a default instance
// Use lazy initialization to avoid errors in browser context
let supabaseAdminInstance: ReturnType<typeof createServiceRoleClient> | null = null;
export const supabaseAdmin = () => {
  if (supabaseAdminInstance === null) {
    // Only create the instance if we're in a server context
    if (typeof window === 'undefined') {
      supabaseAdminInstance = createServiceRoleClient();
    } else {
      // Return null or throw an error in browser context
      throw new Error('supabaseAdmin should only be used in server-side context');
    }
  }
  return supabaseAdminInstance;
};
