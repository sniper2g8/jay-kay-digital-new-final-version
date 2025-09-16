import React, { useState, useEffect } from 'react';
import { FileText, ImageIcon, File, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = fileType?.startsWith('image/');
  const isPDF = fileType === 'application/pdf';
  const isSupported = isImage || isPDF;

  useEffect(() => {
    if (!isSupported || !fileUrl) return;

    const generateThumbnail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isImage) {
          // For images, use the original image but with loading optimization
          setThumbnailUrl(fileUrl);
        } else if (isPDF) {
          // For PDFs, we'll try to generate a thumbnail using PDF.js
          await generatePDFThumbnail(fileUrl);
        }
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        setError('Failed to generate thumbnail');
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();
  }, [fileUrl, fileType, isImage, isPDF, isSupported]);

  const generatePDFThumbnail = async (pdfUrl: string) => {
    try {
      // Import PDF.js dynamically to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Load the PDF
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(1); // Get first page

      // Set up canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Calculate scale for thumbnail (max 200px width)
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(200 / viewport.width, 200 / viewport.height);
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Convert canvas to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setThumbnailUrl(url);
        }
      }, 'image/jpeg', 0.8);

    } catch (err) {
      console.error('PDF thumbnail generation failed:', err);
      setError('PDF preview unavailable');
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (isPDF) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return (
    <div className={`relative group ${className}`}>
      {/* Thumbnail Container */}
      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        ) : error ? (
          <div className="flex flex-col items-center text-gray-400">
            <AlertCircle className="h-4 w-4 mb-1" />
            <span className="text-xs">Error</span>
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Thumbnail of ${fileName}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => {
              setError('Failed to load thumbnail');
              setThumbnailUrl(null);
            }}
          />
        ) : (
          getFileIcon()
        )}
        
        {/* File Type Badge */}
        {fileType && (
          <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
            {fileType.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}
          </div>
        )}
      </div>

      {/* File Info */}
      {showFileName && (
        <div className="mt-2">
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

      {/* Hover Preview (larger thumbnail) */}
      {thumbnailUrl && !isLoading && !error && (
        <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-0 left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <img
            src={thumbnailUrl}
            alt={`Preview of ${fileName}`}
            className="w-48 h-48 object-contain"
            loading="lazy"
          />
          <p className="text-xs text-center text-gray-600 mt-1 truncate">
            {fileName}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileThumbnail;