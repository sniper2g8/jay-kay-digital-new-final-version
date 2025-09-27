/**
 * Notification Management Component
 * Provides controls for testing and managing notifications
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Send,
  Mail,
  MessageSquare,
  Bell,
  CheckCircle,
} from "lucide-react";

interface NotificationTestProps {
  className?: string;
}

type NotificationType =
  | "job_submission"
  | "job_status_change"
  | "payment_recorded"
  | "invoice_generated";
type RecipientType = "admin" | "customer";

const NotificationManager: React.FC<NotificationTestProps> = ({
  className = "",
}) => {
  // Use useEffect to ensure client-side only initialization
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form state
  const [notificationType, setNotificationType] =
    useState<NotificationType>("job_submission");
  const [recipientType, setRecipientType] = useState<RecipientType>("customer");
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSendTestNotification = async () => {
    if (!isClient) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: notificationType,
          recipient_type: recipientType,
          email: testEmail || undefined,
          phone: testPhone || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Test notification sent successfully to ${recipientType}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to send test notification",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error occurred while sending test notification",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypeLabels = {
    job_submission: "Job Submission",
    job_status_change: "Job Status Change",
    payment_recorded: "Payment Recorded",
    invoice_generated: "Invoice Generated",
  };

  const notificationDescriptions = {
    job_submission: "Sent when a customer submits a new job",
    job_status_change: "Sent when job status is updated",
    payment_recorded: "Sent when a payment is recorded",
    invoice_generated: "Sent when a new invoice is created",
  };

  // Render nothing on server, only on client
  if (!isClient) {
    return <div className={`space-y-6 ${className}`}></div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Notification Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send test notifications to verify email and SMS functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select
                value={notificationType}
                onValueChange={(value: NotificationType) =>
                  setNotificationType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(notificationTypeLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value as NotificationType}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {notificationDescriptions[notificationType]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-type">Recipient Type</Label>
              <Select
                value={recipientType}
                onValueChange={(value: RecipientType) =>
                  setRecipientType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email (Optional)</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex items-center gap-2"
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to use default test email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-phone">Test Phone (Optional)</Label>
              <Input
                id="test-phone"
                type="tel"
                placeholder="+232 XX XXX XXX"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Include country code (+232 for Sierra Leone)
              </p>
            </div>
          </div>

          <Button
            onClick={handleSendTestNotification}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Notification
              </>
            )}
          </Button>

          {testResult && (
            <Alert
              className={
                testResult.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-red-600" />
                )}
                <AlertDescription
                  className={
                    testResult.success ? "text-green-800" : "text-red-800"
                  }
                >
                  {testResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notification Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            Current status of notification services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">SMS Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Configured
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Configuration Note
            </h4>
            <p className="text-sm text-blue-800">
              Email notifications are ready to use. SMS notifications require
              Twilio configuration in environment variables. Contact your system
              administrator to set up SMS service credentials.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Templates Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Templates</CardTitle>
          <CardDescription>
            Preview of notification templates for different events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Job Submission Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  Customer confirmation when job is submitted
                </p>
              </div>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Job Status Update</h4>
                <p className="text-sm text-muted-foreground">
                  Notification when job status changes
                </p>
              </div>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Payment Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  Receipt confirmation for payments
                </p>
              </div>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">New Invoice</h4>
                <p className="text-sm text-muted-foreground">
                  Customer notification for new invoices
                </p>
              </div>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManager;
