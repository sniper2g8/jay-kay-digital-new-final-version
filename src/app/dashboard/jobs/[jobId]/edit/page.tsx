'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useJob } from "@/lib/hooks/useJobs";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { mutate } from 'swr';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const { data: job, error: jobError, isLoading: jobLoading } = useJob(jobId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    quantity: 0,
    estimated_cost: 0,
    final_cost: 0,
    estimated_delivery: '',
    actual_delivery: '',
    assigned_to: '',
    special_instructions: ''
  });

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        status: job.status || 'pending',
        priority: job.priority || 'medium',
        quantity: job.quantity || 0,
        estimated_cost: job.estimated_cost || 0,
        final_cost: job.final_cost || 0,
        estimated_delivery: job.estimated_delivery ? job.estimated_delivery.split('T')[0] : '',
        actual_delivery: job.actual_delivery ? job.actual_delivery.split('T')[0] : '',
        assigned_to: job.assigned_to || '',
        special_instructions: typeof job.specifications === 'object' && job.specifications !== null
          ? (job.specifications as { special_instructions?: string })?.special_instructions || ''
          : (typeof job.specifications === 'string' ? job.specifications : '')
      });
    }
  }, [job]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare specifications
      const specifications = {
        special_instructions: formData.special_instructions,
        // Preserve existing specifications if they exist
        ...(job?.specifications && typeof job.specifications === 'object' ? job.specifications : {})
      };

      if (!job) {
        throw new Error('Job data not available');
      }

      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority as 'low' | 'normal' | 'high' | 'urgent',
          quantity: formData.quantity,
          estimated_cost: formData.estimated_cost,
          final_cost: formData.final_cost,
          estimated_delivery: formData.estimated_delivery || null,
          actual_delivery: formData.actual_delivery || null,
          assigned_to: formData.assigned_to || null,
          specifications: specifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (error) {
        throw error;
      }

      // Invalidate caches for real-time updates
      mutate('jobs');
      mutate('jobs-with-customers');
      mutate('job-stats');
      mutate(`job-${jobId}`);

      toast.success('Job updated successfully!');
      router.push(`/dashboard/jobs/${jobId}`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (jobLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading job details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (jobError || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-red-800">Job Not Found</h3>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {jobError?.message || 'The requested job could not be found.'}
              </p>
              <Button onClick={() => router.push('/dashboard/jobs')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Job
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
                  <p className="text-gray-600">{job.jobNo || 'No Job Number'} • {job.customer_name || 'Unknown Customer'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter job title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the job requirements..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status and Priority */}
              <Card>
                <CardHeader>
                  <CardTitle>Status & Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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
                      <Label htmlFor="assigned_to">Assigned To</Label>
                      <Input
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                        placeholder="Assign to team member"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimated_cost">Estimated Cost</Label>
                      <Input
                        id="estimated_cost"
                        type="number"
                        step="0.01"
                        value={formData.estimated_cost}
                        onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="final_cost">Final Cost</Label>
                      <Input
                        id="final_cost"
                        type="number"
                        step="0.01"
                        value={formData.final_cost}
                        onChange={(e) => handleInputChange('final_cost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                      <Input
                        id="estimated_delivery"
                        type="date"
                        value={formData.estimated_delivery}
                        onChange={(e) => handleInputChange('estimated_delivery', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actual_delivery">Actual Delivery</Label>
                      <Input
                        id="actual_delivery"
                        type="date"
                        value={formData.actual_delivery}
                        onChange={(e) => handleInputChange('actual_delivery', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="special_instructions">Additional Notes</Label>
                    <Textarea
                      id="special_instructions"
                      value={formData.special_instructions}
                      onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                      placeholder="Any special instructions or notes for this job..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.title}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Job
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}