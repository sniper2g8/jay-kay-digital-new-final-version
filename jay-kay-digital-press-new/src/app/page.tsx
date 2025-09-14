import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrinterIcon, Users, FileText, TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <PrinterIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Jay Kay Digital Press</h1>
              <p className="text-sm text-gray-600">Professional Printing Services</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Shield className="h-3 w-3 mr-1" />
              Enterprise Ready
            </Badge>
            <Button asChild>
              <Link href="/dashboard">
                Access Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            🚀 Now Live - Complete System Migration
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Complete Printing Press<br />
            <span className="text-blue-600">Management System</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your printing operations with our comprehensive solution featuring 
            job tracking, customer management, invoicing, and real-time analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                <Users className="mr-2 h-5 w-5" />
                Access Dashboard
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/track">
                <FileText className="mr-2 h-5 w-5" />
                Track Order
              </Link>
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-16">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800 flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                System Status: Fully Operational
              </CardTitle>
              <CardDescription className="text-green-700">
                Database migrated successfully with 33,900+ records and optimized performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-800">29</div>
                  <div className="text-sm text-green-600">Tables Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">33K+</div>
                  <div className="text-sm text-green-600">Records Migrated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">5</div>
                  <div className="text-sm text-green-600">User Roles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">100%</div>
                  <div className="text-sm text-green-600">Human-Readable</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>
                Complete job lifecycle tracking from quote to delivery with real-time status updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Job status tracking</li>
                <li>• Priority management</li>
                <li>• Resource allocation</li>
                <li>• Deadline monitoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Customer Portal</CardTitle>
              <CardDescription>
                Comprehensive customer management with human-readable IDs and service history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customer profiles (JKDP-CUS-###)</li>
                <li>• Service history</li>
                <li>• Payment tracking</li>
                <li>• Communication logs</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Financial Management</CardTitle>
              <CardDescription>
                Integrated invoicing and payment system with human-readable references.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Invoice generation (JKDP-INV-###)</li>
                <li>• Payment tracking (PAY-2025-###)</li>
                <li>• Financial reporting</li>
                <li>• Revenue analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Access */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle>Role-Based Dashboard Access</CardTitle>
            <CardDescription>
              Secure, personalized experiences for every user type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { role: "Super Admin", color: "bg-red-100 text-red-800", desc: "Full system control" },
                { role: "Admin", color: "bg-blue-100 text-blue-800", desc: "Operations management" },
                { role: "Manager", color: "bg-green-100 text-green-800", desc: "Team oversight" },
                { role: "Staff", color: "bg-yellow-100 text-yellow-800", desc: "Task execution" },
                { role: "Customer", color: "bg-purple-100 text-purple-800", desc: "Order tracking" },
              ].map((item) => (
                <div key={item.role} className="text-center">
                  <Badge className={`${item.color} mb-2`}>{item.role}</Badge>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">
                Ready to Streamline Your Operations?
              </h3>
              <p className="text-blue-700 mb-6">
                Access your personalized dashboard and start managing your printing business more efficiently.
              </p>
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-lg">
                <PrinterIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Jay Kay Digital Press</p>
                <p className="text-sm text-gray-600">Professional Printing Services</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                © 2025 Jay Kay Digital Press. All rights reserved.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Enterprise Management System v1.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
