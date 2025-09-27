"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create Supabase client for server actions
async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

// Fetch notifications for the current user
export async function fetchUserNotifications() {
  const supabase = await createClient();

  try {
    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        error: "Session error",
        details: sessionError.message,
        notifications: [],
        stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
      };
    }

    if (!session?.user) {
      return {
        success: false,
        error: "No authenticated user",
        notifications: [],
        stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
      };
    }

    // Try to fetch notifications for the current user
    const { data: notificationsData, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Server action - Error fetching notifications:", {
        message: error.message || "Unknown error",
        code: error.code || "N/A",
        details: error.details || "N/A",
        hint: error.hint || "N/A",
      });

      // Handle specific permission errors
      if (error.code === "42501") {
        // Permission denied - likely RLS policies not set up correctly
        console.error(
          "Permission denied: RLS policies may not be configured for notifications table",
        );

        // Try a more basic query to see if the table is accessible at all
        const { data: _basicData, error: basicError } = await supabase
          .from("notifications")
          .select(
            "id, title, message, created_at, read_at, email_sent, sms_sent",
          )
          .limit(1);

        if (basicError) {
          // Even basic access is denied - definitely an RLS issue
          return {
            success: false,
            error:
              "Permission denied - RLS policies need to be configured for notifications table",
            code: error.code,
            details:
              "Row Level Security is enabled on the notifications table but no policies allow user access",
            notifications: [],
            stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
          };
        } else {
          // Basic access works but user-specific query doesn't
          return {
            success: false,
            error:
              "Permission denied - User-specific notifications access not configured",
            code: error.code,
            details:
              "RLS policies need to be updated to allow users to access their own notifications",
            notifications: [],
            stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
          };
        }
      }

      // Return error but with empty data to prevent UI crashes
      return {
        success: false,
        error: error.message,
        code: error.code,
        notifications: [],
        stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
      };
    }

    // Calculate stats
    const total = notificationsData?.length || 0;
    const unread = notificationsData?.filter((n) => !n.read_at).length || 0;
    const email_sent =
      notificationsData?.filter((n) => n.email_sent).length || 0;
    const sms_sent = notificationsData?.filter((n) => n.sms_sent).length || 0;

    return {
      success: true,
      notifications: notificationsData || [],
      stats: { total, unread, email_sent, sms_sent },
    };
  } catch (error) {
    console.error("Server action - Unexpected error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
      notifications: [],
      stats: { total: 0, unread: 0, email_sent: 0, sms_sent: 0 },
    };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", session.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", session.user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", session.user.id)
      .is("read_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
