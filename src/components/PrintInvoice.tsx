"use client";

import { InvoiceTemplate } from "./InvoiceTemplate.tsx";

interface InvoiceData {
  id: string;
  invoiceNo?: string;
  created_at: string;
  invoice_date?: string;
  invoice_status?: string;
  terms_days?: number;
  notes?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  amountPaid?: number;
}

interface Customer {
  business_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_no?: string;
  notes?: string;
}

interface PrintInvoiceProps {
  invoice: InvoiceData;
  customer?: Customer;
  items: InvoiceItem[];
}

export function PrintInvoice({ invoice, customer, items }: PrintInvoiceProps) {
  return (
    <div className="print:block hidden">
      <InvoiceTemplate invoice={invoice} customer={customer} items={items} />
    </div>
  );
}
