'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Send,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useStatementPeriods, useStatementStats, useCustomerBalances } from '@/lib/hooks/useStatements';
import { formatCurrency, formatDate } from '@/lib/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedDashboard from '@/components/ProtectedDashboard';

function CustomerStatementsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  const { data: statements, isLoading: statementsLoading } = useStatementPeriods();
  const { data: stats, isLoading: statsLoading } = useStatementStats();
  const { data: balances, isLoading: balancesLoading } = useCustomerBalances();

  // Filter statements based on search and filters
  const filteredStatements = statements.filter(statement => {
    const matchesSearch = 
      statement.statement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.customer?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || statement.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || statement.customer_id === customerFilter;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      generated: { color: 'bg-blue-100 text-blue-800', label: 'Generated' },
      sent: { color: 'bg-yellow-100 text-yellow-800', label: 'Sent' },
      viewed: { color: 'bg-purple-100 text-purple-800', label: 'Viewed' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Get unique customers for filter
  const uniqueCustomers = Array.from(
    new Map(statements.map(s => s.customer ? [s.customer.id, s.customer] : [s.customer_id, null]))
      .values()
  ).filter(Boolean);

  if (statementsLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading customer statements...</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Customer Statements</h1>
              <p className="text-muted-foreground mt-1">
                Manage customer account statements, balances, and payment history
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button asChild className="shadow-sm hover:shadow-md transition-shadow bg-primary hover:bg-primary/90">
                <Link href="/dashboard/statements/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Statement Period
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.total_statements}
              </div>
              <p className="text-xs text-muted-foreground">
                All statement periods
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Statements</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.pending_statements}
              </div>
              <p className="text-xs text-muted-foreground">
                Draft & generated
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.total_outstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                Unpaid balances
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift transition-all border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.overdue_accounts}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Balances Summary */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Customer Balances</CardTitle>
              <CardDescription>Current account balances summary</CardDescription>
            </CardHeader>
            <CardContent>
              {balancesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {balances.slice(0, 5).map((balance) => (
                    <div key={balance.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {balance.customer?.company_name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {balance.customer?.contact_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          balance.current_balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(balance.current_balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {balance.account_status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {balances.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm">
                        View All Balances
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common statement management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/dashboard/statements/create">
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full hover-lift">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">New Period</span>
                  </Button>
                </Link>
                
                <Link href="/dashboard/statements/balances">
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full hover-lift">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Balances</span>
                  </Button>
                </Link>
                
                <Button variant="outline" className="h-20 flex-col space-y-2 w-full hover-lift">
                  <Download className="h-6 w-6" />
                  <span className="text-sm">Bulk Export</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statement Periods</CardTitle>
            <CardDescription>All customer statement periods and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search statements, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map((customer) => (
                    <SelectItem key={customer?.id} value={customer?.id || ''}>
                      {customer?.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statements Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No statements found</p>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/statements/create">
                              Create First Statement
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStatements.map((statement) => (
                      <TableRow key={statement.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link 
                            href={`/dashboard/statements/${statement.id}`}
                            className="text-primary hover:underline"
                          >
                            {statement.statement_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {statement.customer?.company_name || 'Unknown Customer'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {statement.customer?.contact_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(statement.period_start)} -</p>
                            <p>{formatDate(statement.period_end)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(statement.total_charges)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            statement.current_balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(statement.current_balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(statement.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(statement.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/statements/${statement.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {statement.status === 'generated' && (
                              <Button variant="ghost" size="sm">
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
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
    </DashboardLayout>
  );
}

export default function CustomerStatementsPage() {
  return (
    <ProtectedDashboard allowedRoles={['staff', 'manager', 'admin', 'super_admin']}>
      <CustomerStatementsContent />
    </ProtectedDashboard>
  );
}