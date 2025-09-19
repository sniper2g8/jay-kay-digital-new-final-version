"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Globe, 
  Key, 
  Database, 
  Bell, 
  Shield, 
  Save,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle,
  Download,
  Upload,
  ArrowLeft
} from "lucide-react";

interface SiteSettings {
  company_name: string;
  company_logo: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  business_hours: string;
  timezone: string;
  currency: string;
  language: string;
  theme: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  job_updates: boolean;
  payment_reminders: boolean;
  low_stock_alerts: boolean;
  system_alerts: boolean;
  marketing_emails: boolean;
}

interface BackupSettings {
  auto_backup: boolean;
  backup_frequency: string;
  backup_retention: number;
  backup_location: string;
  last_backup: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    company_name: "Jay Kay Digital Press",
    company_logo: "",
    company_address: "123 Business St, City, State 12345",
    company_phone: "(555) 123-4567",
    company_email: "info@jaykaydigitalpress.com",
    business_hours: "Mon-Fri 9AM-6PM",
    timezone: "GMT",
    currency: "SLL",
    language: "en",
    theme: "light"
  });

  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "1",
      name: "Frontend API",
      key: "jkdp_sk_1234567890abcdef",
      permissions: ["read", "write"],
      created_at: "2024-01-15T10:30:00Z",
      last_used: "2024-01-20T14:22:00Z",
      is_active: true
    },
    {
      id: "2", 
      name: "Mobile App",
      key: "jkdp_sk_abcdef1234567890",
      permissions: ["read"],
      created_at: "2024-01-10T08:15:00Z",
      last_used: null,
      is_active: false
    }
  ]);

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    job_updates: true,
    payment_reminders: true,
    low_stock_alerts: true,
    system_alerts: true,
    marketing_emails: false
  });

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    auto_backup: true,
    backup_frequency: "daily",
    backup_retention: 30,
    backup_location: "cloud",
    last_backup: "2024-01-20T02:00:00Z"
  });

  // Dialog states
  const [isAddApiKeyOpen, setIsAddApiKeyOpen] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    permissions: [] as string[]
  });

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // Here you would typically save to database
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const keyLength = 32;
    let result = 'jkdp_sk_';
    
    for (let i = 0; i < keyLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };

  const handleCreateApiKey = () => {
    if (!newApiKey.name || newApiKey.permissions.length === 0) {
      alert('Please provide a name and select permissions');
      return;
    }

    const apiKey: APIKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      key: generateApiKey(),
      permissions: newApiKey.permissions,
      created_at: new Date().toISOString(),
      last_used: null,
      is_active: true
    };

    setApiKeys(prev => [...prev, apiKey]);
    setIsAddApiKeyOpen(false);
    setNewApiKey({ name: "", permissions: [] });
  };

  const handleToggleApiKey = (id: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === id ? { ...key, is_active: !key.is_active } : key
    ));
  };

  const handleDeleteApiKey = (id: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(prev => prev.filter(key => key.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 12) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const handleRunBackup = async () => {
    try {
      setLoading(true);
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setBackupSettings(prev => ({
        ...prev,
        last_backup: new Date().toISOString()
      }));
      
      alert('Backup completed successfully!');
    } catch (error) {
      console.error('Error running backup:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your application settings and preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          {saved && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details and branding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={siteSettings.company_name}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={siteSettings.company_email}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, company_email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_phone">Phone Number</Label>
                  <Input
                    id="company_phone"
                    value={siteSettings.company_phone}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, company_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="business_hours">Business Hours</Label>
                  <Input
                    id="business_hours"
                    value={siteSettings.business_hours}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, business_hours: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_address">Company Address</Label>
                <Input
                  id="company_address"
                  value={siteSettings.company_address}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, company_address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={siteSettings.timezone}
                    onValueChange={(value) => setSiteSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                      <SelectItem value="Africa/Accra">GMT (West Africa Time)</SelectItem>
                      <SelectItem value="Africa/Freetown">GMT (Sierra Leone Time)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={siteSettings.currency}
                    onValueChange={(value) => setSiteSettings(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLL">SLL (Le)</SelectItem>
                      <SelectItem value="GHS">GHS (₵)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={siteSettings.theme}
                    onValueChange={(value) => setSiteSettings(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => handleSaveSettings()}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>Manage API keys for external integrations</CardDescription>
                </div>
                <Dialog open={isAddApiKeyOpen} onOpenChange={setIsAddApiKeyOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Generate a new API key for external services
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api_name">Key Name</Label>
                        <Input
                          id="api_name"
                          placeholder="e.g., Frontend App, Mobile App"
                          value={newApiKey.name}
                          onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Permissions</Label>
                        <div className="space-y-2 mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newApiKey.permissions.includes('read')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, 'read']
                                  }));
                                } else {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== 'read')
                                  }));
                                }
                              }}
                            />
                            <span>Read Access</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newApiKey.permissions.includes('write')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, 'write']
                                  }));
                                } else {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== 'write')
                                  }));
                                }
                              }}
                            />
                            <span>Write Access</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newApiKey.permissions.includes('admin')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, 'admin']
                                  }));
                                } else {
                                  setNewApiKey(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== 'admin')
                                  }));
                                }
                              }}
                            />
                            <span>Admin Access</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateApiKey} className="flex-1">
                          Create Key
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddApiKeyOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{apiKey.name}</h3>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created {formatDate(apiKey.created_at)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last used {formatDate(apiKey.last_used)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleApiKey(apiKey.id)}
                        >
                          {apiKey.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">API Key:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                          {showApiKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showApiKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Permissions:</span>
                        <div className="flex gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      email_notifications: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Job Updates</h4>
                    <p className="text-sm text-gray-500">Notifications for job status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.job_updates}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      job_updates: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Reminders</h4>
                    <p className="text-sm text-gray-500">Reminders for outstanding payments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.payment_reminders}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      payment_reminders: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Low Stock Alerts</h4>
                    <p className="text-sm text-gray-500">Alerts when inventory is running low</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.low_stock_alerts}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      low_stock_alerts: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">System Alerts</h4>
                    <p className="text-sm text-gray-500">Important system notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.system_alerts}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      system_alerts: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-gray-500">Product updates and promotional content</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.marketing_emails}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      marketing_emails: e.target.checked
                    }))}
                    className="h-4 w-4"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => handleSaveSettings()}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Recovery
              </CardTitle>
              <CardDescription>Configure automatic backups and manage data recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Backup</h4>
                      <p className="text-sm text-gray-500">Automatically backup your data</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={backupSettings.auto_backup}
                      onChange={(e) => setBackupSettings(prev => ({
                        ...prev,
                        auto_backup: e.target.checked
                      }))}
                      className="h-4 w-4"
                    />
                  </div>

                  <div>
                    <Label htmlFor="backup_frequency">Backup Frequency</Label>
                    <Select
                      value={backupSettings.backup_frequency}
                      onValueChange={(value) => setBackupSettings(prev => ({ ...prev, backup_frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="backup_retention">Retention Period (days)</Label>
                    <Input
                      id="backup_retention"
                      type="number"
                      value={backupSettings.backup_retention}
                      onChange={(e) => setBackupSettings(prev => ({
                        ...prev,
                        backup_retention: parseInt(e.target.value) || 30
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="backup_location">Backup Location</Label>
                    <Select
                      value={backupSettings.backup_location}
                      onValueChange={(value) => setBackupSettings(prev => ({ ...prev, backup_location: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                        <SelectItem value="local">Local Storage</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Backup Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Backup:</span>
                        <span className="text-sm font-medium">
                          {formatDate(backupSettings.last_backup)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Up to date
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="text-sm font-medium capitalize">
                          {backupSettings.backup_location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleRunBackup}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Run Backup Now
                  </Button>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => handleSaveSettings()}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage security preferences and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Session Management</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Manage active sessions and login history
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      View Sessions
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Revoke All Sessions
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Password Policy</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure password requirements for users
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                      <span className="text-sm">Minimum 8 characters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                      <span className="text-sm">Require uppercase letters</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                      <span className="text-sm">Require numbers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-sm">Require special characters</span>
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Activity Logs</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Monitor system activity and user actions
                  </p>
                  <Button variant="outline">
                    View Activity Logs
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => handleSaveSettings()}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}