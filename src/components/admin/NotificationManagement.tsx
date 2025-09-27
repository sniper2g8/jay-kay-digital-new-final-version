/**
 * Admin Panel for Managing Notification Settings and Templates
 * Jay Kay Digital Press - Administrative Interface
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
  Loader2,
  Mail,
  Settings,
  Plus,
  Edit,
  Trash2,
  Send,
  BarChart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string | null;
  created_by?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface EmailNotification {
  id: string;
  type: string;
  recipient_email: string;
  recipient_name?: string | null;
  subject: string;
  sent_at: string;
  resend_id?: string | null;
  status: string | null;
  metadata?: any;
}

interface NotificationStats {
  total_sent: number;
  total_failed: number;
  total_delivered: number;
  success_rate: number;
  recent_activity: EmailNotification[];
}

interface CompanySettings {
  name: string;
  email: string;
  address: string;
  phone: string;
  website?: string;
}

export const NotificationManagement: React.FC = () => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
    type: "custom",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEmailTemplates(),
        loadEmailLogs(),
        loadNotificationStats(),
        loadCompanySettings(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Failed to load notification data" });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading email templates:", error);
      return;
    }

    setEmailTemplates(data || []);
  };

  const loadEmailLogs = async () => {
    const { data, error } = await supabase
      .from("email_notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading email logs:", error);
      return;
    }

    setEmailLogs(data || []);
  };

  const loadCompanySettings = async () => {
    // Since you don't have a company_settings table, use default values
    // These could come from environment variables in a real implementation
    setCompanySettings({
      name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Jay Kay Digital Press",
      email:
        process.env.NEXT_PUBLIC_COMPANY_EMAIL ||
        "noreply@jaykaydigitalpress.com",
      address:
        process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
        "St. Edward School Avenue, By Caritas, Freetown, Sierra Leone",
      phone:
        process.env.NEXT_PUBLIC_COMPANY_PHONE ||
        "+232 34 788711 | +232 30 741062",
      website:
        process.env.NEXT_PUBLIC_COMPANY_WEBSITE || "jaykaydigitalpress.com",
    });
  };

  const loadNotificationStats = async () => {
    try {
      // Get stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("email_notifications")
        .select(
          "id, type, recipient_email, recipient_name, subject, sent_at, resend_id, status, metadata",
        )
        .gte("sent_at", thirtyDaysAgo.toISOString())
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("Error loading notification stats:", error);
        return;
      }

      const notifications = data || [];
      const total_sent = notifications.filter(
        (n) => n.status === "sent",
      ).length;
      const total_failed = notifications.filter(
        (n) => n.status === "failed",
      ).length;
      const total_delivered = notifications.filter(
        (n) => n.status === "delivered",
      ).length;
      const success_rate =
        total_sent > 0 ? ((total_sent - total_failed) / total_sent) * 100 : 0;

      setStats({
        total_sent,
        total_failed,
        total_delivered,
        success_rate: Math.round(success_rate * 100) / 100,
        recent_activity: notifications.slice(0, 10).map((n) => ({
          id: n.id || "unknown",
          type: n.type || "general",
          recipient_email: n.recipient_email || "",
          recipient_name: n.recipient_name || undefined,
          subject: n.subject || "No subject",
          sent_at: n.sent_at || new Date().toISOString(),
          resend_id: n.resend_id || undefined,
          status: n.status || "unknown",
          metadata: n.metadata || {},
        })) as EmailNotification[],
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const openTemplateDialog = (template?: EmailTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type || "custom",
      });
      setIsEditMode(true);
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: "",
        subject: "",
        content: "",
        type: "custom",
      });
      setIsEditMode(false);
    }
    setIsTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    try {
      setMessage(null);

      if (isEditMode && selectedTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            content: templateForm.content,
            type: templateForm.type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedTemplate.id);

        if (error) throw error;
        setMessage({ type: "success", text: "Template updated successfully!" });
      } else {
        const { error } = await supabase.from("email_templates").insert({
          name: templateForm.name,
          subject: templateForm.subject,
          content: templateForm.content,
          type: templateForm.type,
        });

        if (error) throw error;
        setMessage({ type: "success", text: "Template created successfully!" });
      }

      setIsTemplateDialogOpen(false);
      await loadEmailTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      setMessage({ type: "error", text: "Failed to save template" });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      setMessage({ type: "success", text: "Template deleted successfully!" });
      await loadEmailTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      setMessage({ type: "error", text: "Failed to delete template" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      delivered: "bg-blue-100 text-blue-800",
      bounced: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading notification management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Management</h1>
          <p className="text-muted-foreground">
            Manage email templates, view notification logs, and monitor delivery
            statistics
          </p>
        </div>
      </div>

      {message && (
        <Alert
          className={
            message.type === "error" ? "border-red-500" : "border-green-500"
          }
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sent
                  </CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_sent}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.total_failed}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Delivery failures
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.success_rate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Delivery success
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Templates
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {emailTemplates.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active templates
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity</CardTitle>
              <CardDescription>Latest email notifications sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recent_activity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{log.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {log.recipient_name || log.recipient_email} •{" "}
                        {new Date(log.sent_at).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(log.status || "unknown")}
                  </div>
                )) || []}
                {(stats?.recent_activity.length === 0 || !stats) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent email activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Email Templates</h2>
            <Button onClick={() => openTemplateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {emailTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTemplateDialog(template)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Email Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Logs</CardTitle>
              <CardDescription>Complete history of sent emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{log.subject}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          To: {log.recipient_name || log.recipient_email}
                        </span>
                        <span>•</span>
                        <span>Type: {log.type}</span>
                        <span>•</span>
                        <span>{new Date(log.sent_at).toLocaleString()}</span>
                        {log.resend_id && (
                          <>
                            <span>•</span>
                            <span>ID: {log.resend_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(log.status || "unknown")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure global notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Default Email Sender</Label>
                  <Input
                    value={companySettings?.email || "Loading..."}
                    disabled
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={companySettings?.name || "Loading..."}
                    disabled
                  />
                </div>
                <div>
                  <Label>Company Address</Label>
                  <Input
                    value={companySettings?.address || "Loading..."}
                    disabled
                  />
                </div>
                <div>
                  <Label>Company Phone</Label>
                  <Input
                    value={companySettings?.phone || "Loading..."}
                    disabled
                  />
                </div>
                <div>
                  <Label>Default Template Variables</Label>
                  <Textarea
                    value={
                      "{{company_name}}, {{company_address}}, {{company_phone}}, {{company_email}}, {{recipient_name}}"
                    }
                    disabled
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Company settings are automatically loaded from your system
                  configuration.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Create or modify email templates with dynamic variables
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Invoice Notification"
              />
            </div>

            <div>
              <Label htmlFor="template-type">Template Type</Label>
              <Select
                value={templateForm.type}
                onValueChange={(value) =>
                  setTemplateForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_invoice">Send Invoice</SelectItem>
                  <SelectItem value="send_statement">Send Statement</SelectItem>
                  <SelectItem value="payment_receipt">
                    Payment Receipt
                  </SelectItem>
                  <SelectItem value="job_update">Job Update</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={templateForm.subject}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="Use {{variables}} for dynamic content"
              />
            </div>

            <div>
              <Label htmlFor="template-content">Email Content (HTML)</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="HTML content with {{variables}} for dynamic substitution"
                rows={10}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                <strong>Available Variables:</strong>
              </p>
              <p>
                {
                  "{{company_name}}, {{company_address}}, {{company_phone}}, {{company_email}}, {{recipient_name}}, {{subject}}, {{content}}"
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              {isEditMode ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationManagement;
