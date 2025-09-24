import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createServiceRoleClient();

    const { data: period, error: periodError } = await admin
      .from('customer_statement_periods')
      .select(`
        *,
        customer:customers(
          id,
          business_name,
          contact_person,
          email,
          phone,
          address
        )
      `)
      .eq('id', params.id)
      .maybeSingle();

    if (periodError || !period) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const { data: transactions, error: txError } = await admin
      .from('customer_statement_transactions')
      .select('*')
      .eq('statement_period_id', params.id)
      .order('transaction_date', { ascending: true });

    if (txError) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({ period, transactions: transactions ?? [] });
  } catch (err) {
    console.error('Error fetching statement details:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


