import AdminEmailSystem from "@/components/AdminEmailSystem";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminEmailPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminEmailSystem />
    </ProtectedRoute>
  );
}
