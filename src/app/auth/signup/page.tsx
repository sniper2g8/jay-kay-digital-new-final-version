'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, User, Mail, Lock } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Note: User needs to verify email before they can sign in
        setTimeout(() => {
          router.push('/auth/login?message=Please check your email to verify your account');
        }, 3000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto bg-red-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <img 
                src="/JK_Logo.jpg" 
                alt="Jay Kay Digital Press Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Jay Kay Digital Press</h1>
            <p className="text-gray-600 mt-2">Professional Printing Services</p>
          </div>
          
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 text-center bg-green-600 text-white py-6">
              <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold">
                Account Created!
              </CardTitle>
              <CardDescription className="text-green-100">
                Please verify your email
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  We&apos;ve sent a verification link to <strong className="text-red-600">{email}</strong>
                </p>
                <p className="text-gray-600 mb-6">
                  Please check your email and click the verification link to activate your account.
                </p>
                <Link href="/auth/login">
                  <Button className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-lg text-lg font-semibold">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-red-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <img 
              src="/JK_Logo.jpg" 
              alt="Jay Kay Digital Press Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Jay Kay Digital Press</h1>
          <p className="text-gray-600 mt-2">Professional Printing Services</p>
        </div>
        
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center bg-red-600 text-white py-6">
            <CardTitle className="text-2xl font-bold">
              Create Account
            </CardTitle>
            <CardDescription className="text-red-100">
              Join our printing service platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-lg">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 py-6 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 py-6 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 py-6 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 pr-10 py-6 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
                    suppressHydrationWarning={true}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">At least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 pr-10 py-6 rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500"
                    suppressHydrationWarning={true}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-lg text-lg font-semibold transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pb-6">
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Jay Kay Digital Press. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}