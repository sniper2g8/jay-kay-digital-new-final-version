import React from 'react';
import AdminNotificationLogs from '@/components/AdminNotificationLogs';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminNotificationLogsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminNotificationLogs />
    </ProtectedRoute>
  );
}