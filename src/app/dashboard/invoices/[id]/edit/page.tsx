"use client";

import DashboardLayout from "@/components/DashboardLayout";
import PaymentReceiptPDF from "@/components/PaymentReceiptPDF";
import ProtectedDashboard from "@/components/ProtectedDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrency,
  transformFirebaseTimestamp,
} from "@/lib/invoice-utils";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Eye,
  Loader2,
  Plus,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";

interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  notes?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

function InvoiceEditContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    notes: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    issueDate: "",
    dueDate: "",
    status: "draft",
    notes: "",
    items: [] as InvoiceLineItem[],
    tax: 0,
  });

  // Fetch payments for this invoice
  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("applied_to_invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
      } else {
        setPayments(data || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  // Record a new payment
  const recordPayment = async () => {
    if (!invoice || !paymentForm.amount) {
      setError("Please fill in the payment amount");
      return;
    }

    try {
      setIsSaving(true);
      setError(null); // Clear any previous errors

      // Validate payment amount
      let paymentAmount = parseFloat(paymentForm.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        setError("Please enter a valid payment amount");
        return;
      }

      // Fix precision issues by rounding to 2 decimal places
      paymentAmount = Math.round(paymentAmount * 100) / 100;

      // Generate payment number
      const paymentNumber = `PAY-${Date.now()}`;

      // Get customer data for proper customer_id and ensure foreign key constraints
      const { data: invoiceData, error: fetchError } = await supabase
        .from("invoices")
        .select(
          `
          customer_id, 
          customerName, 
          invoiceNo,
          customers!inner (
            id,
            human_id,
            business_name
          )
        `,
        )
        .eq("id", invoiceId)
        .single();

      if (fetchError) {
        console.error("Error fetching invoice data:", {
          error: fetchError,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
        });
        setError(`Failed to fetch invoice data: ${fetchError.message}`);
        return;
      }

      if (!invoiceData) {
        console.error("No invoice data found for ID:", invoiceId);
        setError("Invoice not found");
        return;
      }

      // Validate that we have the required foreign key references
      if (!invoiceData.invoiceNo) {
        console.error("Invoice has no invoiceNo for foreign key constraint");
        setError("Invoice number is missing - cannot record payment");
        return;
      }

      if (!invoiceData.customers || invoiceData.customers.length === 0 || !invoiceData.customers[0].human_id) {
        console.error("Customer has no human_id for foreign key constraint");
        setError("Customer ID is missing - cannot record payment");
        return;
      }

      // Validate payment method
      const validPaymentMethods = [
        "cash",
        "bank_transfer",
        "mobile_money",
        "card",
        "cheque",
        "credit",
      ];
      if (!validPaymentMethods.includes(paymentForm.payment_method)) {
        setError("Please select a valid payment method");
        return;
      }

      // Prepare payment data matching the exact table structure
      const paymentData = {
        payment_number: paymentNumber,
        amount: paymentAmount, // numeric(10,2) - already validated as number
        payment_method: paymentForm.payment_method as
          | "cash"
          | "bank_transfer"
          | "mobile_money"
          | "card"
          | "cheque"
          | "credit",
        payment_date: paymentForm.payment_date, // date - should be in YYYY-MM-DD format
        reference_number: paymentForm.reference_number?.trim() || null, // varchar(100) nullable
        notes: paymentForm.notes?.trim() || null, // text nullable
        received_by: null, // uuid nullable - we don't have user context here
        // created_at and updated_at will be set by database defaults
        invoice_no: invoiceData.invoiceNo, // varchar(50) NOT NULL - foreign key to invoices.invoiceNo
        customer_human_id: invoiceData.customers[0].human_id, // varchar(20) NOT NULL - foreign key to customers.human_id
        payment_status: "completed" as const, // varchar(20) with constraint check
        transaction_id: null, // varchar(100) nullable
        payment_gateway: null, // varchar(50) nullable
        customer_id: invoiceData.customer_id, // uuid nullable - foreign key to customers.id
        applied_to_invoice_id: invoiceId, // uuid nullable - foreign key to invoices.id
        overpayment_amount: 0, // numeric(10,2) default 0
        refund_amount: 0, // numeric(10,2) default 0
        fees: 0, // numeric(10,2) default 0
      };

      // Validate each required field against table constraints
      const validationErrors = [];
      if (!paymentData.payment_number)
        validationErrors.push("payment_number is required (varchar(20))");
      if (!paymentData.amount || paymentData.amount <= 0)
        validationErrors.push("amount must be positive (numeric(10,2))");
      if (!paymentData.payment_method)
        validationErrors.push("payment_method is required (enum)");
      if (!paymentData.payment_date)
        validationErrors.push("payment_date is required (date)");
      if (!paymentData.invoice_no)
        validationErrors.push(
          "invoice_no is required (varchar(50)) - foreign key constraint",
        );
      if (!paymentData.customer_human_id)
        validationErrors.push(
          "customer_human_id is required (varchar(20)) - foreign key constraint",
        );

      // Validate data types and formats
      if (
        paymentData.payment_date &&
        !/^\d{4}-\d{2}-\d{2}$/.test(paymentData.payment_date)
      ) {
        validationErrors.push("payment_date must be in YYYY-MM-DD format");
      }

      if (validationErrors.length > 0) {
        console.error("Payment data validation failed:", validationErrors);
        setError(`Payment validation failed: ${validationErrors.join(", ")}`);
        return;
      }

      console.log(
        "Payment data validation passed. Data structure matches table definition:",
        {
          ...paymentData,
          amount_type: typeof paymentData.amount,
          date_format: paymentData.payment_date,
          foreign_keys: {
            invoice_no: paymentData.invoice_no,
            customer_human_id: paymentData.customer_human_id,
            customer_id: paymentData.customer_id,
            applied_to_invoice_id: paymentData.applied_to_invoice_id,
          },
        },
      );

      // First test if we can access the payments table
      console.log("Testing payments table access...");
      try {
        const { data: testData, error: testError } = await supabase
          .from("payments")
          .select("id")
          .limit(1);

        console.log("Payments table test result:", {
          canRead: !testError,
          error: testError,
          dataCount: testData?.length || 0,
        });

        if (testError) {
          console.error("Cannot access payments table:", testError);
          setError(
            `Database access error: ${(testError as any)?.message || "Unknown error"}`,
          );
          return;
        }
      } catch (accessException) {
        console.error("Exception testing table access:", accessException);
        setError("Cannot access payments table");
        return;
      }

      // Try the insert with additional debugging
      console.log("About to attempt Supabase insert...");

      let insertResult;
      try {
        insertResult = await supabase
          .from("payments")
          .insert([paymentData])
          .select()
          .single();
      } catch (insertException: any) {
        console.error("Exception during insert:", {
          exception: insertException,
          exceptionType: typeof insertException,
          exceptionMessage: insertException?.message,
          exceptionStack: insertException?.stack,
        });
        setError(
          `Insert operation failed: ${insertException?.message || "Unknown exception"}`,
        );
        return;
      }

      const { data: insertedPayment, error: insertError } = insertResult;

      console.log("Insert result received:", {
        hasData: !!insertedPayment,
        hasError: !!insertError,
        dataType: typeof insertedPayment,
        errorType: typeof insertError,
      });

      if (insertError) {
        // Try multiple approaches to extract error information
        const errorInfo = {
          hasError: !!insertError,
          errorType: typeof insertError,
          errorConstructor: insertError?.constructor?.name,
          errorToString: String(insertError),
          errorMessage: insertError?.message || "No message property",
          errorDetails: insertError?.details || "No details property",
          errorHint: insertError?.hint || "No hint property",
          errorCode: insertError?.code || "No code property",
          errorJson: (() => {
            try {
              return JSON.stringify(
                insertError,
                Object.getOwnPropertyNames(insertError),
              );
            } catch {
              return "JSON stringify failed";
            }
          })(),
        };

        console.error("Supabase insert error detailed:", errorInfo);
        console.error("Raw error object:", insertError);
        console.error("Payment data that failed:", paymentData);

        // Extract the actual error message
        let errorMessage = "Database error";
        if (insertError?.message) {
          errorMessage = insertError.message;
        } else if (typeof insertError === "string") {
          errorMessage = insertError;
        } else if (
          insertError?.toString &&
          insertError.toString() !== "[object Object]"
        ) {
          errorMessage = insertError.toString();
        }

        setError(`Failed to record payment: ${errorMessage}`);
        return;
      }

      if (!insertedPayment) {
        console.error("Payment insert succeeded but no data returned");
        setError("Payment recorded but confirmation failed");
        return;
      }

      console.log("Payment successfully recorded:", insertedPayment);

      // Fix precision issues in calculations
      const previousPaymentsTotal =
        Math.round(
          payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) * 100,
        ) / 100;
      const newTotalPaid =
        Math.round((previousPaymentsTotal + paymentAmount) * 100) / 100;
      const newAmountDue =
        Math.round((invoice.total - newTotalPaid) * 100) / 100;

      // Store payment data for receipt generation
      const receiptData = {
        ...insertedPayment,
        customer: invoiceData.customers,
        invoice: {
          id: invoiceId,
          invoiceNo: invoiceData.invoiceNo,
          total: invoice.total,
          amountPaid: newTotalPaid,
          amountDue: newAmountDue,
        },
      };
      setLastPaymentData(receiptData);

      // Update invoice amountPaid
      const totalPaid = newTotalPaid;
      const amountDue = newAmountDue;

      console.log("Updating invoice with payment totals:", {
        invoiceId,
        totalPaid,
        amountDue,
        newStatus:
          amountDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : "pending",
      });

      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          amountPaid: totalPaid,
          amountDue: amountDue,
          payment_status:
            amountDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("Error updating invoice after payment:", {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        // Don't return here as payment was successful, just log the warning
        console.warn("Payment recorded successfully but invoice update failed");
      }

      // Reset form and refresh data
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        reference_number: "",
        notes: "",
      });
      setShowPaymentForm(false);

      // Refresh data
      await Promise.all([fetchPayments(), fetchInvoice()]);

      // Show payment receipt
      setShowPaymentReceipt(true);

      console.log("Payment recording completed successfully");
    } catch (error) {
      console.error("Unexpected error in recordPayment:", {
        error: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        message:
          error instanceof Error ? error.message : "Non-Error object thrown",
        stack: error instanceof Error ? error.stack : undefined,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unexpected error occurred while recording the payment";

      setError(`Failed to record payment: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load invoice data
  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch invoice data
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          customers (
            id,
            business_name,
            contact_person,
            email,
            phone,
            address,
            city,
            state,
            zip_code
          )
        `,
        )
        .eq("id", invoiceId)
        .single();

      if (error) throw error;

      // Fetch invoice items separately using the API endpoint
      const itemsResponse = await fetch("/api/invoice-items/" + invoiceId);
      const itemsData = itemsResponse.ok ? await itemsResponse.json() : [];

      if (!itemsResponse.ok) {
        console.warn(
          "Failed to fetch invoice items:",
          itemsResponse.statusText,
        );
      }

      if (data) {
        // Parse Firebase timestamps
        const issueDateString = transformFirebaseTimestamp(
          data.issueDate as never,
        );
        const dueDateString = transformFirebaseTimestamp(data.dueDate as never);

        const issueDate = issueDateString
          ? new Date(issueDateString)
          : new Date();
        const dueDate = dueDateString ? new Date(dueDateString) : new Date();

        // Transform items from API to match our interface
        const items: InvoiceLineItem[] = itemsData.map(
          (item: {
            id: string;
            description?: string;
            quantity?: number;
            unit_price?: number;
            total_price?: number;
          }) => ({
            id: item.id,
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 0,
            total:
              item.total_price || (item.quantity || 1) * (item.unit_price || 0),
          }),
        );

        const invoiceData: InvoiceData = {
          id: data.id,
          invoiceNo: data.invoiceNo || "INV-000",
          customerName:
            data.customers?.business_name || data.customerName || "",
          customerEmail: data.customers?.email || "",
          customerPhone: data.customers?.phone || "",
          issueDate: issueDate,
          dueDate: dueDate,
          status: data.payment_status || data.status || "draft",
          notes: data.notes || "",
          items: items,
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.total || data.amountDue || 0,
        };

        setInvoice(invoiceData);

        // Set form data
        setFormData({
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail || "",
          customerPhone: invoiceData.customerPhone || "",
          issueDate: invoiceData.issueDate.toISOString().split("T")[0],
          dueDate: invoiceData.dueDate.toISOString().split("T")[0],
          status: invoiceData.status,
          notes: invoiceData.notes || "",
          items: invoiceData.items,
          tax: invoiceData.tax,
        });
      }

      // Fetch existing payments for this invoice
      await fetchPayments();
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setError("Failed to load invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      if (invoice) {
        try {
          const qrData = `Invoice: ${invoice.invoiceNo}\nAmount: ${formatCurrency(invoice.total)}\nCustomer: ${invoice.customerName}`;
          const qrCode = await QRCodeLib.toDataURL(qrData, {
            width: 128,
            margin: 2,
          });
          setQrCodeDataUrl(qrCode);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };

    generateQR();
  }, [invoice]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-calculate total for line items
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Add new item
  const addItem = () => {
    const newItem: InvoiceLineItem = {
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * formData.tax) / 100;
  const total = subtotal + taxAmount;

  // Save invoice
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Prepare invoice data
      const invoiceData = {
        customerName: formData.customerName,
        issueDate: { _seconds: new Date(formData.issueDate).getTime() / 1000 },
        dueDate: { _seconds: new Date(formData.dueDate).getTime() / 1000 },
        status: formData.status,
        notes: formData.notes,
        subtotal: subtotal,
        tax: taxAmount,
        total: total,
        amountDue: total,
        currency: "SLL",
        updatedAt: { _seconds: Date.now() / 1000 },
      };

      // Update invoice using Supabase
      const { error: updateError } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", invoiceId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update invoice items using the API endpoint
      try {
        const itemsToSave = formData.items.map((item) => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.total,
          job_no: null, // Can be linked to jobs later if needed
        }));

        const itemsResponse = await fetch(`/api/invoice-items/${invoiceId}`, {
          method: "PUT", // Update all items
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemsToSave),
        });

        if (!itemsResponse.ok) {
          const errorText = await itemsResponse.text();
          throw new Error(`Failed to save invoice items: ${errorText}`);
        }
      } catch (itemsError) {
        console.error("Error saving invoice items:", itemsError);
        // Continue even if items fail - at least the invoice is saved
      }

      // Redirect back to invoice detail page
      router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (error) {
      console.error("Error saving invoice:", error);
      setError("Failed to save invoice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading invoice...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !invoice) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Invoice
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild>
              <Link href="/dashboard/invoices">Back to Invoices</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Edit Invoice
            </h1>
            <p className="text-muted-foreground mt-1">
              Update invoice details and line items
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Basic invoice information and customer details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        handleInputChange("customerName", e.target.value)
                      }
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        handleInputChange("customerEmail", e.target.value)
                      }
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) =>
                        handleInputChange("issueDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes or instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Line Items
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add products or services to this invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Item description"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Total</Label>
                          <div className="text-lg font-semibold">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>
                        No items added yet. Click &quot;Add Item&quot; to get
                        started.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Invoice Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax}
                    onChange={(e) =>
                      handleInputChange("tax", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div className="pt-4">
                  <Badge variant="outline" className="w-full justify-center">
                    {formData.status.charAt(0).toUpperCase() +
                      formData.status.slice(1)}
                  </Badge>
                </div>

                {/* QR Code */}
                {qrCodeDataUrl && (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <QrCode className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-600">
                          Invoice QR Code
                        </span>
                      </div>
                      <img
                        src={qrCodeDataUrl}
                        alt="Invoice QR Code"
                        className="w-24 h-24 mx-auto border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Scan for invoice details
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Payments</span>
                  </div>
                  <Button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(invoice?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        Math.round(
                          payments.reduce(
                            (sum, p) => sum + parseFloat(p.amount),
                            0,
                          ) * 100,
                        ) / 100,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Amount Due:</span>
                    <span className="text-red-600">
                      {formatCurrency(
                        Math.round(
                          ((invoice?.total || 0) -
                            payments.reduce(
                              (sum, p) => sum + parseFloat(p.amount),
                              0,
                            )) *
                            100,
                        ) / 100,
                      )}
                    </span>
                  </div>
                </div>

                {/* Payment Form */}
                {showPaymentForm && (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <Label htmlFor="payment_amount">Amount *</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select
                        value={paymentForm.payment_method}
                        onValueChange={(value) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            payment_method: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="mobile_money">
                            Mobile Money
                          </SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            payment_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference_number">Reference Number</Label>
                      <Input
                        id="reference_number"
                        placeholder="Transaction ID, Check #, etc."
                        value={paymentForm.reference_number}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            reference_number: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_notes">Notes</Label>
                      <Textarea
                        id="payment_notes"
                        placeholder="Payment notes..."
                        value={paymentForm.notes}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={2}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={recordPayment}
                        disabled={!paymentForm.amount || isSaving}
                        size="sm"
                        className="flex-1"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Record Payment
                      </Button>
                      <Button
                        onClick={() => setShowPaymentForm(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {payments.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-medium text-sm">Payment History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex justify-between items-start text-xs p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-muted-foreground">
                              {payment.payment_method} •{" "}
                              {new Date(
                                payment.payment_date,
                              ).toLocaleDateString()}
                            </div>
                            {payment.reference_number && (
                              <div className="text-muted-foreground">
                                Ref: {payment.reference_number}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData.customerName}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/invoices/${invoiceId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Invoice
                  </Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/invoices">Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Invoice Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-medium">{invoice?.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{invoice?.issueDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{formData.items.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Receipt Dialog */}
        <Dialog open={showPaymentReceipt} onOpenChange={setShowPaymentReceipt}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
              <DialogDescription>
                Payment has been successfully recorded. You can download or
                print the receipt below.
              </DialogDescription>
            </DialogHeader>

            {lastPaymentData && (
              <PaymentReceiptPDF
                payment={lastPaymentData}
                customer={lastPaymentData.customer}
                invoice={lastPaymentData.invoice}
                showActions={true}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPaymentReceipt(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceEditPage() {
  return (
    <ProtectedDashboard allowedRoles={["super_admin", "admin", "manager"]}>
      <InvoiceEditContent />
    </ProtectedDashboard>
  );
}
