"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Bell
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type EmailNotification = Database['public']['Tables']['email_notifications']['Row'];
type SystemNotification = Database['public']['Tables']['notifications']['Row'];

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  today: number;
  thisWeek: number;
  byType: { [key: string]: number };
}

export default function AdminNotificationLogs() {
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    failed: 0,
    today: 0,
    thisWeek: 0,
    byType: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | SystemNotification | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'system'>('email');

  const loadEmailNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('email_notifications')
        .select('*')
        .order('sent_at', { ascending: false });

      // Apply filters
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('sent_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      const filteredData = data?.filter(notification => 
        searchTerm === '' || 
        notification.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.recipient_name && notification.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        notification.subject.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

      setEmailNotifications(filteredData);
      calculateStats(filteredData);

    } catch (err: any) {
      console.error('Error loading email notifications:', err);
      setError('Failed to load email notification logs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (typeFilter !== 'all') {
        // Type assertion to avoid TypeScript error
        query = query.eq('type', typeFilter as any);
      }
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) {
        if (error.message.includes('permission denied') || error.code === '42501') {
          throw new Error('Permission denied - RLS policies need to be configured for notifications table. Please check the FIX_NOTIFICATIONS_RLS.md file for instructions.');
        }
        throw error;
      }

      const filteredData = data?.filter(notification => 
        searchTerm === '' || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

      setSystemNotifications(filteredData);

    } catch (err: any) {
      console.error('Error loading system notifications:', err);
      setError(err.message || 'Failed to load system notification logs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (activeTab === 'email') {
      await loadEmailNotifications();
    } else {
      await loadSystemNotifications();
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab, typeFilter, statusFilter, dateRange, searchTerm]);

  const calculateStats = (data: EmailNotification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: NotificationStats = {
      total: data.length,
      sent: data.filter(n => n.status === 'sent').length,
      failed: data.filter(n => n.status === 'failed').length,
      today: data.filter(n => new Date(n.sent_at) >= today).length,
      thisWeek: data.filter(n => new Date(n.sent_at) >= weekAgo).length,
      byType: {}
    };

    // Calculate by type
    data.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    setStats(stats);
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'job_created': 'Job Created',
      'job_status_change': 'Status Update',
      'payment_received': 'Payment Received',
      'statement_ready': 'Statement Ready',
      'invoice_sent': 'Invoice Sent',
      'custom_email': 'Custom Email'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string | null) => {
    // Handle null status
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportNotifications = () => {
    const dataToExport = activeTab === 'email' ? emailNotifications : systemNotifications;
    let csvContent = '';
    
    if (activeTab === 'email') {
      csvContent = [
        ['Date', 'Type', 'Recipient Email', 'Recipient Name', 'Subject', 'Status', 'Resend ID'].join(','),
        ...(dataToExport as EmailNotification[]).map(n => [
          new Date(n.sent_at).toLocaleDateString(),
          getTypeLabel(n.type),
          n.recipient_email,
          n.recipient_name || '',
          `"${n.subject}"`,
          n.status,
          n.resend_id || ''
        ].join(','))
      ].join('\n');
    } else {
      csvContent = [
        ['Date', 'Type', 'Title', 'Message', 'Status', 'Read'].join(','),
        ...(dataToExport as SystemNotification[]).map(n => [
          n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A',
          n.type || '',
          `"${n.title || ''}"`,
          `"${n.message || ''}"`,
          n.read_at ? 'Read' : 'Unread',
          n.read_at ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Notification Logs</h1>
            <p className="text-gray-600">Monitor and track all system and email notifications</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportNotifications} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs for Email vs System Notifications */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'email'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('email')}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          Email Notifications
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'system'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('system')}
        >
          <Bell className="h-4 w-4 inline mr-2" />
          System Notifications
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job_created">Job Created</SelectItem>
                  <SelectItem value="job_status_change">Status Update</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="statement_ready">Statement Ready</SelectItem>
                  <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                  <SelectItem value="custom_email">Custom Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === 'email' && (
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'email' ? 'Email Notifications' : 'System Notifications'} ({activeTab === 'email' ? emailNotifications.length : systemNotifications.length})
          </CardTitle>
          <CardDescription>
            {activeTab === 'email' 
              ? 'Recent email notifications sent from the system' 
              : 'Recent system notifications generated by the application'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading notifications...
            </div>
          ) : activeTab === 'email' ? (
            emailNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No email notifications found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Recipient</th>
                      <th className="text-left p-3 font-medium">Subject</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailNotifications.map((notification) => (
                      <tr key={notification.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {new Date(notification.sent_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {notification.recipient_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {notification.recipient_email}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs truncate">
                          {notification.subject}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(notification.status)}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : systemNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No system notifications found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Message</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {systemNotifications.map((notification) => (
                    <tr key={notification.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{notification.type || 'N/A'}</Badge>
                      </td>
                      <td className="p-3 max-w-xs truncate">
                        {notification.title || 'N/A'}
                      </td>
                      <td className="p-3 max-w-md truncate">
                        {notification.message || 'N/A'}
                      </td>
                      <td className="p-3">
                        {notification.read_at ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />Read
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />Unread
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Email Distribution by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{getTypeLabel(type)}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-10">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {activeTab === 'email' 
                        ? 'Email Notification Details' 
                        : 'System Notification Details'}
                    </CardTitle>
                    <CardDescription>
                      Detailed information about this notification
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {'recipient_email' in selectedNotification ? (
                  // Email notification details
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Recipient Email</label>
                        <p>{selectedNotification.recipient_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Recipient Name</label>
                        <p>{selectedNotification.recipient_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Sent At</label>
                        <p>{new Date(selectedNotification.sent_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p>{selectedNotification.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Resend ID</label>
                        <p className="text-xs font-mono">{selectedNotification.resend_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subject</label>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedNotification.subject}</p>
                    </div>
                    {selectedNotification.metadata && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Metadata</label>
                        <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(selectedNotification.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  // System notification details
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Title</label>
                        <p>{selectedNotification.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p>{selectedNotification.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created At</label>
                        <p>{selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p>
                          {selectedNotification.read_at ? 'Read' : 'Unread'}
                          {selectedNotification.read_at && ` on ${new Date(selectedNotification.read_at).toLocaleString()}`}
                        </p>
                      </div>
                      {selectedNotification.related_entity_id && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Related Entity</label>
                          <p>{selectedNotification.related_entity_type}: {selectedNotification.related_entity_id}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Message</label>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedNotification.message}</p>
                    </div>
                    {selectedNotification.email_sent && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Email notification sent
                      </div>
                    )}
                    {selectedNotification.sms_sent && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        SMS notification sent
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
