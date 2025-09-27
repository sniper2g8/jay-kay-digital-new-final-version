"use client";

import { useUserRole } from "@/lib/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

export default function TestUserRolePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, error, isLoading } = useUserRole();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Role Test</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Auth Status</h2>
        <p>Loading: {authLoading ? "Yes" : "No"}</p>
        <p>User: {user ? user.email : "Not authenticated"}</p>
        <p>User ID: {user?.id || "N/A"}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">User Role Data</h2>
        <p>Loading: {isLoading ? "Yes" : "No"}</p>
        {error && (
          <div className="text-red-500">
            <p>Error: {JSON.stringify(error)}</p>
          </div>
        )}
        {userRole ? (
          <div>
            <p>Name: {userRole.name || "N/A"}</p>
            <p>Email: {userRole.email}</p>
            <p>Role: {userRole.primary_role}</p>
            <p>Status: {userRole.status}</p>
            <p>Human ID: {userRole.human_id || "N/A"}</p>
          </div>
        ) : (
          <p>No user role data available</p>
        )}
      </div>
    </div>
  );
}
