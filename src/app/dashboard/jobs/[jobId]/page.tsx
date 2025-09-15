'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  FileText,
  Download,
  Edit,
  Share,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  File,
  FileImage,
  Package,
  MapPin,
  Building,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useJob } from "@/lib/hooks/useJobs";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { mutate } from 'swr';

interface JobFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string | null;
  entity_id: string;
  entity_type: string;
  uploaded_by: string | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const { data: job, error: jobError, isLoading: jobLoading } = useJob(jobId);
  const [files, setFiles] = useState<JobFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  // Fetch job files on component mount - optimized to avoid multiple calls
  React.useEffect(() => {
    let isCancelled = false;
    
    const fetchJobFiles = async () => {
      if (!job?.id) return;
      
      setFilesLoading(true);
      
      try {
        console.log('Fetching files for job:', { jobId, jobUUID: job.id, jobNumber: job.jobNo });
        
        // Use job UUID for consistent and fast lookup
        const { data, error } = await supabase
          .from('file_attachments')
          .select('id, file_name, file_url, file_size, created_at, entity_id, entity_type, uploaded_by')
          .eq('entity_id', job.id)
          .eq('entity_type', 'job')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching job files:', error);
          if (!isCancelled) {
            toast.error('Failed to load job files');
          }
        } else {
          console.log('Fetched files data:', data);
          if (!isCancelled) {
            setFiles(data || []);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching files:', err);
        if (!isCancelled) {
          toast.error('Error loading job files');
        }
      } finally {
        if (!isCancelled) {
          setFilesLoading(false);
        }
      }
    };

    fetchJobFiles();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [job?.id, job?.jobNo, jobId]); // Only re-run when job ID changes

  const downloadFile = async (file: JobFile) => {
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      console.log('Attempting to download file:', file);
      
      // Extract the storage path from the file_url
      // file_url format is usually: https://[project].supabase.co/storage/v1/object/public/job-files/[path]
      const urlParts = file.file_url.split('/');
      const bucketIndex = urlParts.indexOf('job-files');
      const storagePath = bucketIndex >= 0 ? urlParts.slice(bucketIndex + 1).join('/') : file.file_url;
      
      console.log('Using storage path:', storagePath);
      
      const { data, error } = await supabase.storage
        .from('job-files')
        .download(storagePath);

      if (error) {
        console.error('Storage download error:', error);
        throw error;
      }

      // Create blob URL and trigger download
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded ${file.file_name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${file.file_name}`);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <FileImage className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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
              <h3 className="text-lg font-medium text-red-800">Job Not Found</h3>
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
                  onClick={() => router.push('/dashboard/jobs')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title || 'Untitled Job'}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-gray-600">{job.jobNo || 'No Job Number'}</p>
                    <Badge className={getStatusColor(job.status || 'pending')}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(job.status || 'pending')}
                        <span>{(job.status || 'pending').replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Status Update Dropdown */}
                <Select 
                  value={job.status || 'pending'} 
                  onValueChange={async (newStatus) => {
                    try {
                      const { error } = await supabase
                        .from('jobs')
                        .update({ 
                          status: newStatus,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', job.id);

                      if (error) {
                        console.error('Status update error:', error);
                        toast.error('Failed to update status');
                      } else {
                        toast.success('Status updated successfully');
                        // Refresh the job data
                        mutate(`job-${jobId}`);
                      }
                    } catch (error) {
                      console.error('Status update error:', error);
                      toast.error('Failed to update status');
                    }
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="destructive" onClick={async () => {
                  if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                    try {
                      const { error } = await supabase
                        .from('jobs')
                        .delete()
                        .eq('id', job.id);

                      if (error) {
                        console.error('Delete error:', error);
                        toast.error('Failed to delete job');
                      } else {
                        toast.success('Job deleted successfully');
                        router.push('/dashboard/jobs');
                      }
                    } catch (error) {
                      console.error('Delete error:', error);
                      toast.error('Failed to delete job');
                    }
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/jobs/${jobId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Job
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1">{job.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quantity</label>
                      <p className="text-gray-900 font-medium">{job.quantity?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <p className="text-gray-900 font-medium capitalize">{job.priority || 'Medium'}</p>
                    </div>
                  </div>

                  {job.specifications && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Specifications</label>
                      <div className="bg-gray-50 rounded-md p-4 mt-1 space-y-3">
                        {(() => {
                          const specs = typeof job.specifications === 'string' 
                            ? JSON.parse(job.specifications) 
                            : job.specifications;
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {specs.requirements && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Requirements</h4>
                                  <p className="text-sm text-gray-700">{specs.requirements}</p>
                                </div>
                              )}
                              
                              {specs.special_instructions && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Special Instructions</h4>
                                  <p className="text-sm text-gray-700">{specs.special_instructions}</p>
                                </div>
                              )}
                              
                              {specs.size && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Size</h4>
                                  <p className="text-sm text-gray-700">
                                    {specs.size.type === 'standard' 
                                      ? `Standard: ${specs.size.preset}` 
                                      : `Custom: ${specs.size.width} × ${specs.size.height} ${specs.size.unit}`
                                    }
                                  </p>
                                </div>
                              )}
                              
                              {specs.paper && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Paper</h4>
                                  <p className="text-sm text-gray-700">
                                    {specs.paper.type} - {specs.paper.weight}
                                  </p>
                                </div>
                              )}
                              
                              {specs.unit_price && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Unit Price</h4>
                                  <p className="text-sm text-gray-700">${specs.unit_price}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Files */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Job Files ({files.length})
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Files attached to this job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading files...
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No files attached</h3>
                      <p className="text-gray-600">This job doesn&apos;t have any files attached yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file.file_name)}
                            <div>
                              <p className="font-medium text-gray-900">{file.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(file.file_size)} • Uploaded {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadFile(file)}
                            disabled={downloadingFiles.has(file.id)}
                          >
                            {downloadingFiles.has(file.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{job.customer_name || 'Unknown Customer'}</p>
                  </div>
                  
                  {/* Note: We'll need to fetch full customer details separately */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    Business Account
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Customer Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated Cost</span>
                    <span className="font-medium">${(job.estimated_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Final Cost</span>
                    <span className="font-medium">${(job.final_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Per Unit</span>
                    <span className="font-medium">
                      ${((job.final_cost || 0) / (job.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <Badge variant={job.invoiced ? "default" : "outline"} className="w-full justify-center">
                      {job.invoiced ? 'Invoiced' : 'Not Invoiced'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.submittedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Submitted</span>
                      <span className="text-sm font-medium">
                        {new Date(job.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {job.estimated_delivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Est. Delivery</span>
                      <span className="text-sm font-medium">
                        {new Date(job.estimated_delivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {job.actual_delivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="text-sm font-medium">
                        {new Date(job.actual_delivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {job.assigned_to && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Assigned to</span>
                      <span className="text-sm font-medium">{job.assigned_to}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking */}
              {job.tracking_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={job.tracking_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track Delivery
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}