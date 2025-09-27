"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { recordPaymentWithNotification } from "@/lib/hooks/usePaymentNotifications";
import PaymentReceiptPDF from "@/components/PaymentReceiptPDF";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface Payment extends PaymentRow {
  invoices?: {
    invoiceNo: string | null;
    total?: number | null;
    amountPaid?: number | null;
    amountDue?: number | null;
  } | null;
  customers?: { business_name: string | null } | null;
}

interface PaymentStats {
  totalReceived: number;
  thisMonth: number;
  paymentsCount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    thisMonth: 0,
    paymentsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_method: "" as PaymentMethod | "",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    notes: "",
    invoice_no: "",
    customer_human_id: "",
    payment_number: "",
    received_by: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          invoices!fk_payments_invoice_no(invoiceNo, total, amountPaid, amountDue),
          customers!fk_payments_customer_human_id(business_name)
        `,
        )
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", {
        message:
          error instanceof Error
            ? error.message
            : "Unknown payments fetch error",
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        context: "fetchPayments",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      // Get payment statistics
      const { data: allPayments, error } = await supabase
        .from("payments")
        .select("amount, payment_date");

      if (error) throw error;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const stats = (allPayments || []).reduce(
        (acc, payment) => {
          const paymentDate = new Date(payment.payment_date);

          acc.totalReceived += payment.amount;
          acc.paymentsCount += 1;

          if (
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear
          ) {
            acc.thisMonth += payment.amount;
          }

          return acc;
        },
        {
          totalReceived: 0,
          thisMonth: 0,
          paymentsCount: 0,
        },
      );

      setStats(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  const handleAddPayment = async () => {
    try {
      if (
        !newPayment.payment_method ||
        !newPayment.customer_human_id ||
        !newPayment.invoice_no ||
        !newPayment.payment_number
      ) {
        alert("Please fill in all required fields");
        return;
      }

      // Fix precision issues by rounding to 2 decimal places
      const paymentAmount =
        Math.round(parseFloat(newPayment.amount) * 100) / 100;

      // Use the recordPaymentWithNotification function instead of direct insert
      const result = await recordPaymentWithNotification({
        invoice_no: newPayment.invoice_no,
        customer_human_id: newPayment.customer_human_id,
        amount: paymentAmount,
        payment_method: newPayment.payment_method as
          | "cash"
          | "bank_transfer"
          | "mobile_money"
          | "card"
          | "cheque"
          | "credit",
        payment_date: newPayment.payment_date,
        notes: newPayment.notes || undefined,
        received_by: newPayment.received_by || undefined,
        reference_number: newPayment.reference_number || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to record payment");
      }

      setIsAddDialogOpen(false);
      setNewPayment({
        amount: "",
        payment_method: "",
        payment_date: new Date().toISOString().split("T")[0],
        reference_number: "",
        notes: "",
        invoice_no: "",
        customer_human_id: "",
        payment_number: "",
        received_by: "",
      });

      fetchPayments();
      fetchPaymentStats();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Failed to add payment. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency: "SLL",
    }).format(amount);
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const variants = {
      cash: "bg-green-100 text-green-800 border-green-200",
      card: "bg-blue-100 text-blue-800 border-blue-200",
      bank_transfer: "bg-purple-100 text-purple-800 border-purple-200",
      mobile_money: "bg-orange-100 text-orange-800 border-orange-200",
      cheque: "bg-yellow-100 text-yellow-800 border-yellow-200",
      credit: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge variant="outline" className={variants[method] || variants.cash}>
        <span className="capitalize">{method.replace("_", " ")}</span>
      </Badge>
    );
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount.toString().includes(searchTerm) ||
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      methodFilter === "all" || payment.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  // Handle view payment
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  // Handle view payment receipt
  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptDialogOpen(true);
  };

  // Handle edit payment
  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewPayment({
      amount: payment.amount.toString(),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
      invoice_no: payment.invoice_no,
      customer_human_id: payment.customer_human_id,
      payment_number: payment.payment_number,
      received_by: payment.received_by || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete payment
  const handleDeletePayment = async (paymentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this payment? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      // Refresh the payments list
      await fetchPayments();
      await fetchPaymentStats();

      console.log("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle save payment (for both add and edit)
  const handleSavePayment = async () => {
    try {
      // Validate required fields
      if (
        !newPayment.amount ||
        !newPayment.payment_method ||
        !newPayment.invoice_no ||
        !newPayment.customer_human_id ||
        !newPayment.payment_number
      ) {
        alert("Please fill in all required fields");
        return;
      }

      // Fix precision issues by rounding to 2 decimal places
      const paymentAmount =
        Math.round(parseFloat(newPayment.amount) * 100) / 100;

      if (isEditDialogOpen && selectedPayment) {
        // Update existing payment
        const paymentData = {
          amount: paymentAmount,
          payment_method: newPayment.payment_method,
          payment_date: newPayment.payment_date,
          reference_number: newPayment.reference_number || null,
          notes: newPayment.notes || null,
          invoice_no: newPayment.invoice_no,
          customer_human_id: newPayment.customer_human_id,
          payment_number: newPayment.payment_number,
          received_by: newPayment.received_by || null,
          payment_status: "completed",
        };

        const result = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", selectedPayment.id);

        if (result.error) throw result.error;
      } else {
        // Add new payment using recordPaymentWithNotification
        const result = await recordPaymentWithNotification({
          invoice_no: newPayment.invoice_no,
          customer_human_id: newPayment.customer_human_id,
          amount: paymentAmount,
          payment_method: newPayment.payment_method as
            | "cash"
            | "bank_transfer"
            | "mobile_money"
            | "card"
            | "cheque"
            | "credit",
          payment_date: newPayment.payment_date,
          notes: newPayment.notes || undefined,
          received_by: newPayment.received_by || undefined,
          reference_number: newPayment.reference_number || undefined,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to record payment");
        }
      }

      // Reset form and close dialogs
      setNewPayment({
        amount: "",
        payment_method: "" as PaymentMethod | "",
        payment_date: new Date().toISOString().split("T")[0],
        reference_number: "",
        notes: "",
        invoice_no: "",
        customer_human_id: "",
        payment_number: "",
        received_by: "",
      });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedPayment(null);

      // Refresh the payments list
      await fetchPayments();
      await fetchPaymentStats();

      console.log(
        isEditDialogOpen
          ? "Payment updated successfully"
          : "Payment added successfully",
      );
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Failed to save payment. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage all payments and transactions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/payments/invoices")}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Invoice Management</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Add a new payment record to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="payment_number">Payment Number *</Label>
                  <Input
                    id="payment_number"
                    placeholder="PAY-001"
                    value={newPayment.payment_number}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        payment_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={newPayment.payment_method}
                    onValueChange={(value: PaymentMethod) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        payment_method: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer_human_id">Customer ID *</Label>
                  <Input
                    id="customer_human_id"
                    placeholder="Customer ID"
                    value={newPayment.customer_human_id}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        customer_human_id: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_no">Invoice Number *</Label>
                  <Input
                    id="invoice_no"
                    placeholder="INV-001"
                    value={newPayment.invoice_no}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        invoice_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={newPayment.payment_date}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
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
                    placeholder="Optional reference number"
                    value={newPayment.reference_number}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        reference_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="received_by">Received By</Label>
                  <Input
                    id="received_by"
                    placeholder="Staff member name"
                    value={newPayment.received_by}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        received_by: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Optional notes"
                    value={newPayment.notes}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddPayment} className="flex-1">
                    Record Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalReceived)}
            </div>
            <p className="text-xs text-gray-500">
              {stats.paymentsCount} payments total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.thisMonth)}
            </div>
            <p className="text-xs text-gray-500">Current month total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Payment
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                stats.paymentsCount > 0
                  ? stats.totalReceived / stats.paymentsCount
                  : 0,
              )}
            </div>
            <p className="text-xs text-gray-500">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage all payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Payments Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.payment_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(payment.payment_method)}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{payment.invoice_no}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            {payment.customers?.business_name ||
                              payment.customer_human_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
                            title="View Payment Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReceipt(payment)}
                            title="View Receipt"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                            title="Edit Payment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={isDeleting}
                            title="Delete Payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Payment Number
                  </Label>
                  <p className="text-lg font-semibold">
                    {selectedPayment.payment_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Amount
                  </Label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Payment Method
                  </Label>
                  <p>{getMethodBadge(selectedPayment.payment_method)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Payment Date
                  </Label>
                  <p>
                    {new Date(
                      selectedPayment.payment_date,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Invoice Number
                  </Label>
                  <p>{selectedPayment.invoice_no}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Customer
                  </Label>
                  <p>
                    {selectedPayment.customers?.business_name ||
                      selectedPayment.customer_human_id}
                  </p>
                </div>
              </div>
              {selectedPayment.reference_number && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Reference Number
                  </Label>
                  <p>{selectedPayment.reference_number}</p>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Notes
                  </Label>
                  <p className="bg-gray-50 p-3 rounded-md">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Created
                </Label>
                <p>
                  {selectedPayment.created_at
                    ? new Date(selectedPayment.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_amount">Amount *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_payment_method">Payment Method *</Label>
                <Select
                  value={newPayment.payment_method}
                  onValueChange={(value: PaymentMethod) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      payment_method: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_payment_number">Payment Number *</Label>
                <Input
                  id="edit_payment_number"
                  placeholder="PAY-001"
                  value={newPayment.payment_number}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      payment_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_invoice_no">Invoice Number *</Label>
                <Input
                  id="edit_invoice_no"
                  placeholder="INV-001"
                  value={newPayment.invoice_no}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      invoice_no: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_customer_human_id">Customer ID *</Label>
                <Input
                  id="edit_customer_human_id"
                  placeholder="CUST-001"
                  value={newPayment.customer_human_id}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      customer_human_id: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_payment_date">Payment Date</Label>
                <Input
                  id="edit_payment_date"
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      payment_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_reference_number">Reference Number</Label>
              <Input
                id="edit_reference_number"
                placeholder="Transaction ID, Check #, etc."
                value={newPayment.reference_number}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    reference_number: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_received_by">Received By</Label>
              <Input
                id="edit_received_by"
                placeholder="Staff member name"
                value={newPayment.received_by}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    received_by: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                placeholder="Payment notes..."
                value={newPayment.notes}
                onChange={(e) =>
                  setNewPayment((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>Update Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add_amount">Amount *</Label>
                <Input
                  id="add_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="add_invoice_no">Invoice Number *</Label>
                <Input
                  id="add_invoice_no"
                  placeholder="INV-001"
                  value={newPayment.invoice_no}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      invoice_no: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add_customer_human_id">Customer ID *</Label>
                <Input
                  id="add_customer_human_id"
                  placeholder="CUST-001"
                  value={newPayment.customer_human_id}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      customer_human_id: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="add_payment_number">Payment Number *</Label>
                <Input
                  id="add_payment_number"
                  placeholder="PAY-001"
                  value={newPayment.payment_number}
                  onChange={(e) =>
                    setNewPayment((prev) => ({
                      ...prev,
                      payment_number: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add_payment_method">Payment Method *</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(value: PaymentMethod) =>
                  setNewPayment((prev) => ({ ...prev, payment_method: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add_payment_date">Payment Date</Label>
              <Input
                id="add_payment_date"
                type="date"
                value={newPayment.payment_date}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    payment_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="add_reference_number">Reference Number</Label>
              <Input
                id="add_reference_number"
                placeholder="Transaction ID, Check #, etc."
                value={newPayment.reference_number}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    reference_number: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="add_received_by">Received By</Label>
              <Input
                id="add_received_by"
                placeholder="Staff member name"
                value={newPayment.received_by}
                onChange={(e) =>
                  setNewPayment((prev) => ({
                    ...prev,
                    received_by: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="add_notes">Notes</Label>
              <Textarea
                id="add_notes"
                placeholder="Payment notes..."
                value={newPayment.notes}
                onChange={(e) =>
                  setNewPayment((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Payment receipt for {selectedPayment?.payment_number}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <PaymentReceiptPDF
              payment={{
                id: selectedPayment.id,
                payment_number: selectedPayment.payment_number,
                amount: selectedPayment.amount,
                payment_method: selectedPayment.payment_method,
                payment_date: selectedPayment.payment_date,
                reference_number: selectedPayment.reference_number || undefined,
                notes: selectedPayment.notes || undefined,
                invoice_no: selectedPayment.invoice_no,
                customer_human_id: selectedPayment.customer_human_id,
                payment_status: selectedPayment.payment_status || "completed",
                created_at:
                  selectedPayment.created_at || new Date().toISOString(),
              }}
              customer={
                selectedPayment.customers
                  ? {
                      business_name:
                        selectedPayment.customers.business_name ||
                        selectedPayment.customer_human_id ||
                        "",
                    }
                  : undefined
              }
              invoice={
                selectedPayment.invoices
                  ? {
                      id: selectedPayment.id,
                      invoiceNo: selectedPayment.invoice_no,
                      total:
                        selectedPayment.invoices.total !== undefined &&
                        selectedPayment.invoices.total !== null
                          ? selectedPayment.invoices.total
                          : selectedPayment.amount,
                      amountPaid:
                        selectedPayment.invoices.amountPaid !== undefined &&
                        selectedPayment.invoices.amountPaid !== null
                          ? selectedPayment.invoices.amountPaid
                          : selectedPayment.amount,
                      amountDue:
                        selectedPayment.invoices.total !== undefined &&
                        selectedPayment.invoices.total !== null &&
                        selectedPayment.invoices.amountPaid !== undefined &&
                        selectedPayment.invoices.amountPaid !== null
                          ? Math.round(
                              (selectedPayment.invoices.total -
                                selectedPayment.invoices.amountPaid) *
                                100,
                            ) / 100
                          : Math.round(
                              (selectedPayment.amount -
                                selectedPayment.amount) *
                                100,
                            ) / 100,
                    }
                  : undefined
              }
              showActions={true}
            />
          )}
          <DialogFooter>
            <Button onClick={() => setIsReceiptDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
