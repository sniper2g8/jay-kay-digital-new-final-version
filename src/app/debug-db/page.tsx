"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DiagnosticResult {
  test: string;
  status: "success" | "error" | "warning";
  result: string;
  details: string;
}

export default function DatabaseDiagnosticPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Basic connection
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("count", { count: "exact", head: true });
      diagnosticResults.push({
        test: "Customer Table Count",
        status: error ? "error" : "success",
        result: error ? error.message : `Count: ${data?.length || 0}`,
        details: error
          ? JSON.stringify(error, null, 2)
          : "Connection successful",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      diagnosticResults.push({
        test: "Customer Table Count",
        status: "error",
        result: errorMessage,
        details: JSON.stringify(err, null, 2),
      });
    }

    // Test 2: Get table columns
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .limit(1);
      if (error) {
        diagnosticResults.push({
          test: "Table Schema",
          status: "error",
          result: error.message,
          details: JSON.stringify(error, null, 2),
        });
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        diagnosticResults.push({
          test: "Table Schema",
          status: "success",
          result: `Columns: ${columns.join(", ")}`,
          details:
            data && data.length > 0
              ? JSON.stringify(data[0], null, 2)
              : "No data in table",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      diagnosticResults.push({
        test: "Table Schema",
        status: "error",
        result: errorMessage,
        details: JSON.stringify(err, null, 2),
      });
    }

    // Test 3: Test other tables
    const tableNames = [
      "jobs",
      "invoices",
      "payments",
      "appUsers",
      "roles",
    ] as const;
    for (const tableName of tableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select("count", { count: "exact", head: true });
        diagnosticResults.push({
          test: `${tableName} Table`,
          status: error ? "error" : "success",
          result: error ? error.message : "Accessible",
          details: error
            ? JSON.stringify(error, null, 2)
            : "Table exists and is accessible",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        diagnosticResults.push({
          test: `${tableName} Table`,
          status: "error",
          result: errorMessage,
          details: JSON.stringify(err, null, 2),
        });
      }
    }

    // Test 4: RLS (Row Level Security) check
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      diagnosticResults.push({
        test: "Authentication Status",
        status: user ? "success" : "warning",
        result: user ? `Logged in as: ${user.email}` : "Not authenticated",
        details: user ? JSON.stringify(user, null, 2) : "No active session",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      diagnosticResults.push({
        test: "Authentication Status",
        status: "error",
        result: errorMessage,
        details: JSON.stringify(err, null, 2),
      });
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Diagnostic</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Database Connection Diagnostics</CardTitle>
            <CardDescription>
              Test various database operations to identify issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? "Running Diagnostics..." : "Run Diagnostics"}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.test}</CardTitle>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.status === "success"
                          ? "bg-green-100 text-green-800"
                          : result.status === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-2">{result.result}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      Show Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                      {result.details}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
