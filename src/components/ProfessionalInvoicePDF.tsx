"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Download, FileText, QrCode } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import QRCode from "qrcode";

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
  country?: string;
}

interface InvoiceData {
  id: string;
  invoiceNo?: string;
  created_at: string;
  invoice_date?: string;
  invoice_status?: string;
  payment_status?: string;
  terms_days?: number;
  notes?: string;
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  discount?: number;
  total?: number;
  amountPaid?: number;
  currency?: string;
}

interface ProfessionalInvoicePDFProps {
  invoice: InvoiceData;
  customer?: Customer;
  items: InvoiceItem[];
  showActions?: boolean;
}

export function ProfessionalInvoicePDF({ 
  invoice, 
  customer, 
  items,
  showActions = true
}: ProfessionalInvoicePDFProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Calculate totals with proper type conversion
  const subtotal = invoice.subtotal || items.reduce((sum, item) => {
    const totalPrice = typeof item.total_price === 'string' ? parseFloat(item.total_price) || 0 : item.total_price || 0;
    return sum + totalPrice;
  }, 0);
  
  const taxRate = typeof invoice.tax_rate === 'string' ? parseFloat(invoice.tax_rate) || 0 : invoice.tax_rate || 0;
  const tax = invoice.tax || (subtotal * taxRate / 100);
  const discount = typeof invoice.discount === 'string' ? parseFloat(invoice.discount) || 0 : invoice.discount || 0;
  const total = invoice.total || subtotal + tax - discount;
  const amountPaid = typeof invoice.amountPaid === 'string' ? parseFloat(invoice.amountPaid) || 0 : invoice.amountPaid || 0;
  const amountDue = total - amountPaid;
  const currency = invoice.currency || 'SLL';

  // Calculate dates
  const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + (invoice.terms_days || 30));

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const invoiceInfo = {
          invoice_id: invoice.id,
          invoice_no: invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`,
          total: formatCurrency(total),
          due_date: formatDate(dueDate.toISOString()),
          company: "Jay Kay Digital Press"
        };
        
        const qrData = `Invoice: ${invoiceInfo.invoice_no}\nTotal: ${invoiceInfo.total}\nDue: ${invoiceInfo.due_date}\nCompany: ${invoiceInfo.company}`;
        const qrCodeUrl = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrCodeUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [invoice, total, dueDate]);

  // PDF generation using jsPDF + html2canvas
  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      // Hide action buttons during PDF generation
      const actionButtons = invoiceRef.current.querySelectorAll('.no-print');
      actionButtons.forEach(el => (el as HTMLElement).style.display = 'none');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.scrollWidth,
        height: invoiceRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `Invoice_${invoice.invoiceNo || invoice.id.slice(0, 8)}_${formatDate(invoiceDate).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      // Show action buttons again
      actionButtons.forEach(el => (el as HTMLElement).style.display = '');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Print function using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoice.invoiceNo || invoice.id.slice(0, 8)}`,
    onAfterPrint: () => {}
  });

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-end space-x-3 no-print">
          <Button 
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button 
            onClick={generatePDF}
            data-pdf-download
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      )}

      {/* Simplified Invoice Template */}
      <div ref={invoiceRef} className="bg-white">
        <div className="bg-white p-8 max-w-4xl mx-auto font-sans">
          {/* Print Styles */}
          <style jsx>{`
            @media print {
              @page {
                margin: 0.5in;
                size: A4;
              }
              .print\\:hidden {
                display: none !important;
              }
              .print\\:text-black {
                color: black !important;
              }
              .print\\:bg-white {
                background-color: white !important;
              }
            }
          `}</style>

          {/* Header */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src="/JK_Logo.jpg" 
                    alt="Jay Kay Digital Press Logo" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
                {/* Company Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">JAY KAY DIGITAL PRESS</h1>
                  <p className="text-sm text-gray-600 mb-1">Professional Printing & Digital Services</p>
                  <p className="text-sm text-gray-600 mb-1">Freetown, Sierra Leone</p>
                  <p className="text-sm text-gray-600 mb-1">Tel: +232 34 788711 | +232 30 741062</p>
                  <p className="text-sm text-gray-600">Email: info@jaykaydigitalpress.com</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">INVOICE</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice No:</span>
                      <span className="font-medium">#{invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">{formatDate(invoiceDate.toISOString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(dueDate.toISOString())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mr-3">Bill To</span>
              </h3>
              {customer ? (
                <div className="text-gray-700 space-y-1">
                  <p className="font-semibold text-lg text-gray-900">{customer.business_name}</p>
                  {customer.contact_person && <p className="text-gray-600">👤 {customer.contact_person}</p>}
                  {customer.address && <p className="text-gray-600">📍 {customer.address}</p>}
                  {customer.city && (
                    <p className="text-gray-600">
                      🏙️ {[customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {customer.country && <p className="text-gray-600">🌍 {customer.country}</p>}
                  {customer.phone && <p className="text-gray-600">📞 {customer.phone}</p>}
                  {customer.email && <p className="text-gray-600">✉️ {customer.email}</p>}
                </div>
              ) : (
                <p className="text-gray-500 italic">Customer information not available</p>
              )}
            </div>
            
            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 ml-8">
                <div className="text-center mb-2">
                  <QrCode className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Invoice Details</p>
                </div>
                <img 
                  src={qrCodeDataUrl} 
                  alt="Invoice QR Code" 
                  className="w-24 h-24 mx-auto"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Invoice #{invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Job No</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {item.job_no || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      <div>{item.description}</div>
                      {item.notes && <div className="text-gray-500 text-xs mt-1">{item.notes}</div>}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm">{item.quantity.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No items found on this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full max-w-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="px-4 py-1 text-sm text-gray-600">Subtotal:</td>
                  <td className="px-4 py-1 text-right text-sm">{formatCurrency(subtotal)}</td>
                </tr>
                {tax > 0 && (
                  <tr>
                    <td className="px-4 py-1 text-sm text-gray-600">
                      Tax {taxRate > 0 ? `(${taxRate}%)` : ''}:
                    </td>
                    <td className="px-4 py-1 text-right text-sm">{formatCurrency(tax)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td className="px-4 py-1 text-sm text-gray-600">Discount:</td>
                    <td className="px-4 py-1 text-right text-sm">-{formatCurrency(discount)}</td>
                  </tr>
                )}
                <tr className="border-t border-gray-300">
                  <td className="px-4 py-2 font-semibold">Total:</td>
                  <td className="px-4 py-2 text-right font-bold text-lg">{formatCurrency(total)}</td>
                </tr>
                {amountPaid > 0 && (
                  <>
                    <tr>
                      <td className="px-4 py-1 text-sm text-gray-600">Amount Paid:</td>
                      <td className="px-4 py-1 text-right text-sm text-green-600">{formatCurrency(amountPaid)}</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-2 font-semibold">Amount Due:</td>
                      <td className="px-4 py-2 text-right font-bold text-lg">
                        <span className={amountDue > 0 ? "text-orange-600" : "text-green-600"}>
                          {formatCurrency(amountDue)}
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">Payment is due within {invoice.terms_days || 30} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}