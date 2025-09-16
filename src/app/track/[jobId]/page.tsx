'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Package, 
  Truck, 
  Calendar,
  DollarSign,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  jobNo: string | null;
  customer_id: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  estimated_delivery: string | null;
  created_at: string | null;
  updated_at: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  qr_code: string | null;
  tracking_url: string | null;
}

interface Customer {
  id: string;
  human_id: string | null;
  business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

const statusConfig = {
  'pending': { label: 'Pending Review', color: 'bg-yellow-500', icon: Clock },
  'approved': { label: 'Approved', color: 'bg-blue-500', icon: CheckCircle },
  'in_progress': { label: 'In Progress', color: 'bg-purple-500', icon: Package },
  'quality_check': { label: 'Quality Check', color: 'bg-orange-500', icon: AlertCircle },
  'completed': { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  'delivered': { label: 'Delivered', color: 'bg-green-600', icon: Truck },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle },
  'on_hold': { label: 'On Hold', color: 'bg-gray-500', icon: Clock },
};

const priorityConfig = {
  'low': { label: 'Low Priority', color: 'bg-gray-500' },
  'normal': { label: 'Normal Priority', color: 'bg-blue-500' },
  'high': { label: 'High Priority', color: 'bg-orange-500' },
  'urgent': { label: 'Urgent', color: 'bg-red-500' },
};

export default function JobTrackingPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('jobNo', jobId)
          .single();

        if (jobError) {
          if (jobError.code === 'PGRST116') {
            setError('Job not found. Please check the job ID and try again.');
          } else {
            setError('Failed to load job details. Please try again later.');
          }
          return;
        }

        setJob(jobData);

        // Fetch customer details
        if (jobData.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', jobData.customer_id)
            .single();

          if (!customerError) {
            setCustomer(customerData);
          }
        }

      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The job you are looking for could not be found.'}
          </p>
          <Link href="/">
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Jay Kay Digital Press
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending;
  const priorityInfo = priorityConfig[job.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Tracking</h1>
              <p className="text-gray-600">Track the progress of your printing job</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Jay Kay Digital Press</p>
              <p className="text-sm text-gray-500">Professional Printing Services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Job Status Card */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Job #{job.jobNo || job.id}</CardTitle>
                    <CardDescription>{job.title || 'Print Job'}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge className={`${statusInfo.color} text-white mb-2`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <br />
                    <Badge variant="outline" className={priorityInfo.color}>
                      {priorityInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{job.description}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Order Date</p>
                        <p className="text-sm text-gray-600">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('en-SL') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {job.estimated_delivery && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Estimated Completion</p>
                          <p className="text-sm text-gray-600">
                            {new Date(job.estimated_delivery).toLocaleDateString('en-SL')}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.estimated_cost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Estimated Cost</p>
                          <p className="text-sm text-gray-600">
                            ${job.estimated_cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.final_cost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Final Cost</p>
                          <p className="text-sm text-gray-600">
                            ${job.final_cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{customer.business_name}</p>
                      {customer.contact_person && (
                        <p className="text-sm text-gray-600">{customer.contact_person}</p>
                      )}
                    </div>

                    {customer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${customer.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${customer.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {customer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    For questions about your order, please contact us:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a 
                        href="tel:+1234567890"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        (123) 456-7890
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a 
                        href="mailto:info@jaykaydigitalpress.com"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        info@jaykaydigitalpress.com
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Link href="/">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Our Website
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}