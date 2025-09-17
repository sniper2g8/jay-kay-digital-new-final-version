'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  payment_status: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  notes: string | null;
  items_count: number;
  created_at: string | null;
}

export interface InvoiceStats {
  total_invoices: number;
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
}

// Helper function to parse Firebase timestamp
function parseFirebaseTimestamp(timestamp: unknown): string | null {
  if (!timestamp) return null;
  
  if (typeof timestamp === 'object' && timestamp && '_seconds' in timestamp) {
    const ts = timestamp as { _seconds: number };
    const date = new Date(ts._seconds * 1000);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return null;
}

export function useInvoicesData() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total_invoices: 0,
    total_revenue: 0,
    total_paid: 0,
    total_pending: 0,
    paid_count: 0,
    pending_count: 0,
    overdue_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchInvoices = useCallback(async () => {
    if (!user || !session) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching invoices from database...');

      // Get invoices with customer data
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoiceNo,
          customer_id,
          customerName,
          total,
          grandTotal,
          amountPaid,
          amountDue,
          status,
          payment_status,
          issueDate,
          dueDate,
          currency,
          notes,
          items,
          created_at,
          customers (
            business_name,
            contact_person
          )
        `)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Supabase error:', invoicesError);
        throw invoicesError;
      }

      console.log('Raw invoice data:', invoicesData);

      if (!invoicesData || invoicesData.length === 0) {
        console.log('No invoices found');
        setInvoices([]);
        setStats({
          total_invoices: 0,
          total_revenue: 0,
          total_paid: 0,
          total_pending: 0,
          paid_count: 0,
          pending_count: 0,
          overdue_count: 0,
        });
        return;
      }

      // Transform the data
      const transformedInvoices: InvoiceData[] = invoicesData.map(invoice => {
        const customerData = invoice.customers as { business_name?: string; contact_person?: string } | null;
        const totalAmount = Number(invoice.total || invoice.grandTotal || 0);
        const paidAmount = Number(invoice.amountPaid || 0);
        const dueAmount = Number(invoice.amountDue || (totalAmount - paidAmount));
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoiceNo || 'N/A',
          customer_name: invoice.customerName || customerData?.business_name || 'Unknown Customer',
          amount: totalAmount,
          amount_paid: paidAmount,
          amount_due: dueAmount,
          status: invoice.status || 'draft',
          payment_status: invoice.payment_status || 'pending',
          issue_date: parseFirebaseTimestamp(invoice.issueDate),
          due_date: parseFirebaseTimestamp(invoice.dueDate),
          currency: invoice.currency || 'SLL',
          notes: invoice.notes,
          items_count: Array.isArray(invoice.items) ? invoice.items.length : 0,
          created_at: invoice.created_at,
        };
      });

      // Calculate statistics
      const statsData: InvoiceStats = {
        total_invoices: transformedInvoices.length,
        total_revenue: 0,
        total_paid: 0,
        total_pending: 0,
        paid_count: 0,
        pending_count: 0,
        overdue_count: 0,
      };

      transformedInvoices.forEach(invoice => {
        statsData.total_revenue += invoice.amount;
        statsData.total_paid += invoice.amount_paid;
        
        switch (invoice.status.toLowerCase()) {
          case 'paid':
            statsData.paid_count++;
            break;
          case 'pending':
          case 'sent':
            statsData.pending_count++;
            statsData.total_pending += invoice.amount_due;
            break;
          case 'overdue':
            statsData.overdue_count++;
            statsData.total_pending += invoice.amount_due;
            break;
          default:
            statsData.pending_count++;
            statsData.total_pending += invoice.amount_due;
        }
      });

      console.log('Transformed invoices:', transformedInvoices.length);
      console.log('Stats:', statsData);

      setInvoices(transformedInvoices);
      setStats(statsData);

    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    stats,
    isLoading,
    error,
    refetch: fetchInvoices,
  };
}

export function useInvoice(invoiceId: string | null) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchInvoice = useCallback(async () => {
    if (!user || !session || !invoiceId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            business_name,
            contact_person,
            email,
            phone,
            address
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        setInvoice(null);
        return;
      }

      const customerData = data.customers as { business_name?: string; contact_person?: string; email?: string; phone?: string; address?: string } | null;
      const totalAmount = Number(data.total || data.grandTotal || 0);
      const paidAmount = Number(data.amountPaid || 0);
      const dueAmount = Number(data.amountDue || (totalAmount - paidAmount));

      const transformedInvoice: InvoiceData = {
        id: data.id,
        invoice_number: data.invoiceNo || 'N/A',
        customer_name: data.customerName || customerData?.business_name || 'Unknown Customer',
        amount: totalAmount,
        amount_paid: paidAmount,
        amount_due: dueAmount,
        status: data.status || 'draft',
        payment_status: data.payment_status || 'pending',
        issue_date: parseFirebaseTimestamp(data.issueDate),
        due_date: parseFirebaseTimestamp(data.dueDate),
        currency: data.currency || 'SLL',
        notes: data.notes,
        items_count: Array.isArray(data.items) ? data.items.length : 0,
        created_at: data.created_at,
      };

      setInvoice(transformedInvoice);

    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice');
    } finally {
      setIsLoading(false);
    }
  }, [user, session, invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    isLoading,
    error,
    refetch: fetchInvoice,
  };
}