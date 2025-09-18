"use client";

import { InvoiceTemplate } from "@/components/InvoiceTemplate";

export default function InvoiceTemplatePage() {
  // Sample data for demonstration
  const sampleInvoice = {
    id: "inv_001",
    invoiceNo: "JKDP-INV-001",
    created_at: new Date().toISOString(),
    invoice_date: new Date().toISOString(),
    invoice_status: "sent",
    payment_status: "pending",
    terms_days: 30,
    notes: "Thank you for your business! Please make payment within 30 days.",
    subtotal: 1200.00,
    tax: 120.00,
    tax_rate: 10,
    discount: 50.00,
    total: 1270.00,
    amountPaid: 0,
    currency: "SLL"
  };

  const sampleCustomer = {
    business_name: "ABC Corporation",
    contact_person: "John Smith",
    email: "john@abccorp.com",
    phone: "+232 77 123456",
    address: "123 Business Street",
    city: "Freetown",
    state: "Western Area",
    zip_code: "12345",
    country: "Sierra Leone"
  };

  const sampleItems = [
    {
      id: 1,
      description: "Business Card Printing",
      quantity: 1000,
      unit_price: 0.50,
      total_price: 500.00,
      notes: "Standard business cards, 300gsm"
    },
    {
      id: 2,
      description: "Flyer Design & Printing",
      quantity: 500,
      unit_price: 1.00,
      total_price: 500.00,
      notes: "A4 size, full color printing"
    },
    {
      id: 3,
      description: "Logo Design",
      quantity: 1,
      unit_price: 200.00,
      total_price: 200.00,
      notes: "Custom logo design with revisions"
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Invoice Template</h1>
      <p className="text-gray-600 mb-6">
        This is the updated professional invoice template.
      </p>
      <InvoiceTemplate 
        invoice={sampleInvoice} 
        customer={sampleCustomer} 
        items={sampleItems} 
      />
    </div>
  );
}