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
  Package,
  AlertCircle,
  Calendar,
  DollarSign,
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
}

interface Customer {
  id: string;
  business_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
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
  "in-progress": {
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
};

const priorityConfig = {
  low: {
    label: "Low",
    color: "bg-gray-100 text-gray-800",
  },
  medium: {
    label: "Medium", 
    color: "bg-yellow-100 text-yellow-800",
  },
  high: {
    label: "High",
    color: "bg-red-100 text-red-800",
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-500 text-white",
  },
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
      try {
        setLoading(true);
        setError(null);

        // First try to fetch by job ID
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        let finalJobData = jobData;

        // If not found by ID, try by job number
        if (jobError && jobError.code === "PGRST116") {
          const { data: jobByNumber, error: jobByNumberError } = await supabase
            .from("jobs")
            .select("*")
            .eq("jobNo", jobId)
            .single();

          if (jobByNumberError) {
            throw new Error("Job not found");
          }
          finalJobData = jobByNumber;
        } else if (jobError) {
          throw jobError;
        }

        // Fetch customer details if customer_id exists
        if (finalJobData?.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("*")
            .eq("id", finalJobData.customer_id)
            .single();

          if (customerError) {
            console.error("Failed to fetch customer:", customerError);
          } else {
            setCustomer(customerData);
          }
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err instanceof Error ? err.message : "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const getStatusConfig = (status: string | null): StatusConfig => {
    if (!status) return statusConfig.pending;
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getPriorityConfig = (priority: string | null) => {
    if (!priority) return priorityConfig.low;
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "SLL 0";
    return `SLL ${amount.toLocaleString()}`;
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
        console.log('Error sharing:', err);
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
              {job.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{job.description}</p>
                </div>
              )}

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
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Job Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job ID:</span>
                      <span className="font-medium">{job.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{job.quantity || 1}</span>
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

                <div>
                  <h3 className="font-semibold mb-3">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    {job.estimate_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimate:</span>
                        <span className="font-medium">{formatCurrency(job.estimate_price)}</span>
                      </div>
                    )}
                    {job.unit_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-medium">{formatCurrency(job.unit_price)}</span>
                      </div>
                    )}
                    {job.final_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Final Price:</span>
                        <span className="font-medium text-green-600">{formatCurrency(job.final_price)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {customer && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Business:</span>
                        <p className="font-medium">{customer.business_name}</p>
                      </div>
                      {customer.contact_person && (
                        <div>
                          <span className="text-gray-600">Contact:</span>
                          <p className="font-medium">{customer.contact_person}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-2 text-sm">
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-gray-700">{customer.address}</p>
                            {(customer.city || customer.state) && (
                              <p className="text-gray-600">
                                {[customer.city, customer.state].filter(Boolean).join(", ")}
                                {customer.zip_code && ` ${customer.zip_code}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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