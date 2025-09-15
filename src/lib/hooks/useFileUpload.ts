import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id: string;
  uploadSpeed?: number; // bytes per second
  startTime?: number;
  estimatedTimeRemaining?: number; // seconds
}

export interface FileRecord {
  entity_id: string;
  entity_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
}

export const useFileUpload = () => {
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newUploads: FileUpload[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      id: crypto.randomUUID()
    }));
    
    setFileUploads(prev => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const uploadFiles = async (jobId: string, userId?: string): Promise<FileRecord[]> => {
    const uploadedFiles: FileRecord[] = [];

    for (let i = 0; i < fileUploads.length; i++) {
      const upload = fileUploads[i];
      
        try {
          setFileUploads(prev => prev.map(u => 
            u.id === upload.id ? { 
              ...u, 
              status: 'uploading', 
              progress: 0, 
              startTime: Date.now(),
              uploadSpeed: 0,
              estimatedTimeRemaining: 0
            } : u
          ));        const fileName = `${jobId}/${upload.file.name}`;
        
        // Create FormData for XMLHttpRequest to track progress
        const formData = new FormData();
        formData.append('file', upload.file);
        
        // Get upload URL from Supabase
        const { data: urlData, error: urlError } = await supabase.storage
          .from('job-files')
          .createSignedUploadUrl(fileName);
          
        if (urlError) {
          console.warn('Signed URL creation failed, falling back to basic upload:', urlError);
          
          // Fallback to basic upload without progress tracking
          const { data, error } = await supabase.storage
            .from('job-files')
            .upload(fileName, upload.file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) {
            console.error('Basic upload also failed:', error);
            throw error;
          }
          
          setFileUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u
          ));
          
          const { data: fileUrl } = supabase.storage
            .from('job-files')
            .getPublicUrl(data.path);

          uploadedFiles.push({
            entity_id: jobId,
            entity_type: 'job',
            file_name: upload.file.name,
            file_url: fileUrl.publicUrl,
            file_size: upload.file.size,
            file_type: upload.file.type,
            uploaded_by: userId
          });
        } else {
          // Use XMLHttpRequest for progress tracking
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                const currentTime = Date.now();
                
                setFileUploads(prev => prev.map(u => {
                  if (u.id === upload.id && u.startTime) {
                    const elapsedTime = (currentTime - u.startTime) / 1000; // seconds
                    const uploadSpeed = e.loaded / elapsedTime; // bytes per second
                    const remainingBytes = e.total - e.loaded;
                    const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;
                    
                    return { 
                      ...u, 
                      progress: percentComplete,
                      uploadSpeed,
                      estimatedTimeRemaining
                    };
                  }
                  return u;
                }));
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                setFileUploads(prev => prev.map(u => 
                  u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u
                ));
                resolve();
              } else {
                console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed due to network error'));
            });
            
            xhr.open('POST', urlData.signedUrl);
            xhr.send(formData);
          });
          
          // Get the public URL for the uploaded file
          const { data: fileUrl } = supabase.storage
            .from('job-files')
            .getPublicUrl(fileName);

          uploadedFiles.push({
            entity_id: jobId,
            entity_type: 'job',
            file_name: upload.file.name,
            file_url: fileUrl.publicUrl,
            file_size: upload.file.size,
            file_type: upload.file.type,
            uploaded_by: userId
          });
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        setFileUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'error', progress: 0 } : u
        ));
        toast.error(`Failed to upload ${upload.file.name}`);
      }
    }

    return uploadedFiles;
  };

  const clearFiles = () => {
    setFileUploads([]);
  };

  const getUploadProgress = (): number => {
    if (fileUploads.length === 0) return 0;
    
    const totalProgress = fileUploads.reduce((sum, upload) => sum + upload.progress, 0);
    return Math.round(totalProgress / fileUploads.length);
  };

  const hasFailedUploads = (): boolean => {
    return fileUploads.some(upload => upload.status === 'error');
  };

  const hasCompletedUploads = (): boolean => {
    return fileUploads.some(upload => upload.status === 'completed');
  };

  const isUploading = (): boolean => {
    return fileUploads.some(upload => upload.status === 'uploading');
  };

  return {
    fileUploads,
    handleFileSelect,
    removeFile,
    uploadFiles,
    clearFiles,
    getUploadProgress,
    hasFailedUploads,
    hasCompletedUploads,
    isUploading,
    setFileUploads
  };
};