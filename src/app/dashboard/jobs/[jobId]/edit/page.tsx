"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Upload,
  X,
  File,
  FileImage,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { useJob } from "@/lib/hooks/useJobs";
import { useFileUploadFixed } from "@/lib/hooks/useFileUploadFixed";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { mutate } from "swr";

interface JobFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string | null;
  entity_id: string;
  entity_type: string;
  uploaded_by: string | null;
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const { data: job, error: jobError, isLoading: jobLoading } = useJob(jobId);
  const { fileUploads, handleFileSelect, removeFile, uploadFiles } =
    useFileUploadFixed();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFiles, setExistingFiles] = useState<JobFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    quantity: 0,
    unit_price: 0,
    final_price: 0,
    estimate_price: 0,
    estimated_delivery: "",
    actual_delivery: "",
    assigned_to: "",
    special_instructions: "",
  });

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        status: job.status || "pending",
        priority: job.priority || "medium",
        quantity: job.quantity || 0,
        unit_price: job.unit_price || 0,
        final_price: job.final_price || 0,
        estimate_price: job.estimate_price || 0,
        estimated_delivery: job.estimated_delivery
          ? job.estimated_delivery.split("T")[0]
          : "",
        actual_delivery: job.actual_delivery
          ? job.actual_delivery.split("T")[0]
          : "",
        assigned_to: job.assigned_to || "",
        special_instructions: "",
      });
    }
  }, [job]);

  // Load existing files
  useEffect(() => {
    const loadFiles = async () => {
      if (!job?.id) return;

      setFilesLoading(true);
      try {
        const { data, error } = await supabase
          .from("file_attachments")
          .select("*")
          .eq("entity_id", job.id)
          .eq("entity_type", "job")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading files:", error);
          toast.error("Failed to load job files");
        } else {
          setExistingFiles(data || []);
        }
      } catch (err) {
        console.error("Error loading files:", err);
        toast.error("Error loading job files");
      } finally {
        setFilesLoading(false);
      }
    };

    loadFiles();
  }, [job?.id]);

  const removeExistingFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from("file_attachments")
        .delete()
        .eq("id", fileId);

      if (error) {
        console.error("Error deleting file:", error);
        toast.error("Failed to delete file");
      } else {
        setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success("File deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("Error deleting file");
    }
  };

  const downloadFile = async (file: JobFile) => {
    try {
      // Extract storage path from the public URL
      const urlParts = file.file_url.split(
        "/storage/v1/object/public/job-files/",
      );
      if (urlParts.length !== 2) {
        throw new Error("Invalid file URL format");
      }

      const filePath = urlParts[1];
      const { data, error } = await supabase.storage
        .from("job-files")
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <FileImage className="h-5 w-5 text-blue-500" />;
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!job) {
        throw new Error("Job data not available");
      }

      const { error } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority as "low" | "normal" | "high" | "urgent",
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          final_price: formData.final_price,
          estimate_price: formData.estimate_price,
          estimated_delivery: formData.estimated_delivery || null,
          actual_delivery: formData.actual_delivery || null,
          assigned_to: formData.assigned_to || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) {
        throw error;
      }

      // Upload new files if any
      if (fileUploads.length > 0) {
        try {
          await uploadFiles(job.id);
          // Reload existing files to show the new uploads
          const { data: updatedFiles } = await supabase
            .from("file_attachments")
            .select("*")
            .eq("entity_id", job.id)
            .eq("entity_type", "job")
            .order("created_at", { ascending: false });

          setExistingFiles(updatedFiles || []);
        } catch (fileError) {
          console.error("File upload error:", fileError);
          toast.error("Job updated but some files failed to upload");
        }
      }

      // Invalidate caches for real-time updates
      mutate("jobs");
      mutate("jobs-with-customers");
      mutate("job-stats");
      mutate(`job-${jobId}`);

      toast.success("Job updated successfully!");
      router.push(`/dashboard/jobs/${jobId}`);
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        name: error instanceof Error ? error.name : "Unknown error type",
        code:
          error && typeof error === "object" && "code" in error
            ? (error as { code: unknown }).code
            : undefined,
        details:
          error && typeof error === "object" && "details" in error
            ? (error as { details: unknown }).details
            : undefined,
        hint:
          error && typeof error === "object" && "hint" in error
            ? (error as { hint: unknown }).hint
            : undefined,
        jobId: jobId,
        formData: "Form data submitted",
      });

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to update job. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("permission denied")) {
          errorMessage = "Permission denied. Please check your access rights.";
        } else if (error.message.includes("unique constraint")) {
          errorMessage = "A job with this information already exists.";
        } else if (error.message.includes("foreign key")) {
          errorMessage =
            "Invalid data reference. Please check your selections.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Job not found. It may have been deleted.";
        } else {
          errorMessage = `Update failed: ${error.message}`;
        }
      }

      toast.error(errorMessage);
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
                <h3 className="text-lg font-medium text-red-800">
                  Job Not Found
                </h3>
              </div>
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
                  onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Job
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
                  <p className="text-gray-600">
                    {job.jobNo || "No Job Number"} •{" "}
                    {job.customer_name || "Unknown Customer"}
                  </p>
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
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleInputChange(
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit_price">Unit Price (SLL)</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          handleInputChange(
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimate_price">
                        Total Estimate (SLL)
                      </Label>
                      <Input
                        id="estimate_price"
                        type="number"
                        step="0.01"
                        value={formData.estimate_price}
                        onChange={(e) =>
                          handleInputChange(
                            "estimate_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
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
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          handleInputChange("priority", value)
                        }
                      >
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
                        onChange={(e) =>
                          handleInputChange("assigned_to", e.target.value)
                        }
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
                      <Label htmlFor="estimate_price">Estimate Price</Label>
                      <Input
                        id="estimate_price"
                        type="number"
                        step="0.01"
                        value={formData.estimate_price}
                        onChange={(e) =>
                          handleInputChange(
                            "estimate_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="final_price">Final Price</Label>
                      <Input
                        id="final_price"
                        type="number"
                        step="0.01"
                        value={formData.final_price}
                        onChange={(e) =>
                          handleInputChange(
                            "final_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
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
                      <Label htmlFor="estimated_delivery">
                        Estimated Delivery
                      </Label>
                      <Input
                        id="estimated_delivery"
                        type="date"
                        value={formData.estimated_delivery}
                        onChange={(e) =>
                          handleInputChange(
                            "estimated_delivery",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="actual_delivery">Actual Delivery</Label>
                      <Input
                        id="actual_delivery"
                        type="date"
                        value={formData.actual_delivery}
                        onChange={(e) =>
                          handleInputChange("actual_delivery", e.target.value)
                        }
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
                    <Label htmlFor="special_instructions">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="special_instructions"
                      value={formData.special_instructions}
                      onChange={(e) =>
                        handleInputChange(
                          "special_instructions",
                          e.target.value,
                        )
                      }
                      placeholder="Any special instructions or notes for this job..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Finishing Options Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Finishing Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No finishing options available</p>
                      <p className="text-xs mt-1">
                        Finishing options are set during job creation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Job Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Files */}
                  <div>
                    <Label>Existing Files</Label>
                    {filesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading files...
                      </div>
                    ) : existingFiles.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No files attached to this job
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {existingFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(file.file_name)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {file.file_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(file.file_size)} •{" "}
                                  {file.created_at
                                    ? new Date(
                                        file.created_at,
                                      ).toLocaleDateString("en-SL")
                                    : "Unknown date"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this file?",
                                    )
                                  ) {
                                    removeExistingFile(file.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New Files */}
                  <div>
                    <Label htmlFor="new-files">Add New Files</Label>
                    <div className="mt-2">
                      <Input
                        id="new-files"
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP
                      </p>
                    </div>
                  </div>

                  {/* New File Uploads Preview */}
                  {fileUploads.length > 0 && (
                    <div>
                      <Label>New Files to Upload</Label>
                      <div className="space-y-2 mt-2">
                        {fileUploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(upload.file.name)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {upload.file.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(upload.file.size)} •{" "}
                                  {upload.status}
                                </p>
                                {upload.status === "uploading" && (
                                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${upload.progress}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile(upload.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
