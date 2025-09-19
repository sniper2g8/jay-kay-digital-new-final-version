import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface CustomerJob {
  id: string;
  jobNo: string | null;
  customer_id: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  estimated_delivery: string | null;
  created_at: string | null;
  estimate_price: number | null;
  final_price: number | null;
}

export interface CustomerInvoice {
  id: string;
  invoiceNo: string | null;
  customer_id: string | null;
  total: number | null;
  grandTotal: number | null;
  status: string | null;
  dueDate: Json;
  created_at: string | null;
}

export interface CustomerStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalSpent: number;
  pendingInvoices: number;
}

export const useCustomerData = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    pendingInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the customer record to find their customer_id
      const { data: customerData, error: customerError } = await supabase
        .from("appUsers")
        .select("id")
        .eq("id", user.id)
        .eq("primary_role", "customer")
        .single();

      if (customerError) {
        console.error("❌ Error fetching customer data:", customerError);
        throw customerError;
      }

      if (!customerData) {
        
        setJobs([]);
        setInvoices([]);
        setLoading(false);
        return;
      }

      const customerId = customerData.id;
      
      // Fetch customer's jobs only - using correct column names
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(
          `
          id,
          jobNo,
          customer_id,
          title,
          description,
          status,
          priority,
          estimated_delivery,
          created_at,
          estimate_price,
          final_price
        `,
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error("❌ Error fetching jobs:", jobsError);
        setJobs([]);
      } else {
        
        setJobs(jobsData || []);
      }

      // Fetch customer's invoices only - using correct column names
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoiceNo,
          customer_id,
          total,
          grandTotal,
          status,
          dueDate,
          created_at
        `,
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (invoicesError) {
        console.error("❌ Error fetching invoices:", invoicesError);
        setInvoices([]);
      } else {
        
        setInvoices(invoicesData || []);
      }

      // Calculate customer-specific stats
      const customerJobs = jobsData || [];
      const customerInvoices = invoicesData || [];

      const newStats: CustomerStats = {
        totalJobs: customerJobs.length,
        activeJobs: customerJobs.filter(
          (job) =>
            job.status &&
            [
              "pending",
              "in_progress",
              "awaiting_approval",
              "In Progress",
            ].includes(job.status),
        ).length,
        completedJobs: customerJobs.filter(
          (job) =>
            job.status && ["completed", "Completed"].includes(job.status),
        ).length,
        totalSpent: customerInvoices
          .filter((inv) => inv.status && ["paid", "Paid"].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0),
        pendingInvoices: customerInvoices.filter(
          (inv) =>
            inv.status &&
            [
              "pending",
              "sent",
              "overdue",
              "Pending",
              "Sent",
              "Overdue",
            ].includes(inv.status),
        ).length,
      };

      setStats(newStats);
      
    } catch (err) {
      console.error("❌ Error fetching customer data:", err);
      setError(err instanceof Error ? err.message : "Failed to load your data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const refreshData = () => {
    fetchCustomerData();
  };

  return {
    jobs,
    invoices,
    stats,
    loading,
    error,
    refreshData,
  };
};