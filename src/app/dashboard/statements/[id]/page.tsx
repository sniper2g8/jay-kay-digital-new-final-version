"use client";

import { notFound } from "next/navigation";
import { useStatementPeriod } from "@/lib/hooks/useStatements";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Send, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StatementPageProps {
  params: {
    id: string;
  };
}

export default function StatementPage({ params }: StatementPageProps) {
  console.log("StatementPage: Rendering with params", { params });

  if (!params.id) {
    console.log("StatementPage: No ID provided");
    notFound();
  }

  // We know we have an ID at this point
  const { data: statement, transactions, isLoading, error } = useStatementPeriod(
    params.id
  );
  
  // Log the state for debugging
  console.log("StatementPage: State", { 
    id: params.id,
    hasStatement: !!statement,
    hasTransactions: !!transactions?.length,
    isLoading,
    error,
    statement,
    transactions
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <FileText className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading statement...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Statement</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button asChild variant="ghost">
              <Link href="/dashboard/statements">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Statements
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle not found state
  if (!statement) {
    notFound();
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/statements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Statements
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Statement {statement.statement_number}
            </h1>
            <p className="text-muted-foreground mt-1">
              {formatDate(statement.period_start)} to{" "}
              {formatDate(statement.period_end)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button size="sm" variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Email to Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Statement Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statement Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Statement Summary</CardTitle>
              <CardDescription>Statement period activity overview</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(statement.opening_balance || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Charges</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(statement.total_charges || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(statement.total_payments || 0)}
                </p>
              </div>
              <div className="sm:col-span-3">
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Closing Balance</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(statement.closing_balance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                All transactions during this statement period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No transactions during this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.reference_number}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(transaction.running_balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{statement.customer?.business_name}</p>
                <p className="text-sm text-muted-foreground">
                  {statement.customer?.contact_person}
                </p>
                {statement.customer?.email && (
                  <p className="text-sm">{statement.customer.email}</p>
                )}
                {statement.customer?.phone && (
                  <p className="text-sm">{statement.customer.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statement Status */}
          <Card>
            <CardHeader>
              <CardTitle>Statement Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium capitalize">
                  {statement.status}
                </p>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {formatDate(statement.created_at || "")}
                </p>
                {statement.sent_at && (
                  <>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="text-sm font-medium">
                      {formatDate(statement.sent_at)}
                    </p>
                  </>
                )}
                {statement.viewed_at && (
                  <>
                    <p className="text-sm text-muted-foreground">Viewed</p>
                    <p className="text-sm font-medium">
                      {formatDate(statement.viewed_at)}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}