'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Send,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useInvoicesWithDetails, useInvoiceActions, type EnhancedInvoice } from '@/lib/hooks/useInvoiceManagement';
import { formatCurrency, formatDate } from '@/lib/constants';
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800 border-green-200";
    case "sent": return "bg-blue-100 text-blue-800 border-blue-200";
    case "viewed": return "bg-purple-100 text-purple-800 border-purple-200";
    case "overdue": return "bg-red-100 text-red-800 border-red-200";
    case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
    case "draft": 
    default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid": return <CheckCircle className="h-4 w-4" />;
    case "sent": return <FileText className="h-4 w-4" />;
    case "viewed": return <Eye className="h-4 w-4" />;
    case "overdue": return <AlertCircle className="h-4 w-4" />;
    case "cancelled": return <XCircle className="h-4 w-4" />;
    case "draft": 
    default: return <Clock className="h-4 w-4" />;
  }
};

function InvoicesContent() {
  const { data: invoices = [], isLoading, mutate } = useInvoicesWithDetails();
  const { updateInvoiceStatus, deleteInvoice } = useInvoiceActions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isActionLoading, setIsActionLoading] = useState<string>('');

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice: EnhancedInvoice) => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.invoice_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: invoices.length,
    draft: invoices.filter(inv => inv.invoice_status === 'draft').length,
    sent: invoices.filter(inv => inv.invoice_status === 'sent').length,
    paid: invoices.filter(inv => inv.invoice_status === 'paid').length,
    overdue: invoices.filter(inv => inv.invoice_status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    paidAmount: invoices.filter(inv => inv.invoice_status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    outstandingAmount: invoices.filter(inv => inv.invoice_status !== 'paid' && inv.invoice_status !== 'cancelled').reduce((sum, inv) => sum + (inv.amountDue || inv.total || 0), 0)
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setIsActionLoading(invoiceId);
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
      mutate(); // Refresh the data
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setIsActionLoading('');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      setIsActionLoading(invoiceId);
      try {
        await deleteInvoice(invoiceId);
        mutate(); // Refresh the data
      } catch (error) {
        console.error('Error deleting invoice:', error);
      } finally {
        setIsActionLoading('');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading invoices...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
              <p className="text-muted-foreground mt-1">
                Manage customer invoices and billing
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button asChild>
                <Link href="/dashboard/invoices/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalAmount)} total value
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.paidAmount)} collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.sent + stats.draft}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.outstandingAmount)} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Invoices</CardTitle>
            <CardDescription>Search and filter your invoice list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, customer, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                >
                  Draft ({stats.draft})
                </Button>
                <Button
                  variant={statusFilter === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('sent')}
                >
                  Sent ({stats.sent})
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('paid')}
                >
                  Paid ({stats.paid})
                </Button>
                {stats.overdue > 0 && (
                  <Button
                    variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('overdue')}
                  >
                    Overdue ({stats.overdue})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
            <CardDescription>
              {filteredInvoices.length} of {invoices.length} invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {invoices.length === 0 
                    ? 'Create your first invoice to get started with billing customers.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {invoices.length === 0 && (
                  <Button asChild>
                    <Link href="/dashboard/invoices/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Invoice
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: EnhancedInvoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="text-primary hover:underline"
                          >
                            {invoice.invoiceNo || `#${invoice.id.slice(0, 8)}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.customerName}</div>
                            {invoice.notes && (
                              <div className="text-sm text-muted-foreground truncate max-w-40">
                                {invoice.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.invoice_date ? formatDate(invoice.invoice_date) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(invoice.total || 0)}</div>
                            {invoice.amountPaid > 0 && (
                              <div className="text-sm text-green-600">
                                {formatCurrency(invoice.amountPaid)} paid
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(invoice.invoice_status)}
                          >
                            {getStatusIcon(invoice.invoice_status)}
                            <span className="ml-1 capitalize">{invoice.invoice_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                {isActionLoading === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {invoice.invoice_status === 'draft' && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Invoice
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {invoice.invoice_status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice.id, 'sent')}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Invoice
                                </DropdownMenuItem>
                              )}
                              {invoice.invoice_status !== 'paid' && invoice.invoice_status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice.id, 'paid')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {invoice.invoice_status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Invoice
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function InvoicesPage() {
  return (
    <ProtectedDashboard allowedRoles={['staff', 'manager', 'admin', 'super_admin']}>
      <InvoicesContent />
    </ProtectedDashboard>
  );
}