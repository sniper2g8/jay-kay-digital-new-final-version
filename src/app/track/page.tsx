'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Search, Clock, CheckCircle, AlertCircle, Truck, Package, QrCode, Share2 } from 'lucide-react';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import BrandHeader from '@/components/BrandHeader';

interface JobTrackingInfo {
  id: string;
  jobNo: string | null;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  customerName: string | null;
  estimatedCompletion?: string | null;
  created_at: string | null;
  updated_at: string | null;
  assigned_to?: string | null;
  notes?: string | null;
  totalCost?: number | null;
  paidAmount?: number | null;
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Your job is in our queue and will be started soon.'
  },
  'in-progress': { 
    label: 'In Progress', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package,
    description: 'We are currently working on your job.'
  },
  'quality-check': { 
    label: 'Quality Check', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle,
    description: 'Your job is being reviewed for quality assurance.'
  },
  'ready-for-delivery': { 
    label: 'Ready for Delivery', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Truck,
    description: 'Your job is complete and ready for pickup or delivery.'
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Your job has been completed and delivered.'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    description: 'This job has been cancelled.'
  }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
};

export default function TrackJobPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [jobInfo, setJobInfo] = useState<JobTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchJob = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setJobInfo(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('jobNo', trackingNumber.trim())
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Job not found. Please check your tracking number and try again.');
        } else {
          setError('Error searching for job. Please try again.');
        }
        return;
      }

      setJobInfo(data);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Job tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchJob();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLL',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (status: string) => {
    const statusOrder = ['pending', 'in-progress', 'quality-check', 'ready-for-delivery', 'completed'];
    const currentIndex = statusOrder.indexOf(status.toLowerCase());
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const currentStatus = jobInfo && jobInfo.status ? statusConfig[jobInfo.status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending : null;
  const currentPriority = jobInfo && jobInfo.priority ? priorityConfig[jobInfo.priority.toLowerCase() as keyof typeof priorityConfig] || priorityConfig.medium : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Company Branding Header */}
      <BrandHeader variant="full" showTagline={true} />

      <div className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Job</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your job tracking number to check the current status and progress of your printing job.
            </p>
          </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Job Tracking
            </CardTitle>
            <CardDescription>
              Enter your job number (e.g., JOB001, JOB002) to track your order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your job number (e.g., JOB001)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg"
              />
              <Button 
                onClick={searchJob} 
                disabled={loading}
                className="px-6"
              >
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Job Information */}
        {jobInfo && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Job #{jobInfo.jobNo || 'N/A'}</CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {jobInfo.title || 'No title available'}
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={currentStatus?.color}>
                      {currentStatus?.icon && <currentStatus.icon className="h-4 w-4 mr-1" />}
                      {currentStatus?.label}
                    </Badge>
                    <Badge className={currentPriority?.color}>
                      {currentPriority?.label} Priority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress(jobInfo.status || 'pending'))}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress(jobInfo.status || 'pending')}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Description */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    {currentStatus?.description}
                  </AlertDescription>
                </Alert>

                <Separator />

                {/* Job Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Job Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer:</span>
                          <span className="font-medium">{jobInfo.customerName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Job Number:</span>
                          <span className="font-medium">{jobInfo.jobNo || 'N/A'}</span>
                        </div>
                        {jobInfo.assigned_to && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assigned To:</span>
                            <span className="font-medium">{jobInfo.assigned_to}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {jobInfo.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{jobInfo.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">{jobInfo.created_at ? formatDate(jobInfo.created_at) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">{jobInfo.updated_at ? formatDate(jobInfo.updated_at) : 'N/A'}</span>
                        </div>
                        {jobInfo.estimatedCompletion && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. Completion:</span>
                            <span className="font-medium">{formatDate(jobInfo.estimatedCompletion)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(jobInfo.totalCost || jobInfo.paidAmount) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Payment</h4>
                        <div className="space-y-2 text-sm">
                          {jobInfo.totalCost && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Cost:</span>
                              <span className="font-medium">{formatCurrency(jobInfo.totalCost)}</span>
                            </div>
                          )}
                          {jobInfo.paidAmount && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Paid Amount:</span>
                              <span className="font-medium text-green-600">{formatCurrency(jobInfo.paidAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {jobInfo.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{jobInfo.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* QR Code Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Share Job Tracking
                </CardTitle>
                <CardDescription>
                  Share this job tracking information with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <QRCodeGenerator
                        data={`${window.location.origin}/track/${jobInfo.jobNo || jobInfo.id}`}
                        size={180}
                        className="mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      Scan with mobile device to view job status
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Quick Access</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Use this QR code to quickly access job status on any device
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/track/${jobInfo.jobNo || jobInfo.id}`;
                          navigator.clipboard.writeText(url);
                          // You could add a toast notification here
                        }}
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Tracking Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/track/${jobInfo.jobNo || jobInfo.id}`;
                          if (navigator.share) {
                            navigator.share({
                              title: `Job #${jobInfo.jobNo || jobInfo.id} - Jay Kay Digital Press`,
                              text: `Track your printing job: ${jobInfo.title || 'Print Job'}`,
                              url: url,
                            });
                          } else {
                            // Fallback for browsers that don't support Web Share API
                            navigator.clipboard.writeText(url);
                          }
                        }}
                        className="w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Job
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-gray-900">Need Help?</h4>
                  <p className="text-sm text-gray-600">
                    If you have any questions about your job, please contact us:
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <span className="text-blue-600">📞 +232 34 788711</span>
                    <span className="text-blue-600">✉️ info@jaykaypress.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}