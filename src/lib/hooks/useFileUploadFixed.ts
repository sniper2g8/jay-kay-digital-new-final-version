import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  id: string;
  errorMessage?: string;
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
}

export interface FileRecord {
  id: string;
  entity_id: string;
  entity_type: string;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by?: string | null;
  created_at: string | null;
}

export const useFileUploadFixed = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (files: File[]) => {
    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      // Max file size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max size is 10MB.`);
        return false;
      }

      // Allowed file types
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not allowed for ${file.name}`);
        return false;
      }

      return true;
    });

    const newUploads: FileUpload[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
      id: crypto.randomUUID(),
    }));

    setFileUploads((prev) => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setFileUploads((prev) => prev.filter((upload) => upload.id !== id));
  };

  const uploadFiles = async (
    jobId: string,
    userId?: string,
  ): Promise<FileRecord[]> => {
    if (fileUploads.length === 0) {
      return [];
    }

    setIsUploading(true);
    const uploadedFiles: FileRecord[] = [];

    try {
      // Check authentication before starting upload
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }

      if (!session) {
        console.error("❌ No active session found");
        throw new Error("You must be logged in to upload files");
      }

      console.log("✅ Authentication verified for user:", session.user.email);
      console.log(
        `🚀 Starting upload of ${fileUploads.length} files for job ${jobId}`,
      );

      // Use session user ID if not provided
      const uploadUserId = userId || session.user.id;

      for (const upload of fileUploads) {
        if (upload.status === "completed") {
          console.log(
            `⏭️  Skipping already uploaded file: ${upload.file.name}`,
          );
          continue;
        }

        try {
          // Update status to uploading
          setFileUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { 
                    ...u, 
                    status: "uploading", 
                    progress: 0,
                    uploadSpeed: 0,
                    estimatedTimeRemaining: 0 
                  }
                : u,
            ),
          );

          // Create unique filename with timestamp
          const timestamp = Date.now();
          const sanitizedFileName = upload.file.name
            .replace(/[^a-zA-Z0-9.-]/g, "_")
            .replace(/_{2,}/g, "_");

          const fileName = `jobs/${jobId}/${timestamp}_${sanitizedFileName}`;

          console.log(`📤 Uploading file: ${fileName}`);

          // Simulate upload progress with intervals
          const startTime = Date.now();
          const fileSize = upload.file.size;
          
          const progressInterval = setInterval(() => {
            setFileUploads((prev) =>
              prev.map((u) => {
                if (u.id === upload.id && u.status === "uploading") {
                  const currentTime = Date.now();
                  const elapsedSeconds = (currentTime - startTime) / 1000;
                  const estimatedTotalTime = Math.max(2, fileSize / (1024 * 1024) * 2); // 2 seconds per MB minimum
                  const newProgress = Math.min(90, (elapsedSeconds / estimatedTotalTime) * 100);
                  
                  const uploadSpeed = fileSize * (newProgress / 100) / elapsedSeconds;
                  const remainingProgress = 100 - newProgress;
                  const estimatedTimeRemaining = remainingProgress > 0 ? (remainingProgress / 100) * estimatedTotalTime - elapsedSeconds : 0;
                  
                  return {
                    ...u,
                    progress: Math.round(newProgress),
                    uploadSpeed: uploadSpeed,
                    estimatedTimeRemaining: Math.max(0, estimatedTimeRemaining)
                  };
                }
                return u;
              })
            );
          }, 200); // Update every 200ms

          try {
            // Upload to Supabase Storage using the simple upload method
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("job-files")
                .upload(fileName, upload.file, {
                  cacheControl: "3600",
                  upsert: false,
                  metadata: {
                    jobId: jobId,
                    originalName: upload.file.name,
                    uploadedBy: uploadUserId,
                    uploadDate: new Date().toISOString(),
                  },
                });

            clearInterval(progressInterval);

            if (uploadError) {
              console.error("❌ Upload error:", uploadError);
              throw uploadError;
            }

            console.log("✅ File uploaded to storage:", uploadData.path);

            // Update progress to 95% after upload
            setFileUploads((prev) =>
              prev.map((u) => 
                u.id === upload.id 
                  ? { ...u, progress: 95, uploadSpeed: 0, estimatedTimeRemaining: 0 } 
                  : u
              ),
            );

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from("job-files")
              .getPublicUrl(uploadData.path);

            console.log("🔗 Public URL generated:", urlData.publicUrl);

            // Save file record to database
            const fileRecord = {
              id: crypto.randomUUID(),
              entity_id: jobId,
              entity_type: "job",
              file_name: upload.file.name,
              file_url: urlData.publicUrl,
              file_size: upload.file.size,
              file_type: upload.file.type,
              uploaded_by: uploadUserId,
            };

            const { data: dbData, error: dbError } = await supabase
              .from("file_attachments")
              .insert([fileRecord])
              .select()
              .single();

            if (dbError) {
              console.error("❌ Database error:", dbError);

              // Clean up uploaded file if database insert fails
              await supabase.storage.from("job-files").remove([uploadData.path]);

              throw dbError;
            }

            console.log("✅ File record saved to database:", dbData.id);

            // Update progress to 100%
            setFileUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? { ...u, status: "completed", progress: 100, uploadSpeed: 0, estimatedTimeRemaining: 0 }
                  : u,
              ),
            );

            uploadedFiles.push(dbData);
            toast.success(`File "${upload.file.name}" uploaded successfully`);
            
          } catch (uploadError) {
            clearInterval(progressInterval);
            throw uploadError;
          }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Upload failed";
          console.error(`❌ Error uploading file ${upload.file.name}:`, err);

          setFileUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? {
                    ...u,
                    status: "error",
                    progress: 0,
                    errorMessage: errorMessage,
                  }
                : u,
            ),
          );

          toast.error(`Failed to upload ${upload.file.name}: ${errorMessage}`);
        }
      }

      console.log(
        `🎉 Upload complete! ${uploadedFiles.length} files uploaded successfully`,
      );
    } catch (globalError: unknown) {
      const errorMessage =
        globalError instanceof Error ? globalError.message : "Unknown error";
      console.error("❌ Global upload error:", globalError);
      toast.error("Upload process failed: " + errorMessage);
    } finally {
      setIsUploading(false);
    }

    return uploadedFiles;
  };

  const clearFiles = () => {
    setFileUploads([]);
  };

  const clearCompletedFiles = () => {
    setFileUploads((prev) =>
      prev.filter((upload) => upload.status !== "completed"),
    );
  };

  const getUploadProgress = (): number => {
    if (fileUploads.length === 0) return 0;

    const totalProgress = fileUploads.reduce(
      (sum, upload) => sum + upload.progress,
      0,
    );
    return Math.round(totalProgress / fileUploads.length);
  };

  const hasFailedUploads = (): boolean => {
    return fileUploads.some((upload) => upload.status === "error");
  };

  const hasCompletedUploads = (): boolean => {
    return fileUploads.some((upload) => upload.status === "completed");
  };

  const hasPendingUploads = (): boolean => {
    return fileUploads.some((upload) => upload.status === "pending");
  };

  return {
    fileUploads,
    handleFileSelect,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles,
    clearCompletedFiles,
    getUploadProgress,
    hasFailedUploads,
    hasCompletedUploads,
    hasPendingUploads,
    isUploading,
    setFileUploads,
  };
};
