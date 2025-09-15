'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { useQRCodeGenerator, type QRCodeData } from '@/lib/hooks/useQRCode';
import { toast } from 'sonner';

interface JobQRCodeManagerProps {
  jobId: string;
  jobNo?: string;
  jobTitle?: string;
  className?: string;
}

export default function JobQRCodeManager({ 
  jobId, 
  jobNo, 
  jobTitle,
  className = '' 
}: JobQRCodeManagerProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [showQR, setShowQR] = useState(false);
  
  const { 
    getJobQRCode, 
    regenerateJobQRCode, 
    loading, 
    error 
  } = useQRCodeGenerator();

  useEffect(() => {
    const loadQRCode = async () => {
      const data = await getJobQRCode(jobId);
      if (data) {
        setQrData(data);
      }
    };

    loadQRCode();
  }, [jobId, getJobQRCode]);

  const handleGenerateQR = async () => {
    const data = await regenerateJobQRCode(jobId, jobNo);
    if (data) {
      setQrData(data);
      setShowQR(true);
      toast.success('QR code generated successfully!');
    } else if (error) {
      toast.error(error);
    }
  };

  const handleCopyUrl = async () => {
    if (qrData?.trackingUrl) {
      try {
        await navigator.clipboard.writeText(qrData.trackingUrl);
        toast.success('Tracking URL copied to clipboard!');
      } catch {
        toast.error('Failed to copy URL');
      }
    }
  };

  const handleOpenTracking = () => {
    if (qrData?.trackingUrl) {
      window.open(qrData.trackingUrl, '_blank');
    }
  };

  const handleDownloadQR = () => {
    // This would trigger the download of the QR code image
    // Implementation would depend on the QRCodeGenerator component
    toast.info('QR code download feature coming soon!');
  };

  const handleShareQR = async () => {
    if (qrData?.trackingUrl && navigator.share) {
      try {
        await navigator.share({
          title: `Track Job ${jobNo || jobId}`,
          text: `Track your printing job: ${jobTitle || 'Print Job'}`,
          url: qrData.trackingUrl,
        });
      } catch {
        // Fallback to copying URL
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Job Tracking
            </CardTitle>
            <CardDescription>
              QR code and tracking URL for customer access
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {qrData && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                QR Code Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* QR Code Display */}
          {showQR && qrData && (
            <div className="flex justify-center">
              <QRCodeGenerator 
                data={qrData.qrCode} 
                size={200}
                className="border rounded-lg p-4 bg-white"
              />
            </div>
          )}

          {/* Tracking URL */}
          {qrData && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tracking URL:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={qrData.trackingUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenTracking}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!qrData ? (
              <Button 
                onClick={handleGenerateQR}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Generate QR Code
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  {showQR ? 'Hide QR' : 'Show QR'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleDownloadQR}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleShareQR}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Share the QR code or tracking URL with customers</p>
            <p>• Customers can scan or visit to track job progress</p>
            <p>• No login required for customer tracking</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}