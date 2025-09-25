import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role from appUsers
    const { data: appUser, error: roleError } = await supabase
      .from('appUsers')
      .select('primary_role')
      .eq('id', user.id)
      .single();

    if (roleError || !appUser || !['admin', 'super_admin'].includes(appUser.primary_role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role to perform deletion
    const admin = createServiceRoleClient();
    const { error: deleteError } = await admin
      .from('customer_statement_periods')
      .delete()
      .eq('id', (await params).id);

    if (deleteError) {
      console.error('Failed to delete statement:', deleteError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting statement:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


