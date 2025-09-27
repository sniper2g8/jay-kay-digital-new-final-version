import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import PWAClient from "@/components/PWAClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improve font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improve font loading
  preload: true,
});

export const metadata: Metadata = {
  title: "Jay Kay Digital Press - Professional Printing Services",
  description:
    "Complete printing press management system with job tracking, invoicing, and customer management.",
  icons: {
    icon: "/JK_Logo.jpg",
    shortcut: "/JK_Logo.jpg",
    apple: "/JK_Logo.jpg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="motion-safe:scroll-smooth">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Jay Kay Digital Press"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <div id="main-content" className="animate-in fade-in duration-500">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
        <PWAClient />
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
