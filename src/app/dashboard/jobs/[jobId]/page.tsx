"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Edit,
  Share,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  MapPin,
  Building,
  Loader2,
  ExternalLink,
  Ruler,
  File,
  Scissors,
  Info,
} from "lucide-react";
import { useJob, useJobByNumber } from "@/lib/hooks/useJobs";
import DashboardLayout from "@/components/DashboardLayout";
import { JobFilesViewer } from "@/components/JobFilesViewer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { mutate } from "swr";

// Define types for job with specifications
interface JobWithSpecifications {
  id: string;
  jobNo: string | null;
  customer_id: string | null;
  customerName: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: any | null;
  quantity: number | null;
  unit_price: number | null;
  final_price: number | null;
  estimate_price: number | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  assigned_to: string | null;
  job_type: any | null;
  service_id: string | null;
  serviceName: string | null;
  invoice_id: string | null;
  invoiced: boolean | null;
  invoiceNo: string | null;
  qr_code: string | null;
  tracking_url: string | null;
  submittedDate: string | null;
  __open: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  createdBy: string | null;
  customer_name?: string;
  // Specification fields
  size_type?: string;
  size_preset?: string;
  custom_width?: number;
  custom_height?: number;
  size_unit?: string;
  paper_type?: string;
  paper_weight?: number;
  finishing_options?: any;
  special_instructions?: string;
  requirements?: string;
}

// Function to check if a string is a valid UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Function to check if a string is a job number format
const isJobNumber = (str: string): boolean => {
  // Job numbers follow the pattern JKDP-JOB-XXXX where XXXX is digits
  const jobNoRegex = /^JKDP-JOB-\d{4}$/i;
  return jobNoRegex.test(str);
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Determine if we're using UUID or jobNo
  const isUUIDParam = isUUID(jobId);
  const isJobNoParam = isJobNumber(jobId);
  
  // Use appropriate hook based on parameter type
  const { data: jobByUUID, error: jobUUIDError, isLoading: jobUUIDLoading } = useJob(isUUIDParam ? jobId : null);
  const { data: jobByNumber, error: jobNumberError, isLoading: jobNumberLoading } = useJobByNumber(isJobNoParam ? jobId : null);
  
  // Use the appropriate job data
  const job = isUUIDParam ? jobByUUID : isJobNoParam ? jobByNumber : null;
  const jobError = isUUIDParam ? jobUUIDError : isJobNoParam ? jobNumberError : null;
  const jobLoading = isUUIDParam ? jobUUIDLoading : isJobNoParam ? jobNumberLoading : false;
  
  // Enhanced job with specifications
  const [enhancedJob, setEnhancedJob] = useState<JobWithSpecifications | null>(null);
  const [specsLoading, setSpecsLoading] = useState(false);

  // Fetch job specifications from the jobs table
  useEffect(() => {
    if (!jobId || !job) return;
    
    const fetchJobSpecs = async () => {
      setSpecsLoading(true);
      
      try {
        // Since we've migrated the data to the jobs table, we can get it directly
        // But we need to refresh the job data to get the new columns
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq(isUUIDParam ? "id" : "jobNo", jobId)
          .single();
        
        if (error) {
          console.error("Error fetching job specs:", error);
        } else {
          setEnhancedJob(data as JobWithSpecifications);
        }
      } catch (error) {
        console.error("Error fetching job specifications:", error);
      } finally {
        setSpecsLoading(false);
      }
    };
    
    fetchJobSpecs();
  }, [jobId, job, isUUIDParam]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get selected finish options names
  const getSelectedFinishOptions = () => {
    if (!enhancedJob?.finishing_options) return [];
    
    // Parse the finishing options if it's a string
    let finishingOptions = enhancedJob.finishing_options;
    if (typeof finishingOptions === 'string') {
      try {
        finishingOptions = JSON.parse(finishingOptions);
      } catch (e) {
        console.error("Error parsing finishing options:", e);
        return [];
      }
    }
    
    // If it's an object with selected_options property
    if (finishingOptions.selected_options && Array.isArray(finishingOptions.selected_options)) {
      return finishingOptions.selected_options;
    }
    
    // If it's a simple array
    if (Array.isArray(finishingOptions)) {
      return finishingOptions;
    }
    
    // If it's an object with keys as option IDs
    if (typeof finishingOptions === 'object' && finishingOptions !== null) {
      return Object.keys(finishingOptions);
    }
    
    return [];
  };

  if (jobLoading || specsLoading) {
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
              <h3 className="text-lg font-medium text-red-800">
                Job Not Found
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {jobError?.message || "The requested job could not be found."}
              </p>
              <Button
                onClick={() => router.push("/dashboard/jobs")}
                className="mt-4"
              >
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
                  onClick={() => router.push("/dashboard/jobs")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {job.title || "Untitled Job"}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-gray-600">
                      {job.jobNo || "No Job Number"}
                    </p>
                    <Badge className={getStatusColor(job.status || "pending")}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(job.status || "pending")}
                        <span>
                          {(job.status || "pending").replace("_", " ")}
                        </span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Status Update Dropdown */}
                <Select
                  value={job.status || "pending"}
                  onValueChange={async (newStatus) => {
                    try {
                      const { error } = await supabase
                        .from("jobs")
                        .update({
                          status: newStatus,
                          updated_at: new Date().toISOString(),
                        })
                        .eq(isUUIDParam ? "id" : "jobNo", jobId);

                      if (error) {
                        console.error("Status update error:", error);
                        toast.error("Failed to update status");
                      } else {
                        toast.success("Status updated successfully");
                        // Refresh the job data
                        if (isUUIDParam) {
                          mutate(`job-${jobId}`);
                        } else if (isJobNoParam) {
                          mutate(`job-number-${jobId}`);
                        }
                      }
                    } catch (error) {
                      console.error("Status update error:", error);
                      toast.error("Failed to update status");
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
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this job? This action cannot be undone.",
                      )
                    ) {
                      try {
                        const { error } = await supabase
                          .from("jobs")
                          .delete()
                          .eq(isUUIDParam ? "id" : "jobNo", jobId);

                        if (error) {
                          console.error("Delete error:", error);
                          toast.error("Failed to delete job");
                        } else {
                          toast.success("Job deleted successfully");
                          router.push("/dashboard/jobs");
                        }
                      } catch (error) {
                        console.error("Delete error:", error);
                        toast.error("Failed to delete job");
                      }
                    }
                  }}
                >
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
                      <label className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <p className="text-gray-900 mt-1">{job.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <p className="text-gray-900 font-medium">
                        {job.quantity?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <p className="text-gray-900 font-medium capitalize">
                        {job.priority || "Medium"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Specifications */}
              {(enhancedJob?.size_type || enhancedJob?.paper_type || enhancedJob?.finishing_options) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Size Specifications */}
                    {enhancedJob?.size_type && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Ruler className="h-4 w-4 mr-2" />
                          Size
                        </h3>
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <label className="text-xs text-gray-500">Type</label>
                            <p className="text-gray-900 font-medium capitalize">
                              {enhancedJob.size_type || "N/A"}
                            </p>
                          </div>
                          {enhancedJob.size_type === "standard" && enhancedJob.size_preset && (
                            <div>
                              <label className="text-xs text-gray-500">Preset</label>
                              <p className="text-gray-900 font-medium">
                                {enhancedJob.size_preset || "N/A"}
                              </p>
                            </div>
                          )}
                          {enhancedJob.size_type === "custom" && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Width</label>
                                <p className="text-gray-900 font-medium">
                                  {enhancedJob.custom_width} {enhancedJob.size_unit}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Height</label>
                                <p className="text-gray-900 font-medium">
                                  {enhancedJob.custom_height} {enhancedJob.size_unit}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Paper Specifications */}
                    {(enhancedJob?.paper_type || enhancedJob?.paper_weight) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <File className="h-4 w-4 mr-2" />
                          Paper
                        </h3>
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <label className="text-xs text-gray-500">Type</label>
                            <p className="text-gray-900 font-medium">
                              {enhancedJob.paper_type || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Weight</label>
                            <p className="text-gray-900 font-medium">
                              {enhancedJob.paper_weight ? `${enhancedJob.paper_weight} GSM` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Finishing Options */}
                    {getSelectedFinishOptions().length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Scissors className="h-4 w-4 mr-2" />
                          Finishing Options
                        </h3>
                        <div className="flex flex-wrap gap-2 pl-6">
                          {getSelectedFinishOptions().map((option: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {enhancedJob?.special_instructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <p className="text-gray-900 mt-1">{enhancedJob.special_instructions}</p>
                      </div>
                    )}

                    {/* Requirements */}
                    {enhancedJob?.requirements && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Requirements
                        </label>
                        <p className="text-gray-900 mt-1">{enhancedJob.requirements}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Files */}
              <JobFilesViewer jobId={job.id} canDelete={true} />
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
                    <p className="font-medium text-gray-900">
                      {job.customer_name || "Unknown Customer"}
                    </p>
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
                  {job.unit_price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Unit Price</span>
                      <span className="font-medium">
                        SLL {job.unit_price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {job.estimate_price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Estimate
                      </span>
                      <span className="font-medium">
                        SLL {job.estimate_price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Estimated Price
                    </span>
                    <span className="font-medium">
                      SLL {(job.estimate_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Final Price</span>
                    <span className="font-medium">
                      SLL {(job.final_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Per Unit</span>
                    <span className="font-medium">
                      SLL{" "}
                      {(
                        job.unit_price ||
                        (job.final_price || 0) / (job.quantity || 1)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Badge
                      variant={job.invoiced ? "default" : "outline"}
                      className="w-full justify-center"
                    >
                      {job.invoiced ? "Invoiced" : "Not Invoiced"}
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
                        {new Date(job.submittedDate).toLocaleDateString(
                          "en-SL",
                        )}
                      </span>
                    </div>
                  )}

                  {job.estimated_delivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Est. Delivery
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(job.estimated_delivery).toLocaleDateString(
                          "en-SL",
                        )}
                      </span>
                    </div>
                  )}

                  {job.actual_delivery && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="text-sm font-medium">
                        {new Date(job.actual_delivery).toLocaleDateString(
                          "en-SL",
                        )}
                      </span>
                    </div>
                  )}

                  {job.assigned_to && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Assigned to</span>
                      <span className="text-sm font-medium">
                        {job.assigned_to}
                      </span>
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
                      <a
                        href={job.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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