"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Database,
} from "lucide-react";

interface DatabaseTest {
  name: string;
  status: "pending" | "success" | "error";
  message?: string;
  details?: string;
}

export default function DatabaseConnectionTest() {
  const [tests, setTests] = useState<DatabaseTest[]>([
    { name: "Supabase Connection", status: "pending" },
    { name: "Customers Table Access", status: "pending" },
    { name: "Jobs Table Access", status: "pending" },
    { name: "Payments Table Access", status: "pending" },
    { name: "Invoices Table Access", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<DatabaseTest>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test)),
    );
  };

  const runTests = async () => {
    setIsRunning(true);

    // Test 1: Supabase Connection
    try {
      const { error } = await supabase
        .from("customers")
        .select("count", { count: "exact", head: true });
      if (error) {
        updateTest(0, {
          status: "error",
          message: "Connection failed",
          details: error.message,
        });
      } else {
        updateTest(0, {
          status: "success",
          message: "Connected successfully",
        });
      }
    } catch (error) {
      updateTest(0, {
        status: "error",
        message: "Connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 2: Customers Table
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("customer_human_id, business_name")
        .limit(1);

      if (error) {
        updateTest(1, {
          status: "error",
          message: "Access denied",
          details: error.message,
        });
      } else {
        updateTest(1, {
          status: "success",
          message: `Found ${data?.length || 0} customers`,
        });
      }
    } catch (error) {
      updateTest(1, {
        status: "error",
        message: "Query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 3: Jobs Table
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("jobNo, title")
        .limit(1);

      if (error) {
        updateTest(2, {
          status: "error",
          message: "Access denied",
          details: error.message,
        });
      } else {
        updateTest(2, {
          status: "success",
          message: `Found ${data?.length || 0} jobs`,
        });
      }
    } catch (error) {
      updateTest(2, {
        status: "error",
        message: "Query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 4: Payments Table
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("payment_number, amount")
        .limit(1);

      if (error) {
        updateTest(3, {
          status: "error",
          message: "Access denied",
          details: error.message,
        });
      } else {
        updateTest(3, {
          status: "success",
          message: `Found ${data?.length || 0} payments`,
        });
      }
    } catch (error) {
      updateTest(3, {
        status: "error",
        message: "Query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 5: Invoices Table
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_no, amount")
        .limit(1);

      if (error) {
        updateTest(4, {
          status: "error",
          message: "Access denied",
          details: error.message,
        });
      } else {
        updateTest(4, {
          status: "success",
          message: `Found ${data?.length || 0} invoices`,
        });
      }
    } catch (error) {
      updateTest(4, {
        status: "error",
        message: "Query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    const performTests = async () => {
      await runTests();
    };
    performTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: DatabaseTest["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DatabaseTest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Testing...</Badge>;
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Database Connection Test</CardTitle>
          </div>
          <CardDescription>
            Testing connectivity to Supabase database and table access
            permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Test Results</span>
              <div className="flex space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {successCount} Success
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">{errorCount} Failed</Badge>
                )}
              </div>
            </div>

            {/* Individual Tests */}
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-gray-600">
                        {test.message}
                      </div>
                    )}
                    {test.details && (
                      <div className="text-xs text-red-600 font-mono mt-1">
                        {test.details}
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Run Tests Again"
                )}
              </Button>

              {errorCount === 0 && successCount === tests.length && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard")}
                  className="flex-1"
                >
                  Continue to Dashboard
                </Button>
              )}
            </div>

            {/* Help */}
            {errorCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Troubleshooting
                  </span>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    • Check if RLS (Row Level Security) policies allow anonymous
                    access
                  </p>
                  <p>
                    • Verify that the NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
                  </p>
                  <p>• Ensure the database URL is accessible</p>
                  <p>• Check Supabase dashboard for any service issues</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
