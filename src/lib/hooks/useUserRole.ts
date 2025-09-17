import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import useSWR from "swr";

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "staff"
  | "customer";

export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  primary_role: UserRole;
  human_id?: string;
  status: string;
}

// Fetcher function to get current user's role information
const fetchUserRole = async (userId: string): Promise<UserWithRole | null> => {
  if (!userId) return null;

  // Don't execute during build/SSG
  if (typeof window === "undefined") {
    return null;
  }

  // Check current session status first
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error in fetchUserRole:", sessionError);
    return null;
  }

  if (!session) {
    console.log("No session in fetchUserRole - user not authenticated");
    return null;
  }

  try {
    // Get user data from appUsers table
    const { data, error } = await supabase
      .from("appUsers")
      .select("id, email, name, primary_role, human_id, status")
      .eq("id", userId)
      .single();

    if (error) {
      // Don't log error if user simply doesn't exist in appUsers table yet
      if (error.code === "PGRST116") {
        console.log("User not found in appUsers table:", userId);
        return null;
      }
      console.error("Error fetching user role:", error);
      return null;
    }

    return data as UserWithRole;
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    return null;
  }
};

// Hook to get current user's role
export const useUserRole = () => {
  const { user, session, loading } = useAuth();

  // Build-time check - still call hooks but don't log or execute side effects
  const isBuildTime = typeof window === "undefined";

  // Only fetch if user is authenticated and session is valid
  const shouldFetch =
    !loading && !isBuildTime && user && session && session.user?.id === user.id;

  return useSWR(
    shouldFetch ? `user-role-${user.id}` : null,
    () => (shouldFetch && user ? fetchUserRole(user.id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      onError: (error) => {
        // Only log errors if we actually expected to fetch data
        if (shouldFetch) {
          console.error("Error in useUserRole:", error);
        }
      },
    },
  );
};

// Helper function to check if user has specific role
export const hasRole = (
  userRole: string | undefined | null,
  requiredRole: UserRole,
): boolean => {
  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    customer: 1,
    staff: 2,
    manager: 3,
    admin: 4,
    super_admin: 5,
  };

  const userLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

// Helper function to check if user has any of the specified roles
export const hasAnyRole = (
  userRole: string | undefined | null,
  roles: UserRole[],
): boolean => {
  return roles.some((role) => hasRole(userRole, role));
};

// Helper function to get user's permissions based on role
export const getUserPermissions = (role: UserRole): string[] => {
  const permissions: Record<UserRole, string[]> = {
    super_admin: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "jobs.create",
      "jobs.read",
      "jobs.update",
      "jobs.delete",
      "customers.create",
      "customers.read",
      "customers.update",
      "customers.delete",
      "invoices.create",
      "invoices.read",
      "invoices.update",
      "invoices.delete",
      "payments.create",
      "payments.read",
      "payments.update",
      "payments.delete",
      "inventory.create",
      "inventory.read",
      "inventory.update",
      "inventory.delete",
      "system.settings",
      "system.backup",
      "system.audit",
      "reports.all",
    ],
    admin: [
      "jobs.create",
      "jobs.read",
      "jobs.update",
      "jobs.delete",
      "customers.create",
      "customers.read",
      "customers.update",
      "customers.delete",
      "invoices.create",
      "invoices.read",
      "invoices.update",
      "invoices.delete",
      "payments.create",
      "payments.read",
      "payments.update",
      "payments.delete",
      "inventory.create",
      "inventory.read",
      "inventory.update",
      "inventory.delete",
      "reports.financial",
      "reports.operational",
    ],
    manager: [
      "jobs.create",
      "jobs.read",
      "jobs.update",
      "customers.read",
      "customers.update",
      "invoices.read",
      "invoices.update",
      "payments.read",
      "payments.create",
      "inventory.read",
      "inventory.update",
      "reports.operational",
    ],
    staff: ["jobs.read", "jobs.update", "customers.read", "inventory.read"],
    customer: [
      "jobs.create",
      "jobs.read",
      "customers.read.own",
      "invoices.read.own",
      "payments.read.own",
    ],
  };

  return permissions[role] || [];
};

// Helper function to check if user has specific permission
export const hasPermission = (
  userRole: string | undefined | null,
  permission: string,
): boolean => {
  if (!userRole) return false;

  const permissions = getUserPermissions(userRole as UserRole);
  return permissions.includes(permission);
};
