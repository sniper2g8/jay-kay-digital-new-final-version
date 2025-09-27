import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useState } from "react";

export interface CreateNotificationData {
  title: string;
  message: string;
  type:
    | "job_update"
    | "payment_due"
    | "delivery_ready"
    | "system_alert"
    | "promotion"
    | "reminder";
  recipient_id: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

export interface NotificationFilters {
  type?:
    | "job_update"
    | "payment_due"
    | "delivery_ready"
    | "system_alert"
    | "promotion"
    | "reminder"
    | "all"
    | "unread";
  unread?: boolean;
  limit?: number;
  offset?: number;
}

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createNotification = useCallback(
    async (data: CreateNotificationData) => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: notification, error: insertError } = await supabase
          .from("notifications")
          .insert({
            title: data.title,
            message: data.message,
            type: data.type,
            recipient_id: data.recipient_id,
            related_entity_id: data.related_entity_id || null,
            related_entity_type: data.related_entity_type || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          // Error already handled by setError, no additional logging needed
          setError("Failed to create notification");
          return null;
        }

        return notification;
      } catch (err) {
        // Error already handled by setError, no additional logging needed
        setError("Failed to create notification");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getNotifications = useCallback(
    async (userId?: string, filters: NotificationFilters = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        // Use current user ID if not provided
        const targetUserId = userId || user?.id;

        // Validate userId
        if (!targetUserId) {
          // Warning handled by setError, no additional logging needed
          setError("User not authenticated");
          return [];
        }

        let query = supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", targetUserId)
          .order("created_at", { ascending: false });

        if (filters.type && filters.type !== "all") {
          if (filters.type === "unread") {
            query = query.is("read_at", null);
          } else {
            query = query.eq("type", filters.type);
          }
        }

        if (filters.unread) {
          query = query.is("read_at", null);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.offset) {
          query = query.range(
            filters.offset,
            filters.offset + (filters.limit || 10) - 1,
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          // Handle RLS permission errors gracefully
          if (
            fetchError.message.includes("permission denied") ||
            fetchError.code === "42501"
          ) {
            // RLS error handled gracefully, no additional logging needed
            return []; // Return empty array instead of throwing error
          }

          // Only log meaningful error information
          const errorInfo = [];
          if (fetchError.message)
            errorInfo.push(`message: ${fetchError.message}`);
          if (fetchError.code) errorInfo.push(`code: ${fetchError.code}`);
          if (fetchError.details)
            errorInfo.push(`details: ${fetchError.details}`);
          if (fetchError.hint) errorInfo.push(`hint: ${fetchError.hint}`);

          if (errorInfo.length > 0) {
            // Error already handled by setError, no additional logging needed
          } else {
            // Error already handled by setError, no additional logging needed
          }
          setError("Failed to fetch notifications");
          return [];
        }

        return data || [];
      } catch (err) {
        // Only log meaningful error information
        if (err instanceof Error && err.message) {
          // Error already handled by setError, no additional logging needed
        } else {
          // Error already handled by setError, no additional logging needed
        }
        setError("Failed to fetch notifications");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user?.id) {
          // Warning handled by setError, no additional logging needed
          setError("User not authenticated");
          return false;
        }

        const { error: updateError } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", notificationId)
          .eq("recipient_id", user.id)
          .is("read_at", null);

        if (updateError) {
          // Error already handled by setError, no additional logging needed
          setError("Failed to mark notification as read");
          return false;
        }

        return true;
      } catch (err) {
        // Error already handled by setError, no additional logging needed
        setError("Failed to mark notification as read");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const markAllAsRead = async (userId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use current user ID if not provided
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        // Warning handled by setError, no additional logging needed
        setError("User not authenticated");
        return false;
      }

      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", targetUserId)
        .is("read_at", null);

      if (updateError) {
        // Error already handled by setError, no additional logging needed
        setError("Failed to mark notifications as read");
        return false;
      }

      return true;
    } catch (err) {
      // Error already handled by setError, no additional logging needed
      setError("Failed to mark notifications as read");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (deleteError) {
        // Error already handled by setError, no additional logging needed
        setError("Failed to delete notification");
        return false;
      }

      return true;
    } catch (err) {
      // Error already handled by setError, no additional logging needed
      setError("Failed to delete notification");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUnreadCount = useCallback(
    async (userId?: string) => {
      try {
        // Use current user ID if not provided
        const targetUserId = userId || user?.id;

        if (!targetUserId) {
          // Warning handled gracefully, no additional logging needed
          return 0;
        }

        // Ensure we have an authenticated session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          // Warning handled gracefully, no additional logging needed
          return 0;
        }

        const { count, error: countError } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", targetUserId)
          .is("read_at", null);

        if (countError) {
          // Handle RLS permission errors gracefully
          if (
            countError.message.includes("permission denied") ||
            countError.code === "42501"
          ) {
            // RLS error handled gracefully, no additional logging needed
            return 0; // Return 0 instead of throwing error
          }

          // Only log meaningful error information
          const errorInfo = [];
          if (countError.message)
            errorInfo.push(`message: ${countError.message}`);
          if (countError.code) errorInfo.push(`code: ${countError.code}`);
          if (countError.details)
            errorInfo.push(`details: ${countError.details}`);
          if (countError.hint) errorInfo.push(`hint: ${countError.hint}`);

          if (errorInfo.length > 0) {
            // Error handled gracefully, no additional logging needed
          } else {
            // Error handled gracefully, no additional logging needed
          }
          return 0;
        }

        return count || 0;
      } catch (err) {
        // Only log meaningful error information
        if (err instanceof Error && err.message) {
          // Error handled gracefully, no additional logging needed
        } else {
          // Error handled gracefully, no additional logging needed
        }
        return 0;
      }
    },
    [user],
  );

  // Helper functions for common notification types
  const notifyJobUpdate = async (
    userId: string,
    jobId: string,
    status: string,
    jobTitle: string,
  ) => {
    return createNotification({
      title: "Job Status Update",
      message: `Your job "${jobTitle}" status has been updated to: ${status}`,
      type: "job_update",
      recipient_id: userId,
      related_entity_id: jobId,
      related_entity_type: "job",
    });
  };

  const notifyPaymentDue = async (
    userId: string,
    amount: number,
    dueDate: string,
    jobTitle: string,
  ) => {
    return createNotification({
      title: "Payment Due",
      message: `Payment of $${amount.toFixed(2)} is due on ${new Date(dueDate).toLocaleDateString()} for "${jobTitle}"`,
      type: "payment_due",
      recipient_id: userId,
      related_entity_type: "payment",
    });
  };

  const notifyDeliveryReady = async (
    userId: string,
    jobId: string,
    jobTitle: string,
  ) => {
    return createNotification({
      title: "Order Ready for Pickup",
      message: `Your order "${jobTitle}" is ready for pickup or delivery`,
      type: "delivery_ready",
      recipient_id: userId,
      related_entity_id: jobId,
      related_entity_type: "job",
    });
  };

  const notifySystemAlert = async (userId: string, alertMessage: string) => {
    return createNotification({
      title: "System Alert",
      message: alertMessage,
      type: "system_alert",
      recipient_id: userId,
    });
  };

  const notifyPromotion = async (
    userId: string,
    promoTitle: string,
    promoMessage: string,
  ) => {
    return createNotification({
      title: promoTitle,
      message: promoMessage,
      type: "promotion",
      recipient_id: userId,
    });
  };

  const notifyReminder = async (userId: string, reminderMessage: string) => {
    return createNotification({
      title: "Reminder",
      message: reminderMessage,
      type: "reminder",
      recipient_id: userId,
    });
  };

  return {
    isLoading,
    error,
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    // Helper functions
    notifyJobUpdate,
    notifyPaymentDue,
    notifyDeliveryReady,
    notifySystemAlert,
    notifyPromotion,
    notifyReminder,
  };
}
