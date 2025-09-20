import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
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
    
    // Try to access notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', session.user.id)
      .limit(5)
    
    if (notificationsError) {
      return NextResponse.json({ 
        error: 'Notifications access error', 
        details: notificationsError,
        userId: session.user.id
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      notifications,
      userId: session.user.id,
      session: session.user.id
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: error }, { status: 500 })
  }
}