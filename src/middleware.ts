import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Check if required environment variables are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  // Only create Supabase client if environment variables are available
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createMiddlewareClient({ req, res });

    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Allow statements to handle access gracefully client-side without forced redirect
    // If you want to protect the entire dashboard, move this check to the matcher-wide scope.
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};