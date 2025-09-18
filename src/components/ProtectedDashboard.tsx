"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedDashboardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

export default function ProtectedDashboard({
  children,
  allowedRoles = ["super_admin", "admin", "manager", "staff"],
  redirectPath = "/customer-dashboard",
}: ProtectedDashboardProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: userData, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !roleLoading && user && userData) {
      const userRole = userData.primary_role;

      if (userRole && !allowedRoles.includes(userRole)) {
        
        router.replace(redirectPath);
        return;
      }
    }
  }, [
    user,
    userData,
    authLoading,
    roleLoading,
    router,
    allowedRoles,
    redirectPath,
  ]);

  // Show loading state while authentication is being determined
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Show redirecting message for unauthorized users
  const userRole = userData?.primary_role;
  if (!user || !userData || !userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  // Render the protected content for authorized users
  return <>{children}</>;
}
