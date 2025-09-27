"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { InvoiceNavigation } from "@/components/InvoiceNavigation";

export default function InvoiceDashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Invoice Dashboard</h1>
        <InvoiceNavigation />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Create Invoice</h3>
            <p className="text-gray-600 mb-4">
              Create professional invoices for your customers.
            </p>
            <Link href="/invoice" className="text-red-600 hover:underline">
              Go to Invoice Management
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">View Templates</h3>
            <p className="text-gray-600 mb-4">
              Preview the professional invoice templates.
            </p>
            <Link
              href="/invoice/template"
              className="text-red-600 hover:underline"
            >
              View Invoice Template
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Demo</h3>
            <p className="text-gray-600 mb-4">
              See a live demo of the invoice system.
            </p>
            <Link href="/invoice/demo" className="text-red-600 hover:underline">
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
