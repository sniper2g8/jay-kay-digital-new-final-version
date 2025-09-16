'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Save,
  Send,
  Calculator,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useEstimateActions } from "@/lib/hooks/useEstimates";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";
import { toast } from 'sonner';

export default function CreateEstimatePage() {
  const router = useRouter();
  const { data: customers } = useCustomers();
  const { createEstimate, isSubmitting } = useEstimateActions();
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    title: '',
    description: '',
    unit_price: 0,
    quantity: 1,
    tax_rate: 15, // Default 15% tax
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    expires_in_days: 30
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers?.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: selectedCustomer?.name || ''
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (formData.unit_price <= 0) newErrors.unit_price = 'Unit price must be greater than 0';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const subtotal = formData.unit_price * formData.quantity;
    const tax_amount = subtotal * (formData.tax_rate / 100);
    const total_amount = subtotal + tax_amount;
    
    return { subtotal, tax_amount, total_amount };
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = true) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    try {
      const estimate = await createEstimate({
        ...formData,
        specifications: {
          description: formData.description,
          pricing_details: {
            unit_price: formData.unit_price,
            quantity: formData.quantity,
            tax_rate: formData.tax_rate
          }
        }
      });

      if (saveAsDraft) {
        toast.success('Estimate saved as draft successfully!');
      } else {
        toast.success('Estimate created and ready to send!');
      }
      
      router.push(`/dashboard/estimates/${estimate.id}`);
    } catch (error) {
      console.error('Error creating estimate:', error);
      toast.error('Failed to create estimate. Please try again.');
    }
  };

  const totals = calculateTotals();

  return (
    <ProtectedDashboard allowedRoles={['staff', 'manager', 'admin', 'super_admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/estimates">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Estimates
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Estimate</h1>
                  <p className="text-gray-600">Create a quote for a customer</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
                {/* Customer Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Customer *</Label>
                      <Select onValueChange={handleCustomerSelect} value={formData.customer_id}>
                        <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.customer_id && (
                        <p className="text-sm text-red-600 mt-1">{errors.customer_id}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Estimate Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estimate Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Business Card Printing"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Detailed description of the work to be done..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select onValueChange={(value) => handleInputChange('priority', value)} value={formData.priority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="expires_in_days">Valid for (days)</Label>
                        <Input
                          id="expires_in_days"
                          type="number"
                          value={formData.expires_in_days}
                          onChange={(e) => handleInputChange('expires_in_days', parseInt(e.target.value) || 30)}
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Pricing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="unit_price">Unit Price (SLL) *</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          value={formData.unit_price}
                          onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                          className={errors.unit_price ? 'border-red-500' : ''}
                        />
                        {errors.unit_price && (
                          <p className="text-sm text-red-600 mt-1">{errors.unit_price}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className={errors.quantity ? 'border-red-500' : ''}
                        />
                        {errors.quantity && (
                          <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                        <Input
                          id="tax_rate"
                          type="number"
                          step="0.01"
                          value={formData.tax_rate}
                          onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>SLL {totals.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({formData.tax_rate}%):</span>
                        <span>SLL {totals.tax_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span>SLL {totals.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Link href="/dashboard/estimates">
                        <Button variant="outline">Cancel</Button>
                      </Link>
                      
                      <div className="flex items-center space-x-3">
                        <Button 
                          type="submit"
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save as Draft
                        </Button>
                        
                        <Button 
                          type="button"
                          onClick={(e) => handleSubmit(e, false)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Create & Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedDashboard>
  );
}