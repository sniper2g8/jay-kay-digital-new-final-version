import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FileRecord } from "./useFileUploadFixed";

interface FileCache {
  [jobId: string]: {
    files: FileRecord[];
    timestamp: number;
    hasFiles: boolean;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const fileCache: FileCache = {};

export const useJobFiles = (jobId: string | null) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const serializeError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      return JSON.stringify(err, Object.getOwnPropertyNames(err));
    }
    return "Unknown error occurred";
  };

  const isValidJobId = (jobId: string): boolean => {
    // Accept both UUID format and human-readable job numbers (JKDP-JOB-XXXX)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const jobNoRegex = /^JKDP-JOB-\d+$/i;
    return uuidRegex.test(jobId) || jobNoRegex.test(jobId);
  };

  const fetchFiles = useCallback(
    async (forceRefresh = false) => {
      if (!jobId || !jobId.trim()) {
        setFiles([]);
        return;
      }

      // Validate job ID format (UUID or human-readable)
      if (!isValidJobId(jobId)) {
        const errorMessage = `Invalid job ID format: ${jobId}. Expected UUID format or job number format (JKDP-JOB-XXXX)`;
        console.error("❌", errorMessage);
        setError(errorMessage);
        setFiles([]);
        return;
      }

      // Check cache first (unless forcing refresh)
      if (!forceRefresh && fileCache[jobId]) {
        const cached = fileCache[jobId];
        const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;

        if (!isExpired) {
          console.log(
            "📋 Using cached files for job:",
            jobId,
            "Files:",
            cached.files.length,
          );
          setFiles(cached.files);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🔍 Fetching files for job:", jobId);

        let entityId = jobId;

        // If jobId is human-readable (JKDP-JOB-XXXX), resolve to UUID
        if (jobId.startsWith("JKDP-JOB-")) {
          console.log("🔄 Resolving human-readable job ID to UUID:", jobId);
          const { data: jobData, error: jobError } = await supabase
            .from("jobs")
            .select("id")
            .eq("jobNo", jobId)
            .single();

          if (jobError || !jobData) {
            console.warn("⚠️  Job not found in jobs table:", jobId);
            // Set empty files and return instead of throwing error
            setFiles([]);
            setError(null); // Clear any previous errors
            fileCache[jobId] = {
              files: [],
              timestamp: Date.now(),
              hasFiles: false,
            };
            return;
          }

          entityId = jobData.id;
          console.log("✅ Resolved to UUID:", entityId);
        }

        // Query files using the resolved UUID (or direct UUID if passed)
        const { data, error: fetchError } = await supabase
          .from("file_attachments")
          .select("*")
          .eq("entity_id", entityId)
          .eq("entity_type", "job")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("❌ Error fetching files:", serializeError(fetchError));
          throw fetchError;
        }

        const fetchedFiles = data || [];
        console.log(
          `✅ Files fetched for ${jobId} (${entityId}):`,
          fetchedFiles.length,
        );

        // Update cache
        fileCache[jobId] = {
          files: fetchedFiles,
          timestamp: Date.now(),
          hasFiles: fetchedFiles.length > 0,
        };

        setFiles(fetchedFiles);
      } catch (err) {
        const errorMessage = serializeError(err);
        console.error("❌ Error in fetchFiles:", errorMessage);
        setError(errorMessage);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    },
    [jobId],
  );

  // Debounced fetch with optimization for empty job IDs
  useEffect(() => {
    if (!jobId || !jobId.trim()) {
      setFiles([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetch request
    fetchTimeoutRef.current = setTimeout(() => {
      fetchFiles();
    }, 300); // 300ms debounce

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [jobId, fetchFiles]);

  const deleteFile = async (fileId: string, filePath?: string) => {
    try {
      console.log("🗑️  Deleting file:", fileId);

      // Delete from database first
      const { error: dbError } = await supabase
        .from("file_attachments")
        .delete()
        .eq("id", fileId);

      if (dbError) {
        console.error(
          "❌ Error deleting file from database:",
          serializeError(dbError),
        );
        throw dbError;
      }

      // Try to delete from storage (if we have the path)
      if (filePath) {
        // Extract the storage path from the full URL
        const urlParts = filePath.split("/storage/v1/object/public/job-files/");
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];

          const { error: storageError } = await supabase.storage
            .from("job-files")
            .remove([storagePath]);

          if (storageError) {
            console.warn(
              "⚠️  Could not delete file from storage:",
              serializeError(storageError),
            );
            // Don't throw error here as database deletion succeeded
          } else {
            console.log("✅ File deleted from storage");
          }
        }
      }

      // Invalidate cache and refresh file list
      if (jobId) {
        delete fileCache[jobId];
      }
      await fetchFiles(true); // Force refresh

      console.log("✅ File deleted successfully");
      return true;
    } catch (err) {
      const errorMessage = serializeError(err);
      console.error("❌ Error deleting file:", errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log("⬇️  Downloading file:", fileName, "from:", fileUrl);

      // Handle blob URLs (temporary URLs from browser)
      if (fileUrl.startsWith("blob:")) {
        console.log("🔄 Detected blob URL, attempting direct download...");
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("✅ Blob download initiated");
        return true;
      }

      // Handle Supabase storage URLs - now that bucket is public, use direct download
      if (fileUrl.includes("/storage/v1/object/")) {
        console.log(
          "🔄 Detected Supabase storage URL, using direct download...",
        );

        try {
          // First try direct URL download since bucket is public
          const response = await fetch(fileUrl, {
            method: "GET",
            headers: {
              Accept: "*/*",
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(url);

            console.log("✅ Download completed via direct URL");
            return true;
          } else {
            console.log("⚠️  Direct URL failed with status:", response.status);
          }
        } catch (fetchError) {
          console.log("⚠️  Direct URL fetch failed:", fetchError);
        }

        // Fallback: Extract file path and use storage API
        const urlParts = fileUrl.split("/storage/v1/object/public/job-files/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          console.log("� Falling back to storage API for path:", filePath);

          const { data, error } = await supabase.storage
            .from("job-files")
            .download(filePath);

          if (error) {
            console.error("❌ Error downloading from storage:", error);
            throw error;
          }

          if (data) {
            // Create blob URL and trigger download
            const url = URL.createObjectURL(data);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the blob URL
            URL.revokeObjectURL(url);

            console.log("✅ Download completed via storage API");
            return true;
          }
        }
      }

      // Final fallback: try direct download with fetch
      console.log("🔄 Attempting final fallback direct fetch download...");
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log("✅ Download completed via fallback fetch");
      return true;
    } catch (err) {
      console.error("❌ Error downloading file:", serializeError(err));
      setError("Failed to download file: " + serializeError(err));
      return false;
    }
  };

  const refreshFiles = () => {
    if (jobId) {
      delete fileCache[jobId]; // Clear cache
    }
    fetchFiles(true); // Force refresh
  };

  // Clear cache for all jobs (useful for cleanup)
  const clearCache = () => {
    Object.keys(fileCache).forEach((key) => delete fileCache[key]);
  };

  return {
    files,
    loading,
    error,
    deleteFile,
    downloadFile,
    refreshFiles,
    clearCache,
    hasFiles: files.length > 0,
    isCached: jobId ? !!fileCache[jobId] : false,
  };
};
