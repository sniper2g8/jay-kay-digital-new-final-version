"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  MessageSquare,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  TestTube,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/lib/hooks/useUserRole";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/app/actions/notificationActions";

interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "job_update"
    | "payment_due"
    | "delivery_ready"
    | "system_alert"
    | "promotion"
    | "reminder";
  recipient_id: string | null;
  related_entity_id: string | null;
  related_entity_type: string | null;
  read_at: string | null;
  email_sent: boolean | null;
  sms_sent: boolean | null;
  created_at: string | null;
}

interface NotificationStats {
  total: number;
  unread: number;
  email_sent: number;
  sms_sent: number;
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    email_sent: 0,
    sms_sent: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { data: userData } = useUserRole();

  // Check if user is admin or above
  const isAdminOrAbove =
    userData?.primary_role === "admin" ||
    userData?.primary_role === "super_admin";

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || notification.type === filterType;
    const matchesRead = filterType === "unread" ? !notification.read_at : true;

    return matchesSearch && matchesType && matchesRead;
  });

  const fetchNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setStats({ total: 0, unread: 0, email_sent: 0, sms_sent: 0 });
      return;
    }

    try {
      setIsLoading(true);

      // Use server action to fetch notifications
      const result = await fetchUserNotifications();

      if (result.success) {
        setNotifications(result.notifications);
        setStats(result.stats);
      } else {
        console.error("Failed to fetch notifications:", result.error);
        // Set empty notifications to prevent UI errors
        setNotifications([]);
        setStats({ total: 0, unread: 0, email_sent: 0, sms_sent: 0 });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Set empty notifications to prevent UI errors
      setNotifications([]);
      setStats({ total: 0, unread: 0, email_sent: 0, sms_sent: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const getTypeColor = (type: string) => {
    switch (type) {
      case "job_update":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "payment_due":
        return "bg-red-100 text-red-800 border-red-200";
      case "delivery_ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "system_alert":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "promotion":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "reminder":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "job_update":
        return <CheckCircle2 className="h-4 w-4" />;
      case "payment_due":
        return <AlertCircle className="h-4 w-4" />;
      case "delivery_ready":
        return <CheckCircle2 className="h-4 w-4" />;
      case "system_alert":
        return <AlertCircle className="h-4 w-4" />;
      case "promotion":
        return <MessageSquare className="h-4 w-4" />;
      case "reminder":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);

      if (!result.success) {
        console.error("Error marking notification as read:", result.error);
        return;
      }

      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotificationHandler = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const result = await deleteNotification(notificationId);

      if (!result.success) {
        console.error("Error deleting notification:", result.error);
        alert("Error deleting notification");
        return;
      }

      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Error deleting notification");
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const result = await markAllNotificationsAsRead();

      if (!result.success) {
        console.error("Error marking all notifications as read:", result.error);
        return;
      }

      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              Stay updated with job status, payments, and system alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchNotifications}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {isAdminOrAbove && (
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/dashboard/notifications/test">
                  <TestTube className="h-4 w-4" />
                  Test Notifications
                </Link>
              </Button>
            )}
            <Button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark All Read
            </Button>
            <Button asChild className="flex items-center gap-2">
              <Link href="/dashboard/notifications/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.unread}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Sent</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.email_sent}
              </div>
              <p className="text-xs text-muted-foreground">Via email</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.sms_sent}
              </div>
              <p className="text-xs text-muted-foreground">Via SMS</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterType === "all" ? "All Types" : formatType(filterType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("unread")}>
                Unread Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("job_update")}>
                Job Updates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("payment_due")}>
                Payment Due
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("delivery_ready")}>
                Delivery Ready
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("system_alert")}>
                System Alerts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("promotion")}>
                Promotions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("reminder")}>
                Reminders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${!notification.read_at ? "border-l-4 border-l-blue-500" : ""}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(notification.type)}
                      <Badge
                        className={getTypeColor(notification.type)}
                        variant="outline"
                      >
                        {formatType(notification.type)}
                      </Badge>
                    </div>
                    {!notification.read_at && (
                      <Badge variant="destructive" className="text-xs">
                        New
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {notification.email_sent && <Mail className="h-3 w-3" />}
                      {notification.sms_sent && (
                        <MessageSquare className="h-3 w-3" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{notification.message}</p>

                  <div className="text-xs text-gray-500">
                    {notification.created_at &&
                      new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotificationHandler(notification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filters"
                    : "You're all caught up!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
