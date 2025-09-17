import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mutate } from "swr";
import { JobFormData } from "./useJobSubmissionForm";
import { FileRecord } from "./useFileUploadFixed";

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
        console.error("Error fetching next job counter:", counterError);
        throw new Error("Failed to generate job number");
      }

      // Generate formatted job number with human-readable format
      const jobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, "0")}`;
      console.log("Generated job number:", jobNumber);

      // Prepare specifications with all details
      const specifications = {
        requirements: formData.requirements,
        special_instructions: formData.special_instructions,
        unit_price: formData.unit_price,
        size:
          formData.size_type === "standard"
            ? { type: "standard", preset: formData.size_preset }
            : {
                type: "custom",
                width: formData.custom_width,
                height: formData.custom_height,
                unit: formData.custom_unit,
              },
        paper: {
          type: formData.paper_type,
          weight: formData.paper_weight,
        },
      };

      // Create job record matching the actual database schema
      const jobData = {
        id: jobId || crypto.randomUUID(),
        jobNo: jobNumber,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        title: formData.title,
        description: formData.description || null,
        status: "pending",
        priority: formData.priority,
        quantity: formData.quantity,
        estimated_cost: estimatedPrice,
        estimated_delivery: formData.due_date || null,
        specifications: specifications,
        submittedDate: new Date().toISOString(),
        createdBy: user?.id || null,
        // Finishing options data
        finishIds: formData.finishing_options,
        finishOptions: formData.finishing_options,
        finishPrices: finishingOptionPrices,
      };

      console.log("Submitting job data:", jobData);

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
        }

        throw new Error(userMessage);
      }

      // Attach files if any were uploaded
      if (uploadedFileRecords.length > 0) {
        const { error: filesError } = await supabase
          .from("file_attachments")
          .insert(uploadedFileRecords);

        if (filesError) {
          console.error("File attachment error:", filesError);
          throw new Error(`Failed to attach files: ${filesError.message}`);
        }
      }

      toast.success("Job submitted successfully!");

      // Invalidate all job-related caches for immediate UI updates
      mutate("jobs");
      mutate("jobs-with-customers");
      mutate("job-stats");
      console.log("Cache invalidated after job submission");

      router.push(`/dashboard/jobs`);

      return job;
    } catch (err) {
      console.error("Error submitting job:", err);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to submit job. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("permission denied")) {
          errorMessage =
            "Database permissions need to be configured. Please contact support.";
          console.log(
            "🔧 SOLUTION: Execute the SQL in add-auth-policies.sql in your Supabase dashboard",
          );
        } else if (err.message.includes("Network request failed")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message.includes("duplicate")) {
          errorMessage = "A job with this information already exists.";
        } else if (err.message.includes("foreign key")) {
          errorMessage = "Please select valid customer and service options.";
        } else {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage);
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
