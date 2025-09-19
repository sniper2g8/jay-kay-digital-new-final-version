import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Settings, 
  Mail, 
  FileText, 
  Users, 
  BarChart3, 
  Database,
  Bell,
  MessageSquare
} from 'lucide-react';

const adminFeatures = [
  {
    title: 'Custom Email System',
    description: 'Send custom emails to customers with template management',
    href: '/admin/email',
    icon: Mail,
    color: 'bg-blue-500'
  },
  {
    title: 'Notification Logs',
    description: 'Monitor and track all email notifications sent from the system',
    href: '/admin/notifications',
    icon: Bell,
    color: 'bg-green-500'
  },
  {
    title: 'Customer Management',
    description: 'Manage customer accounts, permissions, and data',
    href: '/admin/customers',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    title: 'System Reports',
    description: 'View analytics, usage reports, and system performance',
    href: '/admin/reports',
    icon: BarChart3,
    color: 'bg-orange-500'
  },
  {
    title: 'Database Management',
    description: 'Manage database connections, migrations, and data',
    href: '/admin/database',
    icon: Database,
    color: 'bg-red-500'
  },
  {
    title: 'System Settings',
    description: 'Configure system-wide settings and preferences',
    href: '/admin/settings',
    icon: Settings,
    color: 'bg-gray-500'
  }
];

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your JayKay Digital Press system and operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${feature.color} text-white group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Customers</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Emails Sent Today</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-green-600">100%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job status email sent to john@example.com</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New customer registration: Sarah Wilson</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job #1234 moved to &quot;Printing&quot; status</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}