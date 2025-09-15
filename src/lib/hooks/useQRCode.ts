import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface QRCodeData {
  jobId: string;
  qrCode: string;
  trackingUrl: string;
}

export const useQRCodeGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateJobQRCode = async (jobId: string, jobNo?: string): Promise<QRCodeData | null> => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '';
      const trackingUrl = `${baseUrl}/track/${jobNo || jobId}`;
      
      // Update the job record with the tracking URL and QR code data
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          tracking_url: trackingUrl,
          qr_code: trackingUrl // Store the URL that the QR code represents
        })
        .eq('id', jobId);

      if (updateError) {
        throw new Error(`Failed to update job with QR code: ${updateError.message}`);
      }

      return {
        jobId,
        qrCode: trackingUrl,
        trackingUrl
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      console.error('Error generating QR code:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getJobQRCode = async (jobId: string): Promise<QRCodeData | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('id, jobNo, qr_code, tracking_url')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch job QR code: ${fetchError.message}`);
      }

      if (!data.qr_code || !data.tracking_url) {
        // Generate QR code if it doesn't exist
        return await generateJobQRCode(jobId, data.jobNo || undefined);
      }

      return {
        jobId,
        qrCode: data.qr_code,
        trackingUrl: data.tracking_url
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get QR code';
      setError(errorMessage);
      console.error('Error getting QR code:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const regenerateJobQRCode = async (jobId: string, jobNo?: string): Promise<QRCodeData | null> => {
    // Force regeneration by calling generateJobQRCode directly
    return await generateJobQRCode(jobId, jobNo);
  };

  return {
    generateJobQRCode,
    getJobQRCode,
    regenerateJobQRCode,
    loading,
    error
  };
};

// Utility function to create tracking URL
export const createTrackingUrl = (jobNo: string, baseUrl?: string): string => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/track/${jobNo}`;
};

// Utility function to extract job number from tracking URL
export const extractJobNoFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([^\/\?]+)/);
  return match ? match[1] : null;
};