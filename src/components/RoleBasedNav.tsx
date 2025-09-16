'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Users,
  FileText,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  Database,
  Shield,
  Menu,
  Home,
  Plus,
  CreditCard,
  Bell,
  Building2,
  Printer,
  LogOut,
  User
} from 'lucide-react';
import { useUserRole, type UserRole } from '@/lib/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  description?: string;
}

// Define navigation items for different roles
const navigationItems: NavigationItem[] = [
  // Dashboard - Available to all authenticated users
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['customer', 'staff', 'manager', 'admin', 'super_admin'],
    description: 'Overview and quick actions'
  },

  // Customer Management - Admin and above
  {
    label: 'Customers',
    href: '/dashboard/customers',
    icon: Building2,
    roles: ['manager', 'admin', 'super_admin'],
    description: 'Manage customer relationships'
  },

  // Job Management - Different access levels
  {
    label: 'Jobs',
    href: '/dashboard/jobs',
    icon: FileText,
    roles: ['staff', 'manager', 'admin', 'super_admin'],
    description: 'Track and manage printing jobs'
  },

  // Customer Statements - Staff and above
  {
    label: 'Statements',
    href: '/dashboard/statements',
    icon: FileText,
    roles: ['staff', 'manager', 'admin', 'super_admin'],
    description: 'Customer account statements and balances'
  },

  // Customer's own jobs
  {
    label: 'My Jobs',
    href: '/dashboard/my-jobs',
    icon: Printer,
    roles: ['customer'],
    description: 'View and track your printing jobs'
  },

  // Job Submission - Customers and staff
  {
    label: 'Submit Job',
    href: '/dashboard/submit-job',
    icon: Plus,
    roles: ['customer', 'staff', 'manager', 'admin', 'super_admin'],
    description: 'Create new printing job'
  },

  // Financial Management - Manager and above
  {
    label: 'Finances',
    href: '/dashboard/finances',
    icon: DollarSign,
    roles: ['manager', 'admin', 'super_admin'],
    description: 'Revenue, invoices, and payments'
  },

  // Payments - Customers see their own, others see all
  {
    label: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
    roles: ['customer', 'manager', 'admin', 'super_admin'],
    description: 'Payment history and processing'
  },

  // Inventory - Staff and above
  {
    label: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    roles: ['staff', 'manager', 'admin', 'super_admin'],
    description: 'Stock management and tracking'
  },

  // Analytics - Manager and above
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['manager', 'admin', 'super_admin'],
    description: 'Reports and business insights'
  },

  // User Management - Admin and above
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin', 'super_admin'],
    description: 'Manage user accounts and roles'
  },

  // Notifications - All users
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    roles: ['customer', 'staff', 'manager', 'admin', 'super_admin'],
    description: 'System notifications and alerts'
  },

  // System Settings - Admin and above
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'super_admin'],
    description: 'System configuration and preferences'
  },

  // Database Backup - Super Admin only
  {
    label: 'Database Backup',
    href: '/dashboard/backup',
    icon: Database,
    roles: ['super_admin'],
    description: 'Database backup and restore'
  },

  // Audit Logs - Super Admin only
  {
    label: 'Audit Logs',
    href: '/dashboard/audit',
    icon: Shield,
    roles: ['super_admin'],
    description: 'System audit trail and security logs'
  }
];

interface RoleBasedNavProps {
  className?: string;
}

export default function RoleBasedNav({ className }: RoleBasedNavProps) {
  const { data: userData, isLoading } = useUserRole();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        // Force a hard redirect to clear all client-side state
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to redirect
      window.location.href = '/';
    }
  };

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item => {
    if (!userData?.primary_role) return false;
    return item.roles.includes(userData.primary_role);
  });

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-1 ${mobile ? 'px-4' : ''} flex flex-col h-full`}>
      <div className="flex-1 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${mobile ? 'h-12' : 'h-10'} ${
                  isActive 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
                    : 'text-foreground hover:text-primary hover:bg-accent'
                } transition-all duration-200`}
                onClick={() => mobile && setIsMobileMenuOpen(false)}
              >
                <Icon className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'} mr-3`} />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.label}</span>
                  {mobile && item.description && (
                    <span className="text-xs text-muted-foreground font-normal mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
      
      {/* User Profile and Logout Section */}
      <div className="border-t border-border pt-4 mt-4 space-y-2">
        {/* User Profile Button */}
        <Button
          variant="ghost"
          className={`w-full justify-start ${mobile ? 'h-12' : 'h-10'} text-foreground hover:text-primary hover:bg-accent transition-all duration-200`}
        >
          <User className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'} mr-3`} />
          <div className="flex flex-col items-start">
            <span className="font-medium">Profile</span>
            {mobile && (
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                Account settings and preferences
              </span>
            )}
          </div>
        </Button>
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          className={`w-full justify-start ${mobile ? 'h-12' : 'h-10'} text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200`}
          onClick={handleLogout}
        >
          <LogOut className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'} mr-3`} />
          <div className="flex flex-col items-start">
            <span className="font-medium">Sign Out</span>
            {mobile && (
              <span className="text-xs text-destructive font-normal mt-0.5">
                Logout from your account
              </span>
            )}
          </div>
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="hidden lg:block w-64 bg-background border-r border-border p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-3/4 mb-6"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block w-64 bg-background border-r border-border ${className}`}>
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Jay Kay Digital Press</h2>
            {userData && (
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground truncate">{userData.name || userData.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {userData.primary_role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          <NavItems />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 shadow-md border-black">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-background">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Jay Kay Digital Press</h2>
                {userData && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-foreground truncate">{userData.name || userData.email}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {userData.primary_role?.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
              <NavItems mobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

// Role Badge Component for showing user role
export function RoleBadge({ role }: { role: UserRole }) {
  const roleColors: Record<UserRole, string> = {
    'super_admin': 'bg-destructive/10 text-destructive',
    'admin': 'bg-black text-white',
    'manager': 'bg-red-500/10 text-red-600 dark:text-red-300',
    'staff': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-300',
    'customer': 'bg-gray-500/10 text-gray-600 dark:text-gray-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      roleColors[role] || roleColors.customer
    }`}>
      {role.replace('_', ' ').toUpperCase()}
    </span>
  );
}