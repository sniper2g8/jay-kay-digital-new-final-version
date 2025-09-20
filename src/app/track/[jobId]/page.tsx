"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Settings,
  Truck,
  AlertCircle,
  Phone,
  Mail,
  ExternalLink,
  QrCode,
  Share2,
} from "lucide-react";
import Link from "next/link";

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
  unit_price: number | null;
  final_price: number | null;
  estimate_price: number | null;
  quantity: number | null;
  qr_code: string | null;
  tracking_url: string | null;
  // Additional fields from database
  actual_delivery?: string | null;
  assigned_to?: string | null;
  createdAt?: unknown;
  createdBy?: string | null;
  updatedAt?: unknown;
  __open?: boolean | null;
  [key: string]: unknown; // Allow additional properties
}

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  progress: number;
  description?: string;
}

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-yellow-500", icon: Clock, progress: 10 },
  approved: { label: "Approved", color: "bg-blue-500", icon: CheckCircle, progress: 25 },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-600",
    icon: Settings,
    progress: 50,
    description: "Your job is currently being processed.",
  },
  "quality-check": {
    label: "Quality Check",
    color: "bg-purple-500",
    icon: AlertCircle,
    progress: 75,
    description: "We're ensuring everything meets our high standards.",
  },
  "ready-for-delivery": {
    label: "Ready for Delivery",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Truck,
    progress: 90,
    description: "Your job is ready for pickup or delivery.",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    progress: 100,
    description: "Your job has been completed and delivered.",
  },
  // Handle alternative status values for compatibility
  Completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    progress: 100,
    description: "Your job has been completed and delivered.",
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    color: "bg-gray-100 text-gray-800",
  },
  normal: {
    label: "Normal", 
    color: "bg-blue-100 text-blue-800",
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-800",
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-100 text-red-800",
  },
};

export default function JobTrackingPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if jobId is in job number format (JKDP-JOB-XXXX) or UUID format
        const isJobNumber = /^JKDP-JOB-\d+$/i.test(jobId);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
        
        let finalJobData = null;
        
        if (isJobNumber) {
          // If it's a job number, search by jobNo first
          console.log("Fetching job by jobNo (job number format):", jobId);
          const { data: jobByNumber, error: jobByNumberError } = await supabase
            .from("jobs")
            .select("*")
            .eq("jobNo", jobId)
            .single();

          if (jobByNumberError) {
            console.error("Job not found by jobNo:", jobByNumberError);
            throw new Error(`Job not found with job number: ${jobId}`);
          }
          finalJobData = jobByNumber;
          
        } else if (isUUID) {
          // If it's a UUID, search by ID
          console.log("Fetching job by ID (UUID format):", jobId);
          const { data: jobData, error: jobError } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single();

          if (jobError) {
            console.error("Error fetching job by ID:", jobError);
            throw new Error(`Database error: ${jobError.message || JSON.stringify(jobError)}`);
          }
          finalJobData = jobData;
          
        } else {
          // If format is unclear, try both approaches with proper error handling
          
          // Try as job number first (more likely to be human-readable)
          const { data: jobByNumber, error: jobByNumberError } = await supabase
            .from("jobs")
            .select("*")
            .eq("jobNo", jobId)
            .single();

          if (!jobByNumberError && jobByNumber) {
            finalJobData = jobByNumber;
            console.log("Found job by jobNo (fallback):", finalJobData);
          } else {
            // Only try UUID if it could potentially be a UUID format
            if (jobId.length === 36 && jobId.includes('-')) {
              const { data: jobData, error: jobError } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", jobId)
                .single();

              if (!jobError && jobData) {
                finalJobData = jobData;
                console.log("Found job by ID (fallback):", finalJobData);
              }
            }
            
            if (!finalJobData) {
              throw new Error(`Job not found with identifier: ${jobId}. Please check the job number or ID.`);
            }
          }
        }

        // Set the job data
        
        setJob(finalJobData as unknown as Job);

        // Note: Customer information is not fetched for privacy protection
        
      } catch (err) {
        console.error("Error fetching job details:", err);
        
        // More detailed error handling
        let errorMessage = "Failed to load job details";
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = JSON.stringify(err);
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        console.error("Error details:", {
          error: err,
          jobId,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing"
        });
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const getStatusConfig = (status: string | null): StatusConfig => {
    if (!status) {
      
      return statusConfig.pending;
    }

    const config = statusConfig[status as keyof typeof statusConfig];
    
    if (!config) {
      console.warn(`Status '${status}' not found in statusConfig, using pending as fallback`);
      return statusConfig.pending;
    }

    return config;
  };

  const getPriorityConfig = (priority: string | null) => {
    if (!priority) return priorityConfig.low;
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
  };

  const shareJob = async () => {
    const currentUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job ${job?.jobNo || job?.id} - Jay Kay Digital Press`,
          text: `Track your printing job: ${job?.title || 'Printing Service'}`,
          url: currentUrl,
        });
      } catch (err) {
        
        copyToClipboard(currentUrl);
      }
    } else {
      copyToClipboard(currentUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Tracking link copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
                <p className="text-gray-600 mb-4">
                  {error || "The job you're looking for doesn't exist or may have been removed."}
                </p>
                <Button asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusConfig(job.status);
  const priorityInfo = getPriorityConfig(job.priority);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Job Tracking
            </h1>
            <p className="text-gray-600">
              Track the progress of your printing job
            </p>
          </div>

          {/* Job Overview Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Job #{job.jobNo || job.id}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {job.title || "Printing Job"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityInfo.color}>
                    {priorityInfo.label} Priority
                  </Badge>
                  <Button variant="outline" size="sm" onClick={shareJob}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Current Status</h3>
                  <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${statusInfo.progress}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {statusInfo.description || `Your job is currently ${statusInfo.label.toLowerCase()}.`}
                </p>
              </div>

              {/* Job Details Grid */}
              <div className="grid md:grid-cols-1 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Job Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job Number:</span>
                      <span className="font-medium">{job.jobNo || job.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{job.title || "Printing Service"}</span>
                    </div>
                    {job.estimated_delivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Delivery:</span>
                        <span className="font-medium">
                          {new Date(job.estimated_delivery).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {job.created_at ? new Date(job.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code and Tracking */}
          <div className="grid md:grid-cols-2 gap-6">
            {job.qr_code && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>
                    Scan this code for quick access to job tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-center text-sm text-gray-600">QR Code: {job.qr_code}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your job or get support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.tracking_url && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={job.tracking_url} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        External Tracking
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={shareJob}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Job Status
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">
                      Back to Home
                    </Link>
                  </Button>

                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2">Need help? Contact us:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <a href="tel:+23234788711" className="text-blue-600 hover:underline">
                          +232 34 788711
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <a href="mailto:jaykaydigitalpress@gmail.com" className="text-blue-600 hover:underline">
                          jaykaydigitalpress@gmail.com
                        </a>
                      </div>
                    </div>
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