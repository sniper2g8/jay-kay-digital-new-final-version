"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldOff } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

interface UserRole {
  primary_role: string | null;
  status: string | null;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('appUsers')
        .select('primary_role, status')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error checking user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Role hierarchy - higher numbers have more permissions
    const roleHierarchy: Record<string, number> = {
      'customer': 1,
      'staff': 2,
      'manager': 3,
      'admin': 4,
      'super_admin': 5
    };

    const hasRequiredAccess = (userRole: string | null, requiredRole: string): boolean => {
      if (!userRole || !requiredRole) return false;
      
      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 999;
      
      return userLevel >= requiredLevel;
    };

    const performAuthCheck = async () => {
      console.log("ProtectedRoute - Auth state check:", {
        user: !!user,
        loading,
        requiredRole
      });

      if (!loading) {
        if (!user) {
          console.log("ProtectedRoute - No user, redirecting to login");
          router.push(redirectTo);
          return;
        }

        // If no role required, just check authentication
        if (!requiredRole) {
          console.log("ProtectedRoute - User authenticated, no role required");
          setChecking(false);
          return;
        }

        // Check user role
        const role = await checkUserRole(user.id);
        setUserRole(role);

        if (!role) {
          console.log("ProtectedRoute - Could not fetch user role");
          setAccessDenied(true);
          setChecking(false);
          return;
        }

        if (role.status !== 'active') {
          console.log("ProtectedRoute - User account not active:", role.status);
          setAccessDenied(true);
          setChecking(false);
          return;
        }

        if (!hasRequiredAccess(role.primary_role, requiredRole)) {
          console.log("ProtectedRoute - Insufficient permissions:", {
            userRole: role.primary_role,
            requiredRole
          });
          setAccessDenied(true);
          setChecking(false);
          return;
        }

        console.log("ProtectedRoute - Access granted:", {
          userRole: role.primary_role,
          requiredRole
        });
        setChecking(false);
      }
    };

    performAuthCheck();
  }, [user, loading, requiredRole, router, redirectTo]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ShieldOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Your role: <span className="font-medium">{userRole?.primary_role || 'Unknown'}</span></p>
            <p>Required role: <span className="font-medium">{requiredRole}</span></p>
            <p>Account status: <span className="font-medium">{userRole?.status || 'Unknown'}</span></p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
