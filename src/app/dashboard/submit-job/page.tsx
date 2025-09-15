'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface Customer {
  id: string;
  human_id: string | null;
  business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

interface Service {
  id: string;
  title: string | null;
  description: string | null;
  specSchema: unknown;
  active: boolean | null;
  slug: string | null;
  imageUrl: string | null;
}

interface JobFormData {
  customer_id: string;
  service_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  quantity: number | null;
  due_date: string;
  requirements: string | null;
  special_instructions: string | null;
}

const initialFormData: JobFormData = {
  customer_id: '',
  service_id: '',
  title: '',
  description: null,
  priority: 'normal',
  quantity: null,
  due_date: '',
  requirements: null,
  special_instructions: null
};

export default function SubmitJobPage() {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCustomers();
    loadServices();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, human_id, business_name, contact_person, email, phone')
        .order('business_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, description, specSchema, active, slug, imageUrl')
        .eq('active', true)
        .order('title', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  useEffect(() => {
    const calculateEstimatedPrice = async () => {
      try {
        const selectedService = services.find(s => s.id === formData.service_id);
        if (!selectedService || !formData.quantity) {
          setEstimatedPrice(null);
          return;
        }

        // Simple calculation - basic pricing since services table doesn't have base_price
        const basePrice = 10; // Default base price per unit
        let multiplier = 1;

        // Quantity discounts
        if (formData.quantity >= 100) multiplier = 0.9;
        else if (formData.quantity >= 50) multiplier = 0.95;

        // Priority adjustments
        if (formData.priority === 'urgent') multiplier *= 1.5;
        else if (formData.priority === 'high') multiplier *= 1.2;

        const estimated = basePrice * formData.quantity * multiplier;
        setEstimatedPrice(Math.round(estimated * 100) / 100);
      } catch (err) {
        console.error('Error calculating price:', err);
      }
    };

    if (formData.service_id && formData.quantity) {
      calculateEstimatedPrice();
    }
  }, [formData.service_id, formData.quantity, formData.priority, services]);

  const handleInputChange = (field: keyof JobFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (jobId: string): Promise<Array<{
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
    entity_type: string;
    entity_id: string;
    uploaded_by: string | undefined;
  }>> => {
    const uploadedFiles = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `jobs/${jobId}/${fileName}`;

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const { error } = await supabase.storage
          .from('job-attachments')
          .upload(filePath, file);

        if (error) throw error;

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        uploadedFiles.push({
          file_name: fileName,
          file_url: filePath,
          file_size: file.size,
          file_type: file.type,
          entity_type: 'job',
          entity_id: jobId,
          uploaded_by: user?.id
        });
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Generate job number and human ID
      const jobId = crypto.randomUUID();
      const jobNumber = `JOB-${Date.now()}`;

      // Create job record
      const jobData = {
        id: jobId,
        jobNo: jobNumber,
        title: formData.title,
        description: formData.description,
        status: 'pending',
        priority: formData.priority,
        quantity: formData.quantity,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        estimated_cost: estimatedPrice,
        createdBy: user.id,
        dueDate: formData.due_date ? formData.due_date : null,
        specifications: {
          requirements: formData.requirements,
          special_instructions: formData.special_instructions
        },
        submittedDate: new Date().toISOString()
      };

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload files if any
      if (files.length > 0) {
        const uploadedFileRecords = await uploadFiles(job.id);
        
        if (uploadedFileRecords.length > 0) {
          const { error: filesError } = await supabase
            .from('file_attachments')
            .insert(uploadedFileRecords);

          if (filesError) throw filesError;
        }
      }

      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err) {
      console.error('Error submitting job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit New Job</h1>
          <p className="text-gray-600 mt-2">Create a new printing job request</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => handleInputChange('customer_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.business_name}
                          {customer.human_id && ` (${customer.human_id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service">Service *</Label>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => handleInputChange('service_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.title}</span>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief description of the job"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the job requirements"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Job Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="Number of items"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => handleInputChange('priority', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </div>

              {estimatedPrice && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Estimated Price</h3>
                  <p className="text-2xl font-bold text-blue-600">${estimatedPrice}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Based on quantity and priority. Final price may vary.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requirements">Technical Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('requirements', e.target.value)}
                  placeholder="Paper type, dimensions, colors, finishing options, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={formData.special_instructions || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('special_instructions', e.target.value)}
                  placeholder="Any special handling, delivery instructions, or notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="files">Upload Design Files</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.svg"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Accepted formats: PDF, JPG, PNG, AI, PSD, EPS, SVG
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {uploadProgress[file.name] !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.customer_id || !formData.service_id || !formData.title}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}