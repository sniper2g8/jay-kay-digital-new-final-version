"use client";

import { InvoiceNavigation } from "@/components/InvoiceNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function InvoicePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Invoice Management</h1>
        <InvoiceNavigation />
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Professional Invoice System</h2>
          <p className="text-gray-600 mb-6">
            Welcome to the Jay Kay Digital Press invoice management system. 
            This system allows you to create, manage, and send professional invoices to your customers.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Create professional invoices with ease</li>
                <li>Customize items and pricing</li>
                <li>Apply taxes and discounts</li>
                <li>Generate PDF invoices</li>
                <li>Print invoices directly</li>
                <li>Track payment status</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
              <p className="text-gray-600 mb-4">
                To create a new invoice, click on the &quot;Invoice Management&quot; button above.
              </p>
              <p className="text-gray-600">
                You can preview the invoice template or view a demo to see how it works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}