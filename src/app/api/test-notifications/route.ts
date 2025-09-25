import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!, // Use correct publishable key
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  try {
    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 400 })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    // Test 1: Check if we can access the notifications table at all
    const test1 = await supabase
      .from('notifications')
      .select('count', { count: 'exact', head: true })
    
    // Test 2: Check if we can access a specific notification (if any exist)
    const test2 = await supabase
      .from('notifications')
      .select('id')
      .limit(1)
    
    // Test 3: Check user info
    const userInfo = {
      userId: session.user.id,
      userEmail: session.user.email
    }
    
    return NextResponse.json({ 
      success: true,
      userInfo,
      test1: {
        success: !test1.error,
        error: test1.error,
        count: test1.count
      },
      test2: {
        success: !test2.error,
        error: test2.error,
        data: test2.data
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: error }, { status: 500 })
  }
}