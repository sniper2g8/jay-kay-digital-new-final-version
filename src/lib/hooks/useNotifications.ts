import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'job_update' | 'payment_due' | 'delivery_ready' | 'system_alert' | 'promotion' | 'reminder';
  recipient_id: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

export interface NotificationFilters {
  type?: 'job_update' | 'payment_due' | 'delivery_ready' | 'system_alert' | 'promotion' | 'reminder' | 'all' | 'unread';
  unread?: boolean;
  limit?: number;
  offset?: number;
}

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNotification = useCallback(async (data: CreateNotificationData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: notification, error: insertError } = await supabase
        .from('notifications')
        .insert({
          title: data.title,
          message: data.message,
          type: data.type,
          recipient_id: data.recipient_id,
          related_entity_id: data.related_entity_id || null,
          related_entity_type: data.related_entity_type || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating notification:', insertError);
        setError('Failed to create notification');
        return null;
      }

      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Failed to create notification');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNotifications = useCallback(async (userId: string, filters: NotificationFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate userId
      if (!userId) {
        console.warn('getNotifications called without valid userId');
        return [];
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (filters.type && filters.type !== 'all') {
        if (filters.type === 'unread') {
          query = query.is('read_at', null);
        } else {
          query = query.eq('type', filters.type);
        }
      }

      if (filters.unread) {
        query = query.is('read_at', null);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching notifications:', fetchError);
        setError('Failed to fetch notifications');
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        setError('Failed to mark notification as read');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAllAsRead = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .is('read_at', null);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        setError('Failed to mark notifications as read');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark notifications as read');
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
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) {
        console.error('Error deleting notification:', deleteError);
        setError('Failed to delete notification');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUnreadCount = useCallback(async (userId: string) => {
    try {
      // Validate userId
      if (!userId) {
        console.warn('getUnreadCount called without valid userId');
        return 0;
      }

      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null);

      if (countError) {
        console.error('Error getting unread count:', countError);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  }, []);

  // Helper functions for common notification types
  const notifyJobUpdate = async (userId: string, jobId: string, status: string, jobTitle: string) => {
    return createNotification({
      title: 'Job Status Update',
      message: `Your job "${jobTitle}" status has been updated to: ${status}`,
      type: 'job_update',
      recipient_id: userId,
      related_entity_id: jobId,
      related_entity_type: 'job'
    });
  };

  const notifyPaymentDue = async (userId: string, amount: number, dueDate: string, jobTitle: string) => {
    return createNotification({
      title: 'Payment Due',
      message: `Payment of $${amount.toFixed(2)} is due on ${new Date(dueDate).toLocaleDateString()} for "${jobTitle}"`,
      type: 'payment_due',
      recipient_id: userId,
      related_entity_type: 'payment'
    });
  };

  const notifyDeliveryReady = async (userId: string, jobId: string, jobTitle: string) => {
    return createNotification({
      title: 'Order Ready for Pickup',
      message: `Your order "${jobTitle}" is ready for pickup or delivery`,
      type: 'delivery_ready',
      recipient_id: userId,
      related_entity_id: jobId,
      related_entity_type: 'job'
    });
  };

  const notifySystemAlert = async (userId: string, alertMessage: string) => {
    return createNotification({
      title: 'System Alert',
      message: alertMessage,
      type: 'system_alert',
      recipient_id: userId
    });
  };

  const notifyPromotion = async (userId: string, promoTitle: string, promoMessage: string) => {
    return createNotification({
      title: promoTitle,
      message: promoMessage,
      type: 'promotion',
      recipient_id: userId
    });
  };

  const notifyReminder = async (userId: string, reminderMessage: string) => {
    return createNotification({
      title: 'Reminder',
      message: reminderMessage,
      type: 'reminder',
      recipient_id: userId
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
    notifyReminder
  };
}