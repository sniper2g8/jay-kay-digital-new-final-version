"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

function InvoicesContent() {
  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Invoices
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your invoices and billing
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/invoices/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Temporary placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              Invoice listing and management functionality is being updated
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Invoice list functionality is temporarily disabled while we
                update the system.
              </p>
              <p className="text-muted-foreground">
                You can still create new invoices using the button above.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/invoices/create">
                  Create New Invoice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function InvoicesPage() {
  return (
    <ProtectedDashboard
      allowedRoles={["staff", "manager", "admin", "super_admin"]}
    >
      <InvoicesContent />
    </ProtectedDashboard>
  );
}
