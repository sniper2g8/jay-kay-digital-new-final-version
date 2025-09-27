"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function InvoiceNavigation() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Invoice Management</h2>
      <p className="text-gray-600 mb-4">
        Navigate to different invoice management pages:
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/invoice">
          <Button variant="outline">Invoice Management</Button>
        </Link>
        <Link href="/invoice/template">
          <Button variant="outline">Invoice Template</Button>
        </Link>
        <Link href="/invoice/demo">
          <Button variant="outline">Invoice Demo</Button>
        </Link>
      </div>
    </div>
  );
}
