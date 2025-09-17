import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FileUpload } from '@/lib/hooks/useFileUploadFixed';

// Helper functions for formatting
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

interface FilesStepProps {
  fileUploads: FileUpload[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
  getUploadProgress: () => number;
  hasFailedUploads: () => boolean;
  hasCompletedUploads: () => boolean;
  isUploading: () => boolean;
}

export default function FilesStep({
  fileUploads,
  handleFileSelect,
  removeFile,
  getUploadProgress,
  hasFailedUploads,
  hasCompletedUploads,
  isUploading
}: FilesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">File Attachments</h2>
        <p className="text-gray-600">Upload design files, documents, or reference materials (optional)</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* File Upload Area */}
        <div>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.tiff,.eps,.ai,.psd"
            suppressHydrationWarning={true}
          />
          <Label htmlFor="file-upload">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">Click to upload files or drag and drop</p>
              <p className="text-sm text-gray-500">PDF, DOC, JPG, PNG, AI, PSD files supported</p>
              <p className="text-xs text-gray-400 mt-2">Maximum file size: 50MB per file</p>
            </div>
          </Label>
        </div>

        {/* Upload Progress */}
        {isUploading() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-800">Uploading files...</span>
              <span className="text-xs text-blue-600 ml-auto">
                {fileUploads.filter(f => f.status === 'completed').length} of {fileUploads.length} files completed
              </span>
            </div>
            <div className="space-y-2">
              <Progress value={getUploadProgress()} className="h-3" />
              <div className="flex justify-between text-xs text-blue-600">
                <span>{getUploadProgress()}% complete</span>
                <div className="flex gap-4">
                  {(() => {
                    const uploadingFiles = fileUploads.filter(f => f.status === 'uploading');
                    const totalSpeed = uploadingFiles.reduce((sum, f) => sum + (f.uploadSpeed || 0), 0);
                    const avgTimeRemaining = uploadingFiles.length > 0 
                      ? uploadingFiles.reduce((sum, f) => sum + (f.estimatedTimeRemaining || 0), 0) / uploadingFiles.length
                      : 0;
                    
                    return (
                      <>
                        {totalSpeed > 0 && <span>{formatBytes(totalSpeed)}/s</span>}
                        {avgTimeRemaining > 0 && <span>{formatTime(avgTimeRemaining)} remaining</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
              {(() => {
                const currentFile = fileUploads.find(f => f.status === 'uploading');
                return currentFile && (
                  <div className="text-xs text-blue-500 mt-1">
                    Currently uploading: {currentFile.file.name}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* File List */}
        {fileUploads.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Uploaded Files</h3>
            {fileUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <div className="flex-shrink-0">
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {(upload.status === 'pending' || upload.status === 'uploading') && (
                    <FileText className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(upload.id)}
                      className="flex-shrink-0 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <Badge 
                      variant="outline" 
                      className={
                        upload.status === 'completed' ? 'text-green-600 border-green-600' :
                        upload.status === 'error' ? 'text-red-600 border-red-600' :
                        upload.status === 'uploading' ? 'text-blue-600 border-blue-600' :
                        'text-gray-600 border-gray-600'
                      }
                    >
                      {upload.status === 'completed' && 'Uploaded'}
                      {upload.status === 'error' && 'Failed'}
                      {upload.status === 'uploading' && `Uploading... ${upload.progress}%`}
                      {upload.status === 'pending' && 'Ready'}
                    </Badge>
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={upload.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{upload.progress}% uploaded</span>
                        <div className="flex gap-3">
                          {upload.uploadSpeed && upload.uploadSpeed > 0 && (
                            <span>{formatBytes(upload.uploadSpeed)}/s</span>
                          )}
                          {upload.estimatedTimeRemaining && upload.estimatedTimeRemaining > 0 && upload.progress < 100 && (
                            <span>{formatTime(upload.estimatedTimeRemaining)} remaining</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {upload.progress > 0 && upload.progress < 100 && (
                          `${formatBytes((upload.file.size * upload.progress) / 100)} of ${formatBytes(upload.file.size)}`
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Status Messages */}
        {hasFailedUploads() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-800">Some files failed to upload</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Please check the file format and size, then try uploading again.
            </p>
          </div>
        )}

        {hasCompletedUploads() && !isUploading() && !hasFailedUploads() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-800">All files uploaded successfully</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Your files are ready to be attached to the job.
            </p>
          </div>
        )}

        {/* File Format Help */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Supported File Formats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <p><strong>Documents:</strong> PDF, DOC, DOCX</p>
              <p><strong>Images:</strong> JPG, PNG, GIF, TIFF</p>
            </div>
            <div>
              <p><strong>Design Files:</strong> AI, EPS, PSD</p>
              <p><strong>Max Size:</strong> 50MB per file</p>
            </div>
          </div>
        </div>

        {/* No Files Message */}
        {fileUploads.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No files selected</p>
            <p className="text-sm text-gray-400">
              File attachments are optional. You can proceed without uploading any files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}