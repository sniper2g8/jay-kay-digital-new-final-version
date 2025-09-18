"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database-generated.types";

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

interface Payment extends PaymentRow {
  invoices?: { invoiceNo: string | null } | null;
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
    paymentsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_method: "" as PaymentMethod | "",
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: "",
    notes: "",
    invoice_no: "",
    customer_human_id: "",
    payment_number: "",
    received_by: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices!fk_payments_invoice_no(invoiceNo),
          customers!fk_payments_customer_human_id(business_name)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      // Get payment statistics
      const { data: allPayments, error } = await supabase
        .from('payments')
        .select('amount, payment_date');

      if (error) throw error;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const stats = (allPayments || []).reduce((acc, payment) => {
        const paymentDate = new Date(payment.payment_date);
        
        acc.totalReceived += payment.amount;
        acc.paymentsCount += 1;
        
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
          acc.thisMonth += payment.amount;
        }
        
        return acc;
      }, {
        totalReceived: 0,
        thisMonth: 0,
        paymentsCount: 0
      });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleAddPayment = async () => {
    try {
      if (!newPayment.payment_method || !newPayment.customer_human_id || !newPayment.invoice_no || !newPayment.payment_number) {
        alert('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('payments')
        .insert([{
          amount: parseFloat(newPayment.amount),
          payment_method: newPayment.payment_method as PaymentMethod,
          payment_date: newPayment.payment_date,
          reference_number: newPayment.reference_number || null,
          notes: newPayment.notes || null,
          invoice_no: newPayment.invoice_no,
          customer_human_id: newPayment.customer_human_id,
          payment_number: newPayment.payment_number,
          received_by: newPayment.received_by || null
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      setNewPayment({
        amount: "",
        payment_method: "",
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: "",
        notes: "",
        invoice_no: "",
        customer_human_id: "",
        payment_number: "",
        received_by: ""
      });
      
      fetchPayments();
      fetchPaymentStats();
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const variants = {
      cash: "bg-green-100 text-green-800 border-green-200",
      card: "bg-blue-100 text-blue-800 border-blue-200",
      bank_transfer: "bg-purple-100 text-purple-800 border-purple-200",
      mobile_money: "bg-orange-100 text-orange-800 border-orange-200",
      cheque: "bg-yellow-100 text-yellow-800 border-yellow-200",
      credit: "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge variant="outline" className={variants[method] || variants.cash}>
        <span className="capitalize">{method.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount.toString().includes(searchTerm) ||
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLL'
    }).format(amount);
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
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Track and manage all payments and transactions</p>
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
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment_number">Payment Number *</Label>
                <Input
                  id="payment_number"
                  placeholder="PAY-001"
                  value={newPayment.payment_number}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, payment_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={newPayment.payment_method}
                  onValueChange={(value: PaymentMethod) => setNewPayment(prev => ({ ...prev, payment_method: value }))}
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
                <Label htmlFor="customer_human_id">Customer ID *</Label>
                <Input
                  id="customer_human_id"
                  placeholder="Customer ID"
                  value={newPayment.customer_human_id}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, customer_human_id: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="invoice_no">Invoice Number *</Label>
                <Input
                  id="invoice_no"
                  placeholder="INV-001"
                  value={newPayment.invoice_no}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, invoice_no: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  placeholder="Optional reference number"
                  value={newPayment.reference_number}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="received_by">Received By</Label>
                <Input
                  id="received_by"
                  placeholder="Staff member name"
                  value={newPayment.received_by}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, received_by: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddPayment} className="flex-1">
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalReceived)}
            </div>
            <p className="text-xs text-gray-500">{stats.paymentsCount} payments total</p>
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
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.paymentsCount > 0 ? stats.totalReceived / stats.paymentsCount : 0)}
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
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                          <span>{payment.customers?.business_name || payment.customer_human_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    </div>
  );
}