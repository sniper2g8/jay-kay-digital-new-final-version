'use server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getInvoiceLineItems_SA(invoiceId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  );

  // Use the service role client for this operation
  const { data: supabaseAdmin } = await supabase.auth.getSession();
  if (supabaseAdmin.session?.user.user_metadata.role !== 'admin' && supabaseAdmin.session?.user.user_metadata.role !== 'super_admin') {
    return { error: { message: 'Permission denied: User is not an admin.' } };
  }

  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (error) {
    console.error('Error fetching invoice line items with service role:', error);
    return { error };
  }

  return { data };
}
