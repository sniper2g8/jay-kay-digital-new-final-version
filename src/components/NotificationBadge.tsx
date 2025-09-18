'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'job_update' | 'payment_due' | 'delivery_ready' | 'system_alert' | 'promotion' | 'reminder';
  read_at: string | null;
  created_at: string | null;
}

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { getUnreadCount, getNotifications, markAsRead } = useNotifications();
  const router = useRouter();

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const count = await getUnreadCount(); // Removed user.id parameter
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.id,
        error: error
      });
      setUnreadCount(0);
    }
  }, [user?.id, getUnreadCount]);

  const fetchRecentNotifications = useCallback(async () => {
    if (!user?.id) {
      setRecentNotifications([]);
      return;
    }
    
    try {
      const notifications = await getNotifications(undefined, { limit: 5 }); // Removed user.id parameter
      setRecentNotifications(notifications as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.id,
        error: error
      });
      setRecentNotifications([]);
    }
  }, [user?.id, getNotifications]);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      fetchRecentNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
            fetchRecentNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Reset state when user is not available
      setUnreadCount(0);
      setRecentNotifications([]);
    }
  }, [user, fetchUnreadCount, fetchRecentNotifications]);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId); // Removed user ID parameter
    await fetchUnreadCount();
    await fetchRecentNotifications();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job_update': return 'text-blue-600';
      case 'payment_due': return 'text-red-600';
      case 'delivery_ready': return 'text-green-600';
      case 'system_alert': return 'text-orange-600';
      case 'promotion': return 'text-purple-600';
      case 'reminder': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {recentNotifications.length > 0 ? (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-medium truncate ${getTypeColor(notification.type)}`}>
                        {notification.title}
                      </h4>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-blue-600 cursor-pointer"
              onClick={() => router.push('/dashboard/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled className="text-center text-gray-500">
            No notifications
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}