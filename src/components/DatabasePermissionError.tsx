"use client";

import { AlertTriangle, Shield, Database, Key } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DatabasePermissionErrorProps {
  error?: string;
  onRetry?: () => void;
}

export default function DatabasePermissionError({
  error,
  onRetry,
}: DatabasePermissionErrorProps) {
  const isPermissionError =
    error?.includes("permission denied") || error?.includes("42501");
  const isRLSError =
    error?.includes("Row Level Security") || error?.includes("access denied");

  if (!isPermissionError && !isRLSError) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800">
            Database Permission Required
          </CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          Your database has Row Level Security (RLS) enabled, which is great for
          security!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-md border border-amber-200">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            What&apos;s happening?
          </h4>
          <p className="text-sm text-amber-700 mt-2">
            Anonymous users cannot access the database tables because Row Level
            Security (RLS) policies are protecting your data. This is a security
            feature, not an error.
          </p>
        </div>

        <div className="bg-white p-4 rounded-md border border-amber-200">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2">
            <Database className="h-4 w-4" />
            How to fix this?
          </h4>
          <div className="text-sm text-amber-700 mt-2 space-y-2">
            <p>
              <strong>Option 1 (Recommended):</strong> Implement proper user
              authentication
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Add login/signup functionality</li>
              <li>Create RLS policies based on user roles</li>
              <li>Secure access to sensitive data</li>
            </ul>

            <p>
              <strong>Option 2 (Development only):</strong> Enable anonymous
              access
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Run the SQL script in <code>enable-anonymous-access.sql</code>
              </li>
              <li>Go to your Supabase dashboard → SQL Editor</li>
              <li>Execute the provided SQL commands</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-amber-200">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Quick Test
          </h4>
          <p className="text-sm text-amber-700 mt-2">
            After applying the SQL script or implementing authentication, click
            the button below to test the connection.
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              Test Connection Again
            </Button>
          )}
        </div>

        {error && (
          <details className="bg-gray-50 p-3 rounded-md">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              View Error Details
            </summary>
            <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
              {error}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
