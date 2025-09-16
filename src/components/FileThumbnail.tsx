import React, { useState } from 'react';
import { FileText, ImageIcon, File } from 'lucide-react';

interface FileThumbnailProps {
  fileUrl: string;
  fileName: string;
  fileType: string | null;
  fileSize?: number;
  className?: string;
  showFileName?: boolean;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  className = '',
  showFileName = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const isImage = fileType?.startsWith('image/');
  const isPDF = fileType === 'application/pdf';
  const isDocument = fileType?.includes('word') || fileType?.includes('document');
  const isSpreadsheet = fileType?.includes('sheet') || fileType?.includes('excel');
  const isText = fileType?.startsWith('text/');

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isPDF) return <FileText className="h-8 w-8 text-red-500" />;
    if (isDocument) return <FileText className="h-8 w-8 text-blue-600" />;
    if (isSpreadsheet) return <FileText className="h-8 w-8 text-green-600" />;
    if (isText) return <FileText className="h-8 w-8 text-gray-600" />;
    if (isImage) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getFileTypeColor = () => {
    if (isPDF) return 'bg-red-500';
    if (isDocument) return 'bg-blue-600';
    if (isSpreadsheet) return 'bg-green-600';
    if (isText) return 'bg-gray-600';
    if (isImage) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getFileExtension = () => {
    if (!fileType) return fileName.split('.').pop()?.toUpperCase().slice(0, 3) || 'FILE';
    
    const ext = fileType.split('/')[1];
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'jpeg': case 'jpg': return 'JPG';
      case 'png': return 'PNG';
      case 'gif': return 'GIF';
      case 'webp': return 'WEBP';
      case 'msword': return 'DOC';
      case 'vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX';
      case 'vnd.ms-excel': return 'XLS';
      case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'XLSX';
      case 'plain': return 'TXT';
      case 'csv': return 'CSV';
      default: return ext?.toUpperCase().slice(0, 3) || 'FILE';
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Thumbnail Container */}
      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        {isImage && !imageError ? (
          <div className="relative w-full h-full">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <img
              src={fileUrl}
              alt={`Thumbnail of ${fileName}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            {getFileIcon()}
          </div>
        )}
        
        {/* File Type Badge */}
        <div className={`absolute top-1 right-1 ${getFileTypeColor()} text-white text-xs px-1 py-0.5 rounded text-center min-w-[24px]`}>
          {getFileExtension()}
        </div>
      </div>

      {/* File Info */}
      {showFileName && (
        <div className="mt-2 w-16">
          <p className="text-xs font-medium text-gray-900 truncate" title={fileName}>
            {fileName}
          </p>
          {fileSize && (
            <p className="text-xs text-gray-500">
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>
      )}

      {/* Hover Preview (larger preview for images) */}
      {isImage && !imageError && (
        <div className="absolute z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 top-0 left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 max-w-sm">
          <div className="relative">
            <img
              src={fileUrl}
              alt={`Preview of ${fileName}`}
              className="max-w-64 max-h-64 object-contain rounded"
              loading="lazy"
            />
          </div>
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
              {fileName}
            </p>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{getFileExtension()}</span>
              {fileSize && <span>{formatFileSize(fileSize)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* PDF and other file types hover info */}
      {!isImage && (
        <div className="absolute z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 top-0 left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-48">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getFileTypeColor()}`}>
              {getFileIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                {fileName}
              </p>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{getFileExtension()} File</span>
                {fileSize && <span>{formatFileSize(fileSize)}</span>}
              </div>
              {isPDF && (
                <p className="text-xs text-gray-400 mt-1">PDF Document</p>
              )}
              {isDocument && (
                <p className="text-xs text-gray-400 mt-1">Word Document</p>
              )}
              {isSpreadsheet && (
                <p className="text-xs text-gray-400 mt-1">Spreadsheet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileThumbnail;