"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserNotifications } from "@/app/actions/notificationActions";

export default function NotificationsDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const runDebug = async () => {
    setLoading(true);
    const debugData: any = {};
    
    try {
      // Check user info
      debugData.userInfo = {
        userId: user?.id,
        userEmail: user?.email,
        hasSession: !!session,
      };
      
      if (!user?.id) {
        debugData.error = "No user ID available";
        setDebugInfo(debugData);
        setLoading(false);
        return;
      }
      
      // Test using server action
      debugData.serverActionTest = await fetchUserNotifications();
      
      // Test direct Supabase query
      debugData.directQueryTest = {};
      
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("recipient_id", user.id)
        .limit(5);
        
      debugData.directQueryTest.result = notificationsData;
      debugData.directQueryTest.error = notificationsError;
      
      // Test if we can access the table at all
      debugData.tableAccessTest = {};
      
      const { data: tableTest, error: tableTestError } = await supabase
        .from("notifications")
        .select("id")
        .limit(1);
        
      debugData.tableAccessTest.result = tableTest;
      debugData.tableAccessTest.error = tableTestError;
      
      // Check user role
      debugData.userRole = {};
      
      const { data: userData, error: userError } = await supabase
        .from("appUsers")
        .select("id, email, name, primary_role")
        .eq("id", user.id)
        .single();
        
      debugData.userRole.result = userData;
      debugData.userRole.error = userError;
      
    } catch (error) {
      debugData.unexpectedError = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error;
    }
    
    setDebugInfo(debugData);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runDebug();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running debug checks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications Debug</h1>
        <p className="text-gray-600">Debugging notification access issues</p>
      </div>
      
      <div className="mb-4">
        <Button onClick={runDebug}>Refresh Debug Info</Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      {debugInfo.serverActionTest && !debugInfo.serverActionTest.success && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">RLS Policy Issue Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-2">
              The error indicates that Row Level Security (RLS) policies are not properly configured for the notifications table.
            </p>
            <p className="text-yellow-700 mb-2">
              Please follow the instructions in <code className="bg-yellow-100 px-1 rounded">FIX_NOTIFICATIONS_RLS.md</code> to fix this issue.
            </p>
            <p className="text-yellow-700">
              Specifically, you need to add policies that allow users to access their own notifications.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}