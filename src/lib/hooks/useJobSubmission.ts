import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mutate } from "swr";
import { JobFormData } from "./useJobSubmissionForm.ts";
import { FileRecord } from "./useFileUploadFixed.ts";

export const useJobSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const submitJob = async (
    formData: JobFormData,
    estimatedPrice: number,
    finishingOptionPrices: Record<string, number>,
    uploadedFileRecords: FileRecord[] = [],
    jobId?: string,
  ) => {
    if (!user) {
      toast.error("You must be logged in to submit a job");
      throw new Error("User not authenticated");
    }

    if (!formData.customer_id || !formData.service_id || !formData.title) {
      toast.error("Please fill in all required fields");
      throw new Error("Missing required fields");
    }

    setIsSubmitting(true);
    try {
      // Get next job number from counters using database function
      const { data: nextJobNumber, error: counterError } = await supabase.rpc(
        "get_next_counter",
        { counter_name: "job" },
      );

      if (counterError) {
        const errorMessage = counterError.message || String(counterError);
        console.error("Error fetching next job counter:", errorMessage);
        throw new Error("Failed to generate job number. Please try again.");
      }

      // Generate formatted job number with human-readable format
      const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
      
      // Get customer and service names for display
      const { data: customer } = await supabase
        .from("customers")
        .select("business_name")
        .eq("id", formData.customer_id)
        .single();
        
      const { data: service } = await supabase
        .from("services")
        .select("title")
        .eq("id", formData.service_id)
        .single();

      // Create job record matching the ACTUAL database schema
      const jobData = {
        id: jobId || crypto.randomUUID(),
        jobNo: jobNumber,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        customerName: customer?.business_name || null,
        serviceName: service?.title || null,
        title: formData.title,
        description: formData.description || null,
        status: "pending" as const,
        priority: formData.priority,
        quantity: formData.quantity,
        estimate_price: estimatedPrice, // Use correct column name
        estimated_delivery: formData.due_date || null,
        unit_price: formData.unit_price || null,
        job_type: "other" as const, // Default value
        submittedDate: new Date().toISOString(),
        createdBy: user?.id || null,
        // Note: specifications column doesn't exist in the actual schema
        // We'll need to store specifications data differently if needed
      };

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();

      if (jobError) {
        console.error("Job creation error details:", {
          message: jobError.message,
          code: jobError.code,
          details: jobError.details,
          hint: jobError.hint,
        });

        // Provide user-friendly error messages
        let userMessage = "Failed to create job.";
        if (jobError.message.includes("permission denied")) {
          userMessage =
            "Permission denied. Please contact an administrator to configure database permissions.";
        } else if (jobError.message.includes("duplicate")) {
          userMessage = "A job with this information already exists.";
        } else if (jobError.message.includes("foreign key")) {
          userMessage = "Invalid customer or service selected.";
        } else if (jobError.message.includes("schema cache")) {
          userMessage = "Database schema mismatch. Please contact support.";
        }

        throw new Error(userMessage);
      }

      // NOTE: File attachments are already handled by the upload process
      // The uploadedFileRecords contain files that have already been inserted into the database
      // by the useFileUploadFixed hook, so we don't need to insert them again here.
      if (uploadedFileRecords.length > 0) {
        console.log("Files already attached during upload process:", uploadedFileRecords.length, "files");
      }

      toast.success("Job submitted successfully!");

      // Invalidate all job-related caches for immediate UI updates
      mutate("jobs");
      mutate("jobs-with-customers");
      mutate("job-stats");
      
      router.push(`/dashboard/jobs`);

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error submitting job:", errorMessage);

      // Enhanced error handling with specific messages
      let userFriendlyMessage = "Failed to submit job. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("permission denied")) {
          userFriendlyMessage =
            "Database permissions need to be configured. Please contact support.";
        } else if (err.message.includes("Network request failed")) {
          userFriendlyMessage = "Network error. Please check your connection.";
        } else if (err.message.includes("duplicate")) {
          userFriendlyMessage = "A job with this information already exists.";
        } else if (err.message.includes("foreign key")) {
          userFriendlyMessage = "Please select valid customer and service options.";
        } else {
          userFriendlyMessage = err.message;
        }
      }

      toast.error(userFriendlyMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitJob,
    isSubmitting,
  };
};