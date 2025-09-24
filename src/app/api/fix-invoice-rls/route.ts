import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: appUser, error: appUserError } = await supabase
      .from('appUsers')
      .select('primary_role')
      .eq('id', user.id)
      .single();
    
    if (appUserError || !appUser || !['admin', 'super_admin'].includes(appUser.primary_role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Execute the SQL function to fix RLS policies
    const { error } = await supabase.rpc('fix_invoice_line_items_rls');
    
    if (error) {
      console.error('Error fixing RLS policies:', error);
      return NextResponse.json({ error: 'Failed to fix RLS policies' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'RLS policies fixed successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}