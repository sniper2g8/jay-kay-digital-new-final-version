import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FileRecord } from './useFileUploadFixed';

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
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      return JSON.stringify(err, Object.getOwnPropertyNames(err));
    }
    return 'Unknown error occurred';
  };

  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchFiles = useCallback(async (forceRefresh = false) => {
    if (!jobId || (!jobId.trim())) {
      setFiles([]);
      return;
    }

    // Validate UUID format
    if (!isValidUUID(jobId)) {
      const errorMessage = `Invalid job ID format: ${jobId}. Expected UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000)`;
      console.error('❌', errorMessage);
      setError(errorMessage);
      setFiles([]);
      return;
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && fileCache[jobId]) {
      const cached = fileCache[jobId];
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        console.log('📋 Using cached files for job:', jobId, 'Files:', cached.files.length);
        setFiles(cached.files);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching files for job:', jobId);
      
      const { data, error: fetchError } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('entity_id', jobId)
        .eq('entity_type', 'job')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching files:', serializeError(fetchError));
        throw fetchError;
      }

      const fetchedFiles = data || [];
      console.log('✅ Files fetched:', fetchedFiles.length);
      
      // Update cache
      fileCache[jobId] = {
        files: fetchedFiles,
        timestamp: Date.now(),
        hasFiles: fetchedFiles.length > 0
      };
      
      setFiles(fetchedFiles);
      
    } catch (err) {
      const errorMessage = serializeError(err);
      console.error('❌ Error in fetchFiles:', errorMessage);
      setError(errorMessage);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

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
      console.log('🗑️  Deleting file:', fileId);
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('❌ Error deleting file from database:', serializeError(dbError));
        throw dbError;
      }

      // Try to delete from storage (if we have the path)
      if (filePath) {
        // Extract the storage path from the full URL
        const urlParts = filePath.split('/storage/v1/object/public/job-files/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          
          const { error: storageError } = await supabase.storage
            .from('job-files')
            .remove([storagePath]);

          if (storageError) {
            console.warn('⚠️  Could not delete file from storage:', serializeError(storageError));
            // Don't throw error here as database deletion succeeded
          } else {
            console.log('✅ File deleted from storage');
          }
        }
      }

      // Invalidate cache and refresh file list
      if (jobId) {
        delete fileCache[jobId];
      }
      await fetchFiles(true); // Force refresh
      
      console.log('✅ File deleted successfully');
      return true;
      
    } catch (err) {
      const errorMessage = serializeError(err);
      console.error('❌ Error deleting file:', errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('⬇️  Downloading file:', fileName);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download initiated');
      return true;
      
    } catch (err) {
      console.error('❌ Error downloading file:', serializeError(err));
      setError('Failed to download file');
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
    Object.keys(fileCache).forEach(key => delete fileCache[key]);
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
    isCached: jobId ? !!fileCache[jobId] : false
  };
};