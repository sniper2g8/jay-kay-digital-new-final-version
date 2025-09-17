"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const resetError = () => {
        this.setState({ hasError: false, error: undefined });
      };

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const isAuthError =
    error.message.includes("refresh token") ||
    error.message.includes("Invalid Refresh Token");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle>
              {isAuthError ? "Authentication Issue" : "Something went wrong"}
            </CardTitle>
          </div>
          <CardDescription>
            {isAuthError
              ? "There was an issue with the authentication system. This is normal for development."
              : "An unexpected error occurred while loading the application."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Development Note:</strong> This authentication error is
                expected when accessing the dashboard without proper login. The
                system is configured to work with anonymous access for now.
              </p>
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-3">
            <p className="text-xs text-gray-600 font-mono break-all">
              {error.message}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>

          {isAuthError && (
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
