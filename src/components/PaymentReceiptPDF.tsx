"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Download, FileText, QrCode, Building2, User, MapPin, Phone, Mail, Receipt } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import QRCode from "qrcode";

interface PaymentData {
  id: string;
  payment_number: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  invoice_no: string;
  customer_human_id: string;
  payment_status: string;
  created_at: string;
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

interface InvoiceInfo {
  id: string;
  invoiceNo: string;
  total: number;
  amountPaid?: number;
  amountDue?: number;
}

interface PaymentReceiptPDFProps {
  payment: PaymentData;
  customer?: Customer;
  invoice?: InvoiceInfo;
  showActions?: boolean;
}

export interface PaymentReceiptPDFRef {
  generatePDF: () => void;
}

export const PaymentReceiptPDF = forwardRef<PaymentReceiptPDFRef, PaymentReceiptPDFProps>(({ 
  payment, 
  customer, 
  invoice,
  showActions = true
}, ref) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Calculate receipt details
  const paymentDate = new Date(payment.payment_date);
  const createdDate = new Date(payment.created_at);
  const currency = 'SLL'; // Default currency

  // PDF generation using jsPDF + html2canvas
  const generatePDF = useCallback(async () => {
    if (!receiptRef.current) {
      console.error("Receipt ref not available for PDF generation.");
      alert('Could not generate PDF. The receipt content is not ready.');
      return;
    }

    try {
      // Hide action buttons during PDF generation
      const actionButtons = receiptRef.current.querySelectorAll('.no-print');
      actionButtons.forEach(el => (el as HTMLElement).style.display = 'none');

      // Ensure images inside the receipt are fully loaded
      const images = Array.from(receiptRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(images.map(img => {
        return new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const onLoad = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onLoad); resolve(); };
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onLoad);
        });
      }));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: receiptRef.current.scrollWidth,
        height: receiptRef.current.scrollHeight,
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
      
      const fileName = `Receipt_${payment.payment_number}_${formatDate(paymentDate.toISOString()).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      // Show action buttons again
      actionButtons.forEach(el => (el as HTMLElement).style.display = '');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Ensure action buttons are restored on error
      if (receiptRef.current) {
        const actionButtons = receiptRef.current.querySelectorAll('.no-print');
        actionButtons.forEach(el => (el as HTMLElement).style.display = '');
      }
    }
  }, [payment, paymentDate]);

  useImperativeHandle(ref, () => ({
    generatePDF,
  }));

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const receiptInfo = {
          payment_id: payment.id,
          payment_number: payment.payment_number,
          amount: formatCurrency(payment.amount),
          payment_date: formatDate(paymentDate.toISOString()),
          company: "Jay Kay Digital Press"
        };
        
        const qrData = `Receipt: ${receiptInfo.payment_number}\nAmount: ${receiptInfo.amount}\nDate: ${receiptInfo.payment_date}\nCompany: ${receiptInfo.company}`;
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
  }, [payment, paymentDate]);

  // Print function using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt_${payment.payment_number}`,
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
            variant="default"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      )}

      {/* Receipt Document */}
      <div 
        ref={receiptRef} 
        className="bg-white p-6 max-w-2xl mx-auto font-sans border border-gray-200"
        data-export-root=""
      >
 {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-4 relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src="/JK_LogoINV.jpg" 
                    alt="Jay Kay Digital Press Logo" 
                    className="w-16 h-16 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Jay Kay Digital Press</h1>
                  <p className="text-xs text-gray-600">Professional Printing Services</p>
                </div>
              </div>
              
              <div className="space-y-0.5 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Building2 className="h-3 w-3" />
                  <span>St. Edward School Avenue by Caritas, Freetown, Sierra Leone</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>+232 34 788 711</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>info@jaykaydigitalpress.com</span>
                </div>
              </div>
            </div>

            {/* Receipt Info */}
            <div className="text-right space-y-0.5">
              <h2 className="text-2xl font-bold text-red-600">RECEIPT</h2>
              <div className="space-y-0.5 text-xs">
                <div><span className="font-medium">Receipt #:</span> {payment.payment_number}</div>
                <div><span className="font-medium">Date:</span> {formatDate(paymentDate.toISOString())}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {payment.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Customer Information */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <User className="h-4 w-4 mr-1.5 text-gray-600" />
              Payment From
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
              <div className="font-medium text-gray-900 text-sm">{customer?.business_name || payment.customer_human_id}</div>
              {customer?.contact_person && (
                <div className="text-gray-600 text-xs">Attn: {customer.contact_person}</div>
              )}
              {customer?.address && (
                <div className="text-gray-600 text-xs">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      {customer.address}
                      {customer.city && <div>{customer.city}, {customer.state} {customer.zip_code}</div>}
                    </div>
                  </div>
                </div>
              )}
              {customer?.email && (
                <div className="text-gray-600 text-xs flex items-center space-x-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer?.phone && (
                <div className="text-gray-600 text-xs flex items-center space-x-1.5">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            {qrCodeDataUrl && (
              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <QrCode className="h-3 w-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Receipt QR Code</span>
                </div>
                <img 
                  src={qrCodeDataUrl} 
                  alt="Receipt QR Code" 
                  className="w-20 h-20 mx-auto border rounded-md"
                />
                <p className="text-xs text-gray-500">Scan for receipt verification</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{payment.invoice_no}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{payment.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium">{formatDate(paymentDate.toISOString())}</span>
              </div>
              {payment.reference_number && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Reference Number:</span>
                  <span className="font-medium">{payment.reference_number}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-center bg-white rounded-md p-3 border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">Amount Received</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
              
              {invoice && (
                <div className="text-center bg-gray-50 rounded-md p-2.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Invoice Total:</span>
                      <span className="font-medium">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Balance Due:</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.amountDue || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {payment.notes && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs">
                <span className="font-medium text-gray-700">Notes: </span>
                <span className="text-gray-600">{payment.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <div className="text-xs text-gray-600 space-y-1.5">
            <p className="font-medium">Thank you for your payment!</p>
            <p>This receipt serves as proof of payment. Please retain for your records.</p>
            <p>For questions about this payment, please contact us at info@jaykaydigitalpress.com</p>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Receipt generated on {formatDate(createdDate.toISOString())} | Jay Kay Digital Press © 2025
          </div>
        </div>
      </div>
    </div>
  );
});

PaymentReceiptPDF.displayName = 'PaymentReceiptPDF';

export default PaymentReceiptPDF;