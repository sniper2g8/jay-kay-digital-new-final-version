"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthDebugPage() {
  const { user, session, loading } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<{
    session: boolean;
    error: unknown;
    userEmail?: string;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      setSessionCheck({
        session: !!session,
        error,
        userEmail: session?.user?.email,
      });
    };
    checkSession();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Auth Context State:</h3>
          <pre className="text-sm mt-2">
            {JSON.stringify(
              {
                hasUser: !!user,
                userEmail: user?.email,
                hasSession: !!session,
                loading,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Direct Session Check:</h3>
          <pre className="text-sm mt-2">
            {JSON.stringify(sessionCheck, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Actions:</h3>
          <div className="space-x-2 mt-2">
            <button
              onClick={() => (window.location.href = "/auth/login")}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Go to Login
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
