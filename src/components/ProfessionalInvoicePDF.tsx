"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Download, FileText, QrCode, Building2, User, MapPin, Phone, Mail } from "lucide-react";
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

export interface ProfessionalInvoicePDFRef {
  generatePDF: () => void;
}

export const ProfessionalInvoicePDF = forwardRef<ProfessionalInvoicePDFRef, ProfessionalInvoicePDFProps>(({ 
  invoice, 
  customer, 
  items,
  showActions = true
}, ref) => {
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

  // PDF generation using jsPDF + html2canvas
  const generatePDF = useCallback(async () => {
    if (!invoiceRef.current) {
      console.error("Invoice ref not available for PDF generation.");
      alert('Could not generate PDF. The invoice content is not ready.');
      return;
    }

    try {
      // Hide action buttons during PDF generation
      const actionButtons = invoiceRef.current.querySelectorAll('.no-print');
      actionButtons.forEach(el => (el as HTMLElement).style.display = 'none');

      // Ensure images inside the invoice are fully loaded
      const images = Array.from(invoiceRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(images.map(img => {
        return new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const onLoad = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onLoad); resolve(); };
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onLoad);
        });
      }));

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.scrollWidth,
        height: invoiceRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          try {
            const style = clonedDoc.createElement('style');
            style.setAttribute('data-export-fallback', '');
            style.textContent = `
              [data-export-root], [data-export-root] * {
                color: #111827 !important; /* text-gray-900 */
                border-color: #e5e7eb !important; /* gray-200 */
                box-shadow: none !important;
                background-image: none !important;
                /* Replace unsupported color functions */
                --tw-gradient-from: #ffffff !important;
                --tw-gradient-to: #ffffff !important;
                --tw-gradient-stops: #ffffff !important;
              }
              [data-export-root] {
                background-color: #ffffff !important;
              }
              [data-export-root] .bg-white { background-color: #ffffff !important; }
              [data-export-root] .bg-gray-50 { background-color: #f9fafb !important; }
              [data-export-root] .text-gray-900 { color: #111827 !important; }
              [data-export-root] .text-gray-700 { color: #374151 !important; }
              [data-export-root] .text-gray-600 { color: #4b5563 !important; }
              [data-export-root] .text-gray-500 { color: #6b7280 !important; }
              [data-export-root] .border-gray-200 { border-color: #e5e7eb !important; }
              /* Force any lab()/oklch()/color() to fallback via filter */
              [data-export-root] * {
                -webkit-filter: none !important;
                        filter: none !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          } catch {}
        }
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
    } finally {
      // Ensure action buttons are restored on error
      if (invoiceRef.current) {
        const actionButtons = invoiceRef.current.querySelectorAll('.no-print');
        actionButtons.forEach(el => (el as HTMLElement).style.display = '');
      }
    }
  }, [invoice, invoiceDate]);

  useImperativeHandle(ref, () => ({
    generatePDF,
  }));

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
            <span className="text-xs">Print</span>
          </Button>
          <Button 
            onClick={generatePDF}
            data-pdf-download
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs">Download PDF</span>
          </Button>
        </div>
      )}

      {/* Simplified Invoice Template */}
      <div ref={invoiceRef} className="bg-white" data-export-root>
        <div className="bg-white p-6 max-w-4xl mx-auto font-sans relative">
          {/* Watermark */}
          <img
            src="/jaykay_logo.png"
            alt=""
            className="pointer-events-none select-none opacity-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-auto"
            crossOrigin="anonymous"
            aria-hidden="true"
          />
          {/* Print Styles */}
          <style jsx>{`
            @media print {
              @page {
                margin: 0.4in;
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
          <div className="border-b border-gray-200 pb-6 mb-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src="/JK_LogoINV.jpg" 
                    alt="Jay Kay Digital Press Logo" 
                    className="w-26 h-28 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                {/* Company Info */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">JAY KAY DIGITAL PRESS</h1>
                  <p className="text-xs text-gray-600 mb-1">Professional Printing & Digital Services</p>
                  <p className="text-xs text-gray-600 mb-1">Freetown, Sierra Leone</p>
                  <p className="text-xs text-gray-600 mb-1">Tel: +232 34 788711 | +232 30 741062</p>
                  <p className="text-xs text-gray-600">Email: info@jaykaydigitalpress.com</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">INVOICE</h2>
                  <div className="space-y-1 text-xs">
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
          <div className="mb-6 flex justify-between items-start relative z-10">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Bill To</h3>
              {customer ? (
                <div className="text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">{customer.business_name}</p>
                  {customer.contact_person && (
                    <p className="text-gray-600 text-xs">{customer.contact_person}</p>
                  )}
                  {customer.address && (
                    <p className="text-gray-600 text-xs">{customer.address}</p>
                  )}
                  {customer.city && (
                    <p className="text-gray-600 text-xs">{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ")}</p>
                  )}
                  {customer.country && (
                    <p className="text-gray-600 text-xs">{customer.country}</p>
                  )}
                  {customer.phone && (
                    <p className="text-gray-600 text-xs">Phone: {customer.phone}</p>
                  )}
                  {customer.email && (
                    <p className="text-gray-600 text-xs">Email: {customer.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">Customer information not available</p>
              )}
            </div>
            
            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 ml-6">
                <div className="text-center mb-1">
                  <QrCode className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-600 font-medium">Invoice Details</p>
                </div>
                <img 
                  src={qrCodeDataUrl} 
                  alt="Invoice QR Code" 
                  className="w-20 h-20 mx-auto"
                />
                <p className="text-[10px] text-gray-500 text-center mt-1">
                  #{invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`}
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-6 relative z-10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-[18%]">Job No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-[37%]">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 w-[15%]">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 w-[15%]">Unit Price</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 w-[15%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      {item.job_no || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      <div>{item.description}</div>
                      {item.notes && <div className="text-gray-500 text-[10px] mt-1">{item.notes}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-xs">{item.quantity.toLocaleString()}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-xs">{formatCurrency(item.unit_price)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-xs font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-500 text-xs">
                      No items found on this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full max-w-[200px] relative z-10">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="px-3 py-1 text-xs text-gray-600">Subtotal:</td>
                  <td className="px-3 py-1 text-right text-xs">{formatCurrency(subtotal)}</td>
                </tr>
                {tax > 0 && (
                  <tr>
                    <td className="px-3 py-1 text-xs text-gray-600">
                      Tax {taxRate > 0 ? `(${taxRate}%)` : ''}:
                    </td>
                    <td className="px-3 py-1 text-right text-xs">{formatCurrency(tax)}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr>
                    <td className="px-3 py-1 text-xs text-gray-600">Discount:</td>
                    <td className="px-3 py-1 text-right text-xs">-{formatCurrency(discount)}</td>
                  </tr>
                )}
                <tr className="border-t border-gray-300">
                  <td className="px-3 py-1 font-semibold text-xs">Total:</td>
                  <td className="px-3 py-1 text-right font-semibold text-xs">{formatCurrency(total)}</td>
                </tr>
                {amountPaid > 0 && (
                  <>
                    <tr>
                      <td className="px-3 py-1 text-xs text-gray-600">Amount Paid:</td>
                      <td className="px-3 py-1 text-right text-xs text-green-600">{formatCurrency(amountPaid)}</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-3 py-1 font-semibold text-xs">Amount Due:</td>
                      <td className="px-3 py-1 text-right font-semibold text-xs">
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
            <div className="mt-6 pt-4 border-t border-gray-300 relative z-10">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-gray-700 text-xs whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}

        </div>
      </div>
    </div>
  );
});

ProfessionalInvoicePDF.displayName = "ProfessionalInvoicePDF";