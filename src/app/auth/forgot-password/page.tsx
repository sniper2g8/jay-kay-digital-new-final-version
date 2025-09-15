'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
        setMessage('Check your email for a password reset link.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Jay Kay Digital Press</h1>
          <p className="mt-2 text-gray-600">Professional Printing Solutions</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link 
                href="/auth/login" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
            </div>
            <CardDescription>
              {emailSent 
                ? "We've sent you a password reset link"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium">Email sent successfully!</span>
                  </div>
                </div>
                
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4" />
                  <div className="ml-2">
                    <p className="text-sm text-green-800">
                      We&apos;ve sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Check your email and click the link to reset your password.
                    </p>
                  </div>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setMessage('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send another email
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      href="/auth/login" 
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Back to login
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <p className="text-sm">{error}</p>
                  </Alert>
                )}

                {message && (
                  <Alert className="border-green-200 bg-green-50">
                    <p className="text-sm text-green-800">{message}</p>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/auth/login" 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}