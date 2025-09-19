import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database-generated.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Customer = Tables<"customers">;
export type Payment = Tables<"payments">;
export type Invoice = Tables<"invoices">;
export type Job = Tables<"jobs">;
export type AppUser = Tables<"appUsers">;
export type Role = Tables<"roles">;
export type Permission = Tables<"permissions">;
export type Service = Tables<"services">;
export type Inventory = Tables<"inventory">;
