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

interface TestResults {
  connection: string;
  customers: {
    count: number;
    sample: { human_id: string | null; business_name: string }[];
    error: string | null;
  };
  jobs: {
    accessible: boolean;
    error: string | null;
  };
  invoices: {
    accessible: boolean;
    error: string | null;
  };
  payments: {
    accessible: boolean;
    error: string | null;
  };
}

export default function SupabaseConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Test 1: Basic configuration check
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log("Key (first 20 chars):", key?.substring(0, 20) + "...");

      if (!url || !key) {
        throw new Error(
          "Missing Supabase configuration. Check your .env.local file.",
        );
      }

      // Test 2: Simple query to customers table

      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("human_id, business_name")
        .limit(5);

      if (customersError) {
        console.error("Customers query error details:");
        console.error("- Error object:", customersError);
        console.error("- Error message:", customersError.message);
        console.error("- Error code:", customersError.code);
        console.error("- Error details:", customersError.details);
        console.error("- Error hint:", customersError.hint);
        console.error(
          "- Error stringified:",
          JSON.stringify(customersError, null, 2),
        );

        // Try to extract more information
        const errorKeys = Object.keys(customersError);
        console.error("- Error object keys:", errorKeys);

        throw new Error(
          `Customers query failed: ${customersError.message || "Unknown error"}`,
        );
      }

      // Test 3: Count query

      const { count, error: countError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("Count query error:", countError);
        console.error("Count query error message:", countError.message);
        throw new Error(`Count query failed: ${countError.message}`);
      }

      // Test 4: Test other tables

      const { error: jobsError } = await supabase
        .from("jobs")
        .select("job_human_id")
        .limit(1);

      const { error: invoicesError } = await supabase
        .from("invoices")
        .select("invoice_no")
        .limit(1);

      const { error: paymentsError } = await supabase
        .from("payments")
        .select("id")
        .limit(1);

      setResults({
        connection: "SUCCESS",
        customers: {
          count: count || 0,
          sample: customers || [],
          error: null,
        },
        jobs: {
          accessible: !jobsError,
          error: jobsError?.message || null,
        },
        invoices: {
          accessible: !invoicesError,
          error: invoicesError?.message || null,
        },
        payments: {
          accessible: !paymentsError,
          error: paymentsError?.message || null,
        },
      });
    } catch (err) {
      console.error("Connection test failed with error:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);

      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }

      // Try to get more error details
      try {
        console.error("Error as JSON:", JSON.stringify(err, null, 2));
      } catch (jsonErr) {
        console.error("Could not stringify error:", jsonErr);
      }

      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test the connection to your Supabase database and verify table access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testConnection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Testing Connection..." : "Test Supabase Connection"}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800">Connection Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800">
                Connection Status: {results.connection}
              </h3>
            </div>

            <div className="grid gap-3">
              <div className="p-3 border rounded-md">
                <h4 className="font-semibold">Customers Table</h4>
                <p>Total Records: {results.customers.count}</p>
                <p>Sample Records: {results.customers.sample.length}</p>
                {results.customers.error && (
                  <p className="text-red-600">
                    Error: {results.customers.error}
                  </p>
                )}
                {results.customers.sample.length > 0 && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(results.customers.sample, null, 2)}
                  </pre>
                )}
              </div>

              <div className="p-3 border rounded-md">
                <h4 className="font-semibold">Other Tables</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    Jobs:{" "}
                    {results.jobs.accessible
                      ? "✅ Accessible"
                      : "❌ Error: " + results.jobs.error}
                  </p>
                  <p>
                    Invoices:{" "}
                    {results.invoices.accessible
                      ? "✅ Accessible"
                      : "❌ Error: " + results.invoices.error}
                  </p>
                  <p>
                    Payments:{" "}
                    {results.payments.accessible
                      ? "✅ Accessible"
                      : "❌ Error: " + results.payments.error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
