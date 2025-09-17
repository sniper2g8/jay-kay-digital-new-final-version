"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface CustomerStatementPeriod {
  id: string;
  customer_id: string | null;
  statement_number: string;
  period_start: string;
  period_end: string;
  statement_date: string | null;
  opening_balance: number | null;
  closing_balance: number | null;
  current_balance: number | null;
  total_charges: number | null;
  total_payments: number | null;
  total_adjustments: number | null;
  status: string | null;
  is_current_period: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  generated_by?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;

  // Relations
  customer?: {
    id: string;
    business_name: string;
    contact_person: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
}

export interface CustomerStatementTransaction {
  id: string;
  statement_period_id: string;
  customer_id: string;
  transaction_date: string;
  transaction_type: string;
  description: string;
  reference_number?: string | null;
  amount: number;
  running_balance: number;
  job_id?: string | null;
  invoice_id?: string | null;
  payment_id?: string | null;
  created_at: string | null;
  created_by?: string | null;
  updated_at?: string | null;
}

export interface CustomerAccountBalance {
  id: string;
  customer_id: string;
  current_balance: number;
  outstanding_invoices: number;
  credits_available: number;
  credit_limit: number;
  credit_used: number;
  payment_terms_days: number;
  last_transaction_date?: string;
  last_payment_date?: string;
  last_statement_date?: string;
  account_status: "active" | "suspended" | "closed";
  created_at: string;
  updated_at: string;

  // Relations
  customer?: {
    id: string;
    business_name: string;
    contact_person: string;
    email: string;
  };
}

export interface StatementSettings {
  id: string;
  auto_generate_monthly: boolean;
  statement_due_days: number;
  company_logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  header_text?: string;
  footer_text?: string;
  payment_instructions?: string;
  currency_symbol: string;
  date_format: string;
  created_at: string;
  updated_at: string;
}

interface CreateStatementPeriodData {
  customer_id: string;
  period_start: string;
  period_end: string;
  statement_date?: string;
}

interface CreateTransactionData {
  statement_period_id: string;
  customer_id: string;
  transaction_date: string;
  transaction_type: "charge" | "payment" | "adjustment" | "credit";
  description: string;
  reference_number?: string;
  amount: number;
  running_balance: number;
  job_id?: string;
  invoice_id?: string;
  payment_id?: string;
}

// =====================================================
// STATEMENT PERIODS HOOK
// =====================================================

export function useStatementPeriods() {
  const [data, setData] = useState<CustomerStatementPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatementPeriods = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: periods, error: fetchError } = await supabase
        .from("customer_statement_periods")
        .select(
          `
          *,
          customer:customers(
            id,
            business_name,
            contact_person,
            email,
            phone
          )
        `,
        )
        .order("period_start", { ascending: false });

      if (fetchError) throw fetchError;

      setData(periods || []);
    } catch (err) {
      console.error("Error fetching statement periods:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statement periods",
      );
      toast.error("Failed to load statement periods");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatementPeriods();
  }, [fetchStatementPeriods]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStatementPeriods,
  };
}

// =====================================================
// SINGLE STATEMENT PERIOD HOOK
// =====================================================

export function useStatementPeriod(id: string | null) {
  const [data, setData] = useState<CustomerStatementPeriod | null>(null);
  const [transactions, setTransactions] = useState<
    CustomerStatementTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatementPeriod = useCallback(async () => {
    if (!id) {
      setData(null);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch statement period
      const { data: period, error: periodError } = await supabase
        .from("customer_statement_periods")
        .select(
          `
          *,
          customer:customers(
            id,
            business_name,
            contact_person,
            email,
            phone,
            address
          )
        `,
        )
        .eq("id", id)
        .single();

      if (periodError) throw periodError;

      // Fetch transactions for this period
      const { data: transactionData, error: transactionError } = await supabase
        .from("customer_statement_transactions")
        .select("*")
        .eq("statement_period_id", id)
        .order("transaction_date", { ascending: true });

      if (transactionError) throw transactionError;

      setData(period);
      setTransactions(transactionData || []);
    } catch (err) {
      console.error("Error fetching statement period:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statement period",
      );
      toast.error("Failed to load statement period");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStatementPeriod();
  }, [fetchStatementPeriod]);

  return {
    data,
    transactions,
    isLoading,
    error,
    refetch: fetchStatementPeriod,
  };
}

// =====================================================
// CUSTOMER ACCOUNT BALANCES HOOK
// =====================================================

export function useCustomerBalances() {
  const [data, setData] = useState<CustomerAccountBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: periods, error: fetchError } = await supabase
        .from("customer_statement_periods")
        .select(
          `
          *,
          customer:customers(
            id,
            business_name,
            contact_person,
            email
          )
        `,
        )
        .eq("is_current_period", true)
        .order("updated_at", { ascending: false });

      if (fetchError) {
        // Handle specific case where table doesn't exist
        if (
          fetchError.code === "42501" ||
          fetchError.message.includes("permission denied") ||
          fetchError.code === "42P01" ||
          fetchError.message.includes("does not exist")
        ) {
          console.warn(
            "Customer account balances table not found or not accessible. This feature requires manual database setup.",
          );
          setData([]);
          setError(
            "Customer balances feature requires database setup. Please contact administrator.",
          );
          return;
        }
        throw fetchError;
      }

      // Transform statement periods to account balances
      const balances: CustomerAccountBalance[] = (periods || []).map(
        (period) => ({
          id: period.id,
          customer_id: period.customer_id || "",
          current_balance: period.current_balance || 0,
          outstanding_invoices: period.total_charges || 0,
          credits_available: 0, // Not available in statement periods
          credit_limit: 0, // Not available in statement periods
          credit_used: 0, // Not available in statement periods
          payment_terms_days: 30, // Default value
          last_transaction_date: period.period_end,
          last_payment_date: period.updated_at || "",
          last_statement_date: period.statement_date || "",
          account_status: "active" as const,
          created_at: period.created_at || "",
          updated_at: period.updated_at || "",
          customer: period.customer
            ? {
                id: period.customer.id,
                business_name: period.customer.business_name,
                contact_person: period.customer.contact_person || "",
                email: period.customer.email || "",
              }
            : undefined,
        }),
      );

      setData(balances);
    } catch (err) {
      console.error("Error fetching customer balances:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load customer balances",
      );
      // Don't show toast for table not existing
      if (!err || !err.toString().includes("permission denied")) {
        toast.error("Failed to load customer balances");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}

// =====================================================
// STATEMENT ACTIONS HOOK
// =====================================================

export function useStatementActions() {
  const [isLoading, setIsLoading] = useState(false);

  const createStatementPeriod = async (
    statementData: CreateStatementPeriodData,
  ) => {
    setIsLoading(true);
    try {
      // Generate statement number
      const statementNumber = await generateStatementNumber(
        statementData.customer_id,
      );

      const { data, error } = await supabase
        .from("customer_statement_periods")
        .insert([
          {
            ...statementData,
            statement_number: statementNumber,
            statement_date:
              statementData.statement_date ||
              new Date().toISOString().split("T")[0],
            opening_balance: 0,
            closing_balance: 0,
            current_balance: 0,
            total_charges: 0,
            total_payments: 0,
            total_adjustments: 0,
            status: "draft",
            is_current_period: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Statement period created successfully");
      return data;
    } catch (error) {
      console.error("Error creating statement period:", {
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create statement period";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transactionData: CreateTransactionData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_statement_transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      // Update statement period totals
      await updateStatementTotals(transactionData.statement_period_id);

      // Update customer account balance
      await updateCustomerBalance(transactionData.customer_id);

      toast.success("Transaction added successfully");
      return data;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateStatement = async (periodId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("customer_statement_periods")
        .update({
          status: "generated",
          updated_at: new Date().toISOString(),
        })
        .eq("id", periodId);

      if (error) throw error;

      toast.success("Statement generated successfully");
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error("Failed to generate statement");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendStatement = async (periodId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("customer_statement_periods")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", periodId);

      if (error) throw error;

      toast.success("Statement sent successfully");
    } catch (error) {
      console.error("Error sending statement:", error);
      toast.error("Failed to send statement");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createStatementPeriod,
    addTransaction,
    generateStatement,
    sendStatement,
    isLoading,
  };
}

// =====================================================
// STATEMENT STATISTICS HOOK
// =====================================================

export function useStatementStats() {
  const [data, setData] = useState({
    total_statements: 0,
    pending_statements: 0,
    total_outstanding: 0,
    average_balance: 0,
    overdue_accounts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Get statement counts
        const { count: totalStatements } = await supabase
          .from("customer_statement_periods")
          .select("*", { count: "exact", head: true });

        const { count: pendingStatements } = await supabase
          .from("customer_statement_periods")
          .select("*", { count: "exact", head: true })
          .in("status", ["draft", "generated"]);

        // Get balance statistics from customer statement periods
        const { data: balanceStats } = await supabase
          .from("customer_statement_periods")
          .select("current_balance, status")
          .eq("is_current_period", true);

        const totalOutstanding =
          balanceStats?.reduce(
            (sum, balance) => sum + (balance.current_balance || 0),
            0,
          ) || 0;
        const averageBalance = balanceStats?.length
          ? totalOutstanding / balanceStats.length
          : 0;
        const overdueAccounts =
          balanceStats?.filter(
            (balance) =>
              balance.current_balance &&
              balance.current_balance > 0 &&
              balance.status === "generated",
          ).length || 0;

        setData({
          total_statements: totalStatements || 0,
          pending_statements: pendingStatements || 0,
          total_outstanding: totalOutstanding,
          average_balance: averageBalance,
          overdue_accounts: overdueAccounts,
        });
      } catch (error) {
        console.error("Error fetching statement stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, isLoading };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

async function generateStatementNumber(customerId: string): Promise<string> {
  try {
    // Get customer info
    const { data: customer } = await supabase
      .from("customers")
      .select("business_name")
      .eq("id", customerId)
      .single();

    // Get current date for statement number
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    // Create statement number: STMT-COMPANY-YYYY-MM
    const companyCode =
      customer?.business_name
        ?.substring(0, 4)
        .toUpperCase()
        .replace(/[^A-Z]/g, "") || "CUST";
    const baseNumber = `STMT-${companyCode}-${year}-${month}`;

    // Check for existing statements with this base
    const { count } = await supabase
      .from("customer_statement_periods")
      .select("*", { count: "exact", head: true })
      .like("statement_number", `${baseNumber}%`);

    const sequenceNumber = (count || 0) + 1;
    return `${baseNumber}-${sequenceNumber.toString().padStart(2, "0")}`;
  } catch (error) {
    console.error("Error generating statement number:", error);
    // Fallback to simple timestamp-based number
    return `STMT-${Date.now()}`;
  }
}

async function updateStatementTotals(periodId: string) {
  try {
    // Get all transactions for this period
    const { data: transactions } = await supabase
      .from("customer_statement_transactions")
      .select("transaction_type, amount")
      .eq("statement_period_id", periodId);

    if (!transactions) return;

    // Calculate totals
    const totals = transactions.reduce(
      (acc, transaction) => {
        switch (transaction.transaction_type) {
          case "charge":
            acc.total_charges += transaction.amount;
            break;
          case "payment":
            acc.total_payments += transaction.amount;
            break;
          case "adjustment":
          case "credit":
            acc.total_adjustments += transaction.amount;
            break;
        }
        return acc;
      },
      { total_charges: 0, total_payments: 0, total_adjustments: 0 },
    );

    // Calculate closing balance
    const closingBalance =
      totals.total_charges - totals.total_payments - totals.total_adjustments;

    // Update statement period
    const { error } = await supabase
      .from("customer_statement_periods")
      .update({
        ...totals,
        closing_balance: closingBalance,
        current_balance: closingBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periodId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating statement totals:", error);
  }
}

async function updateCustomerBalance(customerId: string) {
  try {
    // Note: Customer balance is now tracked in customer_statement_periods table
    // No need to maintain a separate account balances table
    console.log(
      "Customer balance update for:",
      customerId,
      "- balance now tracked in statement periods",
    );
  } catch (error) {
    console.error("Error updating customer balance:", error);
  }
}
