"use client";

import { ReactNode } from "react";
import { useUserRole, UserRole } from "@/lib/hooks/useUserRole";
import RoleBasedNav from "@/components/RoleBasedNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}

export default function DashboardLayout({
  children,
  requiredRole,
  requiredRoles,
}: DashboardLayoutProps) {
  const { data: userData, isLoading, error } = useUserRole();

  // Show loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">
              Loading user information...
            </span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 max-w-md w-full animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Access Error
            </h3>
            <p className="text-sm text-destructive/80">
              Unable to verify your permissions. Please try refreshing the page
              or contact support.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Check role permissions
  const hasRequiredRole = () => {
    if (!userData?.primary_role) return false;

    if (requiredRole) {
      const roleHierarchy: Record<UserRole, number> = {
        customer: 1,
        staff: 2,
        manager: 3,
        admin: 4,
        super_admin: 5,
      };

      const userLevel = roleHierarchy[userData.primary_role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      return userLevel >= requiredLevel;
    }

    if (requiredRoles) {
      return requiredRoles.includes(userData.primary_role);
    }

    // If no specific role requirements, allow all authenticated users
    return true;
  };

  // Show access denied if user doesn't have required role
  if (!hasRequiredRole()) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-6 max-w-md w-full animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-semibold text-warning mb-2">
              Access Restricted
            </h3>
            <p className="text-sm text-warning/80">
              You don&apos;t have permission to access this section. Your
              current role is:{" "}
              <span className="font-medium capitalize">
                {userData?.primary_role?.replace("_", " ")}
              </span>
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex animate-in fade-in duration-300">
        {/* Role-based Navigation Sidebar */}
        <RoleBasedNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Role-specific dashboard layouts
export function SuperAdminDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRole="super_admin">{children}</DashboardLayout>
  );
}

export function AdminDashboard({ children }: { children: ReactNode }) {
  return <DashboardLayout requiredRole="admin">{children}</DashboardLayout>;
}

export function ManagerDashboard({ children }: { children: ReactNode }) {
  return <DashboardLayout requiredRole="manager">{children}</DashboardLayout>;
}

export function StaffDashboard({ children }: { children: ReactNode }) {
  return <DashboardLayout requiredRole="staff">{children}</DashboardLayout>;
}

export function CustomerDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRoles={["customer"]}>{children}</DashboardLayout>
  );
}
