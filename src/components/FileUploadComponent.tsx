import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFileUploadFixed, FileUpload } from "@/lib/hooks/useFileUploadFixed";
import { cn } from "@/lib/utils";

interface FileUploadComponentProps {
  onFilesSelected?: (uploads: FileUpload[]) => void;
  disabled?: boolean;
  className?: string;
  showUploadButton?: boolean;
  jobId?: string;
  onUploadComplete?: (files: File[]) => void;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFilesSelected,
  disabled = false,
  className,
  showUploadButton = false,
  jobId,
  onUploadComplete,
}) => {
  const {
    fileUploads,
    handleFileSelect,
    addFiles,
    removeFile,
    clearFiles,
    getUploadProgress,
    hasFailedUploads,
    hasCompletedUploads,
    hasPendingUploads,
    isUploading,
    uploadFiles,
  } = useFileUploadFixed();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (onFilesSelected) {
      onFilesSelected(fileUploads);
    }
  }, [fileUploads, onFilesSelected]);

  // Handle upload when showUploadButton is true
  const handleUpload = async () => {
    if (!jobId || fileUploads.length === 0) return;

    try {
      await uploadFiles(jobId);

      if (onUploadComplete) {
        const files = fileUploads.map((upload) => upload.file);
        onUploadComplete(files);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Handle drag and drop events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  // Handle click to open file dialog
  const handleChooseFiles = () => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
        return (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FileUpload["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "uploading":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Upload Area */}
      <Card
        className={cn(
          "border-dashed border-2 transition-colors cursor-pointer",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleChooseFiles}
      >
        <CardContent className="p-6">
          <div className="text-center">
            <Upload
              className={cn(
                "mx-auto h-12 w-12 transition-colors",
                isDragging ? "text-blue-500" : "text-gray-400",
              )}
            />
            <div className="mt-4">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {isDragging
                  ? "Drop files here"
                  : "Drop files here or click to upload"}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                PDF, Images, Word docs up to 10MB each
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={disabled || isUploading}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from firing
                  handleChooseFiles();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Choose Files"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {fileUploads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Selected Files ({fileUploads.length})
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFiles}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>

            {/* Overall Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Upload Progress</span>
                  <span>{getUploadProgress()}%</span>
                </div>
                <Progress value={getUploadProgress()} className="h-2" />
              </div>
            )}

            <div className="space-y-2">
              {fileUploads.map((upload) => (
                <div
                  key={upload.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    getStatusColor(upload.status),
                  )}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(upload.file.size)}</span>
                        <span>•</span>
                        <span>{upload.file.type}</span>
                        {upload.status === "error" && upload.errorMessage && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">
                              {upload.errorMessage}
                            </span>
                          </>
                        )}
                      </div>
                      {upload.status === "uploading" && (
                        <div className="mt-1">
                          <Progress value={upload.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(upload.id)}
                    disabled={isUploading && upload.status === "uploading"}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Status Summary */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {hasCompletedUploads() && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  {fileUploads.filter((f) => f.status === "completed").length}{" "}
                  completed
                </span>
              )}
              {hasPendingUploads() && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  {fileUploads.filter((f) => f.status === "pending").length}{" "}
                  pending
                </span>
              )}
              {hasFailedUploads() && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                  {fileUploads.filter((f) => f.status === "error").length}{" "}
                  failed
                </span>
              )}
            </div>

            {/* Upload Button */}
            {showUploadButton && jobId && hasPendingUploads() && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !hasPendingUploads()}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files (
                      {fileUploads.filter((f) => f.status === "pending").length}
                      )
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploadComponent;
