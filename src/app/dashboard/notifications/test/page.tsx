/**
 * Notification Testing Page
 * Page for testing and managing notification system
 */

import { Metadata } from "next";
import NotificationManager from "@/components/NotificationManager";

export const metadata: Metadata = {
  title: "Notifications - Jay Kay Digital Press",
  description: "Test and manage notification system",
};

export default function NotificationTestPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Notification System
        </h1>
        <p className="text-muted-foreground">
          Test and manage email and SMS notifications for job updates and
          payments
        </p>
      </div>

      <NotificationManager />
    </div>
  );
}
