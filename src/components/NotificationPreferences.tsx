/**
 * User Notification Preferences Component
 * Allows users to manage their notification settings with opt-in/out options
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Bell, Mail, MessageSquare, Settings } from 'lucide-react';

interface NotificationPreference {
  id?: string;
  user_id: string | null;
  email_notifications: boolean | null;
  sms_notifications: boolean | null;
  job_status_updates: boolean | null;
  delivery_updates: boolean | null;
  promotional_messages: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface NotificationPreferencesProps {
  userId: string;
  userRole?: 'admin' | 'customer' | 'staff';
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  userRole = 'customer'
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    user_id: userId,
    email_notifications: true,
    sms_notifications: false,
    job_status_updates: true,
    delivery_updates: true,
    promotional_messages: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing preferences
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load notification preferences'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const preferenceData = {
        user_id: userId,
        email_notifications: preferences.email_notifications ?? true,
        sms_notifications: preferences.sms_notifications ?? false,
        job_status_updates: preferences.job_status_updates ?? true,
        delivery_updates: preferences.delivery_updates ?? true,
        promotional_messages: preferences.promotional_messages ?? false,
        updated_at: new Date().toISOString()
      };

      // Check if preferences exist first
      const { data: existingData } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      let error;
      if (existingData) {
        // Update existing preferences
        ({ error } = await supabase
          .from('notification_preferences')
          .update(preferenceData)
          .eq('user_id', userId));
      } else {
        // Insert new preferences
        ({ error } = await supabase
          .from('notification_preferences')
          .insert(preferenceData as any));
      }

      if (error) {
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Notification preferences saved successfully!'
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save notification preferences'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading notification preferences...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications from Jay Kay Digital Press. 
            You can opt-in or out of different types of notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Delivery Method Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Delivery Methods
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_notifications ?? true}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Receive notifications via email
              </p>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sms-notifications" className="text-sm font-medium">
                    SMS Notifications
                  </Label>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.sms_notifications ?? false}
                  onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Receive notifications via SMS (standard rates may apply)
              </p>
            </div>
          </div>

          {/* Notification Type Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Types</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="job-status-updates" className="text-sm font-medium">
                  Job Status Updates
                </Label>
                <Switch
                  id="job-status-updates"
                  checked={preferences.job_status_updates ?? true}
                  onCheckedChange={(checked) => updatePreference('job_status_updates', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Notifications about job status changes, completions, and updates
              </p>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="delivery-updates" className="text-sm font-medium">
                  Delivery Updates
                </Label>
                <Switch
                  id="delivery-updates"
                  checked={preferences.delivery_updates ?? true}
                  onCheckedChange={(checked) => updatePreference('delivery_updates', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Notifications about delivery status, scheduling, and completions
              </p>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="promotional-messages" className="text-sm font-medium">
                  Promotional Messages
                </Label>
                <Switch
                  id="promotional-messages"
                  checked={preferences.promotional_messages ?? false}
                  onCheckedChange={(checked) => updatePreference('promotional_messages', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Special offers, discounts, and promotional content
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • <strong>Email notifications</strong> are sent to your registered email address
          </p>
          <p>
            • <strong>SMS notifications</strong> require a valid phone number in your profile
          </p>
          <p>
            • You can change these preferences at any time
          </p>
          <p>
            • Critical system alerts and security notifications cannot be disabled
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;