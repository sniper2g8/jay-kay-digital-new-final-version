"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Mail, Send, Users, FileText, Palette } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  // Fix the field names to match the actual database schema
  name: string;
  business_name?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'custom';
}

export default function AdminEmailSystem() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState<'individual' | 'bulk'>('individual');

  useEffect(() => {
    loadCustomers();
    loadTemplates();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, email, name, business_name')
        .order('name');

      if (error) throw error;
      // Cast the data to the correct type
      setCustomers(data as Customer[] || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers');
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', 'custom')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      // Templates table might not exist yet, that's okay
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomMessage(template.content);
    }
    setSelectedTemplate(templateId);
  };

  const sendCustomEmail = async () => {
    if (!customSubject.trim() || !customMessage.trim() || selectedCustomers.length === 0) {
      setError('Please fill in all required fields and select at least one customer');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
      let successCount = 0;
      let failureCount = 0;

      for (const customer of selectedCustomerData) {
        try {
          const { data, error } = await supabase.functions.invoke('email-notifications', {
            body: {
              type: 'custom_email',
              recipientEmail: customer.email,
              recipientName: `${customer.first_name} ${customer.last_name}`,
              data: {
                customSubject: customSubject,
                customMessage: customMessage,
              }
            }
          });

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error(`Failed to send email to ${customer.email}:`, err);
          failureCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully sent ${successCount} email(s)${failureCount > 0 ? ` (${failureCount} failed)` : ''}`);
        
        // Clear form
        setCustomSubject('');
        setCustomMessage('');
        setSelectedCustomers([]);
        setSelectedTemplate('');
      } else {
        setError('Failed to send any emails');
      }

    } catch (err) {
      console.error('Error sending emails:', err);
      setError('Failed to send emails');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!customSubject.trim() || !customMessage.trim()) {
      setError('Please fill in subject and message to save template');
      return;
    }

    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: templateName,
          subject: customSubject,
          content: customMessage,
          type: 'custom'
        });

      if (error) throw error;
      
      setSuccess('Template saved successfully');
      loadTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admin Email System</h1>
          <p className="text-gray-600">Send custom emails to customers</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
            <CardDescription>
              Choose customers to send emails to ({selectedCustomers.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllCustomers}
                disabled={customers.length === 0}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
                disabled={selectedCustomers.length === 0}
              >
                Clear Selection
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    selectedCustomers.includes(customer.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleCustomerSelection(customer.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                      {customer.company_name && (
                        <div className="text-sm text-gray-500">{customer.company_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {customers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No customers found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Create your custom email message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Email Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or start fresh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template (start fresh)</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500">
                The message will be automatically formatted with JayKay Digital Press branding
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={sendCustomEmail}
                disabled={isLoading || selectedCustomers.length === 0 || !customSubject.trim() || !customMessage.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : `Send to ${selectedCustomers.length} Customer${selectedCustomers.length !== 1 ? 's' : ''}`}
              </Button>
              
              <Button
                variant="outline"
                onClick={saveTemplate}
                disabled={!customSubject.trim() || !customMessage.trim()}
              >
                <Palette className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      {(customSubject.trim() || customMessage.trim()) && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              This is how your email will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="border-b pb-2 mb-4">
                <div className="text-sm text-gray-600">Subject:</div>
                <div className="font-medium">{customSubject || 'Message from JayKay Digital Press'}</div>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                <div className="mb-4">Dear [Customer Name],</div>
                <div className="mb-4">{customMessage}</div>
                <div className="mb-2">Thank you for your continued business!</div>
                <div>
                  Best regards,<br />
                  <strong>The JayKay Digital Press Team</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}