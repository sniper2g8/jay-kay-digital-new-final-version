"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({
  data,
  size = 200,
  className = "",
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError("");

        const qrCodeDataUrl = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        setQrCodeUrl(qrCodeDataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setError("Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    if (data) {
      generateQR();
    }
  }, [data, size]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-gray-500 text-center px-2">QR Code Error</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src={qrCodeUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="border rounded"
        unoptimized
      />
    </div>
  );
}
