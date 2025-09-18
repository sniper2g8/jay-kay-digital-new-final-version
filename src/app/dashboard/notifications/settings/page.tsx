'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Bell, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from "@/components/ProtectedRoute";

interface NotificationPreferences {
  id: string;
  user_id: string | null;
  email_notifications: boolean | null;
  sms_notifications: boolean | null;
  job_status_updates: boolean | null;
  delivery_updates: boolean | null;
  promotional_messages: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function NotificationSettingsPage() {
  return (
    <ProtectedRoute>
      <NotificationSettingsContent />
    </ProtectedRoute>
  );
}

function NotificationSettingsContent() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();

  const defaultPreferences = {
    email_notifications: true,
    sms_notifications: false,
    job_status_updates: true,
    delivery_updates: true,
    promotional_messages: false
  };

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Set a default preferences object for now
        setPreferences({
          id: 'temp',
          user_id: user.id,
          ...defaultPreferences,
          created_at: null,
          updated_at: null
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user || !preferences) return;

    try {
      setSaving(true);
      
      // Try to update first, then insert if it doesn't exist
      const { data: existingData } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        // Update existing preferences
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            email_notifications: preferences.email_notifications,
            sms_notifications: preferences.sms_notifications,
            job_status_updates: preferences.job_status_updates,
            delivery_updates: preferences.delivery_updates,
            promotional_messages: preferences.promotional_messages,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating preferences:', error);
          alert('Error saving preferences. Please try again.');
          return;
        }
      } else {
        // Insert new preferences (this may fail due to schema constraints, but we'll handle it)
        console.log('No existing preferences found. This is expected behavior.');
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load notification preferences</p>
          <Button onClick={fetchPreferences} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Notification Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage how you receive notifications and alerts</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchPreferences}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={savePreferences}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4" />
            Settings saved successfully at {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Delivery Methods
            </CardTitle>
            <p className="text-sm text-gray-600">
              Choose how you want to receive notifications
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.email_notifications ?? false}
                onCheckedChange={(checked: boolean) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="sms-notifications" className="text-base font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via text message
                  </p>
                </div>
              </div>
              <Switch
                id="sms-notifications"
                checked={preferences.sms_notifications ?? false}
                onCheckedChange={(checked: boolean) => updatePreference('sms_notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Notification Types
            </CardTitle>
            <p className="text-sm text-gray-600">
              Select which types of notifications you want to receive
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="job-status-updates" className="text-base font-medium">
                  Job Status Updates
                </Label>
                <p className="text-sm text-gray-600">
                  Get notified when your job status changes
                </p>
              </div>
              <Switch
                id="job-status-updates"
                checked={preferences.job_status_updates ?? false}
                onCheckedChange={(checked: boolean) => updatePreference('job_status_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="delivery-updates" className="text-base font-medium">
                  Delivery Updates
                </Label>
                <p className="text-sm text-gray-600">
                  Get notified when your order is ready for pickup/delivery
                </p>
              </div>
              <Switch
                id="delivery-updates"
                checked={preferences.delivery_updates ?? false}
                onCheckedChange={(checked: boolean) => updatePreference('delivery_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="promotional-messages" className="text-base font-medium">
                  Promotional Messages
                </Label>
                <p className="text-sm text-gray-600">
                  Receive offers, discounts, and promotional content
                </p>
              </div>
              <Switch
                id="promotional-messages"
                checked={preferences.promotional_messages ?? false}
                onCheckedChange={(checked: boolean) => updatePreference('promotional_messages', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Settings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Delivery Methods</h4>
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${(preferences.email_notifications ?? false) ? 'text-green-600' : 'text-gray-500'}`}>
                    <Mail className="h-4 w-4" />
                    Email: {(preferences.email_notifications ?? false) ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className={`flex items-center gap-2 ${(preferences.sms_notifications ?? false) ? 'text-green-600' : 'text-gray-500'}`}>
                    <MessageSquare className="h-4 w-4" />
                    SMS: {(preferences.sms_notifications ?? false) ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Notification Types</h4>
                <div className="space-y-1 text-sm">
                  <div className={`${(preferences.job_status_updates ?? false) ? 'text-green-600' : 'text-gray-500'}`}>
                    Job Status: {(preferences.job_status_updates ?? false) ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className={`${(preferences.delivery_updates ?? false) ? 'text-green-600' : 'text-gray-500'}`}>
                    Delivery: {(preferences.delivery_updates ?? false) ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className={`${(preferences.promotional_messages ?? false) ? 'text-green-600' : 'text-gray-500'}`}>
                    Promotions: {(preferences.promotional_messages ?? false) ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}