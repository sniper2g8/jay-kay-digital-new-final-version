import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type StatementTransaction = {
  id: string;
  type: 'invoice' | 'payment';
  transaction_date: string;
  description: string;
  reference_number?: string | null;
  amount: number; // positive for charges, negative for payments
  running_balance?: number;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!, // Use correct publishable key
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createServiceRoleClient();

    // Load statement period
    const { data: period, error: periodError } = await admin
      .from('customer_statement_periods')
      .select('*')
      .eq('id', (await params).id)
      .maybeSingle();

    if (periodError || !period) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const customerId: string = period.customer_id!;
    const start: string = period.period_start!;
    const end: string = period.period_end!;

    // Invoices before period (for opening balance)
    const { data: invBefore } = await admin
      .from('invoices')
      .select('id,total,amountPaid,created_at')
      .eq('customer_id', customerId)
      .lt('created_at', start);

    // Payments before period (for opening balance)
    const { data: payBefore } = await admin
      .from('payments')
      .select('id,amount,payment_date,customer_id')
      .eq('customer_id', customerId)
      .lt('payment_date', start);

    const openingCharges = (invBefore || []).reduce((s, i: any) => s + Number(i.total || 0), 0);
    const openingPayments = (payBefore || []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
    const opening_balance = openingCharges - openingPayments;

    // Invoices within period
    const { data: invWithin } = await admin
      .from('invoices')
      .select('id,invoiceNo,total,created_at')
      .eq('customer_id', customerId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true });

    // Payments within period
    const { data: payWithin } = await admin
      .from('payments')
      .select('id,reference_number,amount,payment_date')
      .eq('customer_id', customerId)
      .gte('payment_date', start)
      .lte('payment_date', end)
      .order('payment_date', { ascending: true });

    // Build unified transactions list
    const txs: StatementTransaction[] = [];
    for (const i of invWithin || []) {
      txs.push({
        id: i.id,
        type: 'invoice',
        transaction_date: i.created_at!,
        description: `Invoice ${i.invoiceNo || i.id.slice(0,8)}`,
        reference_number: i.invoiceNo || i.id,
        amount: Number(i.total || 0),
      });
    }
    for (const p of payWithin || []) {
      txs.push({
        id: p.id,
        type: 'payment',
        transaction_date: p.payment_date!,
        description: `Payment ${p.reference_number || p.id.slice(0,8)}`,
        reference_number: p.reference_number || p.id,
        amount: -Math.abs(Number(p.amount || 0)),
      });
    }

    txs.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    // Compute running balance
    let balance = opening_balance;
    for (const t of txs) {
      balance += t.amount;
      t.running_balance = balance;
    }

    const totals = {
      opening_balance,
      charges: (invWithin || []).reduce((s, i: any) => s + Number(i.total || 0), 0),
      payments: (payWithin || []).reduce((s, p: any) => s + Number(p.amount || 0), 0),
      closing_balance: balance,
    };

    return NextResponse.json({ period, transactions: txs, totals });
  } catch (err) {
    console.error('Error computing statement:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


