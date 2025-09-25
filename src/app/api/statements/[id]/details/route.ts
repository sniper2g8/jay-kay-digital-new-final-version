import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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
      .eq('id', (await params).id)
      .maybeSingle();

    if (periodError || !period) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const { data: transactions, error: txError } = await admin
      .from('customer_statement_transactions')
      .select('*')
      .eq('statement_period_id', (await params).id)
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


