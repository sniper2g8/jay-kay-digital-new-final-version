"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Phone, Mail, MapPin, FileText } from "lucide-react";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_no?: string;
  notes?: string;
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

interface InvoiceTemplateProps {
  invoice: {
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
  };
  customer?: Customer;
  items: InvoiceItem[];
}

export function InvoiceTemplate({ 
  invoice, 
  customer, 
  items
}: InvoiceTemplateProps) {
  const subtotal = invoice.subtotal || items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = invoice.total || subtotal + tax - discount;
  const amountPaid = invoice.amountPaid || 0;
  const amountDue = total - amountPaid;

  // Calculate due date
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + (invoice.terms_days || 30));

  return (
    <div className="max-w-4xl mx-auto bg-white print:shadow-none">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
        }
      `}</style>

      {/* Company Header with Jay Kay Digital Press Branding */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-wide">
              Jay Kay Digital Press
            </h1>
            <p className="text-red-100 text-lg font-medium">
              Professional Printing Services
            </p>
            <div className="bg-yellow-400 text-red-800 px-3 py-1 rounded-full text-sm font-semibold inline-block">
              Quality • Speed • Reliability
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="bg-white text-red-600 px-4 py-2 rounded-lg">
              <p className="text-2xl font-bold">
                INVOICE
              </p>
              <p className="text-sm text-red-500">
                #{invoice.invoiceNo || `INV-${invoice.id.slice(0, 8)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Company Contact Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>+232 34 788711</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>+232 30 741062</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>jaykaydigitalpress@gmail.com</span>
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>St. Edward School Avenue, By Caritas, Freetown, Sierra Leone</span>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-8 space-y-8">
        {/* Invoice Details and Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
              Bill To
            </h3>
            {customer ? (
              <div className="space-y-2 text-gray-700">
                <p className="font-semibold text-lg">{customer.business_name}</p>
                {customer.contact_person && (
                  <p className="text-gray-600">{customer.contact_person}</p>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p>{customer.address}</p>
                      {(customer.city || customer.state || customer.zip_code) && (
                        <p>{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Customer information not available</p>
            )}
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
              Invoice Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <Badge 
                  className={`${
                    invoice.invoice_status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.invoice_status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    invoice.invoice_status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {invoice.invoice_status 
                    ? invoice.invoice_status.charAt(0).toUpperCase() + invoice.invoice_status.slice(1) 
                    : 'Draft'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{formatDate(invoiceDate.toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(dueDate.toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium">{invoice.terms_days || 30} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
            Items & Services
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.job_no || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No items found on this invoice</p>
            </div>
          )}
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-red-600">{formatCurrency(total)}</span>
              </div>
              {amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Amount Due:</span>
                    <span className={amountDue > 0 ? "text-orange-600" : "text-green-600"}>
                      {formatCurrency(amountDue)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
              Notes
            </h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Instructions */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Payment Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Payment is due within {invoice.terms_days || 30} days of invoice date</p>
                <p>• Please include invoice number with payment</p>
                <p>• Late payments may incur additional fees</p>
                <p>• Contact us for payment method details</p>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-right">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold mb-1">Thank you for your business!</p>
                <p className="text-red-600 text-sm">
                  Questions? Contact us at jaykaydigitalpress@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}