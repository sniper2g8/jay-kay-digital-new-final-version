import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Improve font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Improve font loading
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="motion-safe:scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <div className="animate-in fade-in duration-500">{children}</div>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
