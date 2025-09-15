'use client';

import { ReactNode } from 'react';
import { useUserRole, type UserRole } from '@/lib/hooks/useUserRole';
import RoleBasedNav from '@/components/RoleBasedNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}

export default function DashboardLayout({ 
  children, 
  requiredRole, 
  requiredRoles 
}: DashboardLayoutProps) {
  const { data: userData, isLoading, error } = useUserRole();

  // Show loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading user information...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Access Error</h3>
            <p className="text-sm text-red-600">
              Unable to verify your permissions. Please try refreshing the page or contact support.
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
        'customer': 1,
        'staff': 2,
        'manager': 3,
        'admin': 4,
        'super_admin': 5
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 max-w-md">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h3>
            <p className="text-sm text-yellow-700">
              You don&apos;t have permission to access this section. Your current role is: {' '}
              <span className="font-medium capitalize">
                {userData?.primary_role?.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Role-based Navigation Sidebar */}
        <RoleBasedNav />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Role-specific dashboard layouts
export function SuperAdminDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRole="super_admin">
      {children}
    </DashboardLayout>
  );
}

export function AdminDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRole="admin">
      {children}
    </DashboardLayout>
  );
}

export function ManagerDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRole="manager">
      {children}
    </DashboardLayout>
  );
}

export function StaffDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRole="staff">
      {children}
    </DashboardLayout>
  );
}

export function CustomerDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout requiredRoles={["customer"]}>
      {children}
    </DashboardLayout>
  );
}