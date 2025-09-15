'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log('ProtectedRoute - Auth state check:', { user: !!user, loading });
    
    if (!loading) {
      if (!user) {
        console.log('ProtectedRoute - No user, redirecting to login');
        // Not authenticated - redirect to login
        router.push(redirectTo);
      } else if (requiredRole) {
        // TODO: Check user role when we implement role system
        // For now, allow all authenticated users
        console.log('ProtectedRoute - User authenticated, role check passed');
        setChecking(false);
      } else {
        // Authenticated and no role required
        console.log('ProtectedRoute - User authenticated, no role required');
        setChecking(false);
      }
    }
  }, [user, loading, requiredRole, router, redirectTo]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
