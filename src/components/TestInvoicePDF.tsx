"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InvoicePDFDocument,
  downloadInvoicePDF,
} from "@/components/ProfessionalInvoicePDFDocument";

// Sample data for testing
const sampleInvoice = {
  id: "inv_001",
  invoiceNo: "JKDP-2025-001",
  created_at: new Date().toISOString(),
  invoice_date: new Date().toISOString(),
  invoice_status: "sent",
  payment_status: "pending",
  terms_days: 30,
  notes: "Thank you for your business. Payment is due within 30 days.",
  subtotal: 1200,
  tax: 120,
  tax_rate: 10,
  discount: 0,
  total: 1320,
  amountPaid: 0,
  currency: "SLL",
};

const sampleCustomer = {
  business_name: "ABC Corporation",
  contact_person: "John Smith",
  email: "john@abc.com",
  phone: "+1234567890",
  address: "123 Business Street",
  city: "Freetown",
  state: "Western Area",
  zip_code: "12345",
  country: "Sierra Leone",
};

const sampleItems = [
  {
    id: 1,
    description: "Business Card Printing",
    quantity: 500,
    unit_price: 2.0,
    total_price: 1000,
    job_no: "JOB-001",
    notes: "Standard business cards with logo",
  },
  {
    id: 2,
    description: "Flyer Design & Printing",
    quantity: 100,
    unit_price: 2.0,
    total_price: 200,
    job_no: "JOB-002",
    notes: "A4 size, full color printing",
  },
];

export function TestInvoicePDF() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await downloadInvoicePDF(sampleInvoice, sampleCustomer, sampleItems);
    } catch (error) {
      // console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Invoice PDF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Click the button below to generate a test PDF with the improved
          design:
        </p>
        <Button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? "Generating..." : "Generate Test PDF"}
        </Button>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <div className="border rounded-lg overflow-hidden max-w-2xl">
            <InvoicePDFDocument
              invoice={sampleInvoice}
              customer={sampleCustomer}
              items={sampleItems}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
