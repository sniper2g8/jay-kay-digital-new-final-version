import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Trash2, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useJobFiles } from '@/lib/hooks/useJobFiles';
import { FileThumbnail } from '@/components/FileThumbnail';
import { toast } from 'sonner';

interface JobFilesViewerProps {
  jobId: string | null;
  canDelete?: boolean;
  className?: string;
}

export const JobFilesViewer: React.FC<JobFilesViewerProps> = ({
  jobId,
  canDelete = false,
  className
}) => {
  const { files, loading, error, deleteFile, downloadFile, refreshFiles, hasFiles } = useJobFiles(jobId);

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (fileId: string, fileName: string, fileUrl: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    const success = await deleteFile(fileId, fileUrl);
    if (success) {
      toast.success(`File "${fileName}" deleted successfully`);
    } else {
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    const success = await downloadFile(fileUrl, fileName);
    if (!success) {
      toast.error('Failed to download file');
    }
  };

  if (!jobId) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          No job selected
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Error loading files: {error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFiles}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Job Files {hasFiles && `(${files.length})`}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshFiles}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!hasFiles ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm">No files uploaded for this job</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* File Thumbnail */}
                  <FileThumbnail
                    fileUrl={file.file_url}
                    fileName={file.file_name}
                    fileType={file.file_type || null}
                    fileSize={file.file_size || undefined}
                    showFileName={false}
                    className="flex-shrink-0"
                  />
                  
                  {/* File Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(file.file_size)}</span>
                      {file.file_type && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        </>
                      )}
                      {file.created_at && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(file.created_at).toLocaleDateString('en-SL')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file.file_url, file.file_name)}
                    className="px-3"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.file_name, file.file_url)}
                      className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobFilesViewer;