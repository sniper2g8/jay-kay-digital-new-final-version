'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar,
  Users,
  FileText,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useStatementActions } from '@/lib/hooks/useStatements';
import { formatDate } from '@/lib/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedDashboard from '@/components/ProtectedDashboard';

interface StatementFormData {
  customer_id: string;
  period_start: string;
  period_end: string;
  statement_date: string;
}

function CreateStatementContent() {
  const router = useRouter();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { createStatementPeriod, isLoading: creating } = useStatementActions();

  const [formData, setFormData] = useState<StatementFormData>({
    customer_id: '',
    period_start: '',
    period_end: '',
    statement_date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Partial<StatementFormData>>({});

  const handleInputChange = (field: keyof StatementFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-calculate period end when start date changes
    if (field === 'period_start' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of month
      setFormData(prev => ({ 
        ...prev, 
        period_start: value,
        period_end: endDate.toISOString().split('T')[0]
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<StatementFormData> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!formData.period_start) {
      newErrors.period_start = 'Period start date is required';
    }

    if (!formData.period_end) {
      newErrors.period_end = 'Period end date is required';
    }

    if (formData.period_start && formData.period_end) {
      if (new Date(formData.period_start) >= new Date(formData.period_end)) {
        newErrors.period_end = 'End date must be after start date';
      }
    }

    if (!formData.statement_date) {
      newErrors.statement_date = 'Statement date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const newStatement = await createStatementPeriod(formData);
      router.push(`/dashboard/statements/${newStatement.id}`);
    } catch (error) {
      console.error('Error creating statement:', error);
    }
  };

  // Quick date presets
  const getQuickDates = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
      currentMonth: {
        start: firstDayOfMonth.toISOString().split('T')[0],
        end: lastDayOfMonth.toISOString().split('T')[0],
        label: 'Current Month'
      },
      lastMonth: {
        start: firstDayOfLastMonth.toISOString().split('T')[0],
        end: lastDayOfLastMonth.toISOString().split('T')[0],
        label: 'Last Month'
      },
      quarter: {
        start: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1).toISOString().split('T')[0],
        end: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0],
        label: 'Current Quarter'
      }
    };
  };

  const quickDates = getQuickDates();

  const applyQuickDate = (preset: 'currentMonth' | 'lastMonth' | 'quarter') => {
    const dates = quickDates[preset];
    setFormData(prev => ({
      ...prev,
      period_start: dates.start,
      period_end: dates.end
    }));
  };

  const selectedCustomer = customers?.find(c => c.id === formData.customer_id);

  if (customersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading customers...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/statements">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Statements
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Statement Period</h1>
            <p className="text-muted-foreground mt-1">
              Generate a new statement period for a customer account
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Statement Period Details</CardTitle>
                <CardDescription>
                  Configure the customer and date range for this statement period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer *</Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => handleInputChange('customer_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer">
                          {selectedCustomer ? (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{selectedCustomer.company_name}</span>
                            </div>
                          ) : (
                            "Select a customer"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.company_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {customer.contact_name} • {customer.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customer_id && (
                      <p className="text-sm text-red-600">{errors.customer_id}</p>
                    )}
                  </div>

                  {/* Quick Date Presets */}
                  <div className="space-y-2">
                    <Label>Quick Date Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyQuickDate('currentMonth')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {quickDates.currentMonth.label}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyQuickDate('lastMonth')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {quickDates.lastMonth.label}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyQuickDate('quarter')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {quickDates.quarter.label}
                      </Button>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period_start">Period Start Date *</Label>
                      <Input
                        id="period_start"
                        type="date"
                        value={formData.period_start}
                        onChange={(e) => handleInputChange('period_start', e.target.value)}
                      />
                      {errors.period_start && (
                        <p className="text-sm text-red-600">{errors.period_start}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period_end">Period End Date *</Label>
                      <Input
                        id="period_end"
                        type="date"
                        value={formData.period_end}
                        onChange={(e) => handleInputChange('period_end', e.target.value)}
                      />
                      {errors.period_end && (
                        <p className="text-sm text-red-600">{errors.period_end}</p>
                      )}
                    </div>
                  </div>

                  {/* Statement Date */}
                  <div className="space-y-2">
                    <Label htmlFor="statement_date">Statement Date *</Label>
                    <Input
                      id="statement_date"
                      type="date"
                      value={formData.statement_date}
                      onChange={(e) => handleInputChange('statement_date', e.target.value)}
                    />
                    {errors.statement_date && (
                      <p className="text-sm text-red-600">{errors.statement_date}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      The date this statement is generated (usually today)
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Statement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Statement Period
                        </>
                      )}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/statements">
                        Cancel
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {formData.customer_id && formData.period_start && formData.period_end && (
              <Card>
                <CardHeader>
                  <CardTitle>Statement Preview</CardTitle>
                  <CardDescription>Preview of the statement being created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                      <p className="font-medium">{selectedCustomer?.company_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer?.contact_name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statement Period</Label>
                      <p className="font-medium">
                        {formatDate(formData.period_start)} - {formatDate(formData.period_end)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statement Date</Label>
                      <p className="font-medium">{formatDate(formData.statement_date)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Period Duration</Label>
                      <p className="font-medium">
                        {Math.ceil((new Date(formData.period_end).getTime() - new Date(formData.period_start).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <FileText className="h-5 w-5 mr-2 inline" />
                  About Statements
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  Statement periods group customer transactions by date range to provide 
                  account summaries and balance tracking.
                </p>
                <p>
                  <strong>Typical workflow:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Create statement period</li>
                  <li>Add transactions (jobs, payments)</li>
                  <li>Generate statement</li>
                  <li>Send to customer</li>
                  <li>Track payment status</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CreateStatementPage() {
  return (
    <ProtectedDashboard allowedRoles={['staff', 'manager', 'admin', 'super_admin']}>
      <CreateStatementContent />
    </ProtectedDashboard>
  );
}