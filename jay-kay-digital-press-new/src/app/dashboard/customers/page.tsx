'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Filter,
  MoreHorizontal,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/lib/supabase";
import { Customer } from "@/types/database";

export default function CustomersPage() {
  const { data: customers, error, isLoading, mutate } = useCustomersWithStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's a permission error and show helpful guidance
    const isPermissionError = error.message?.includes('permission denied') || 
                             error.message?.includes('42501') ||
                             error.message?.includes('access denied');
    
    if (isPermissionError) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/dashboard">
                <Button variant="outline">← Back to Dashboard</Button>
              </Link>
            </div>
            <DatabasePermissionError 
              error={error.message} 
              onRetry={() => mutate()} 
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Error Loading Customers</CardTitle>
            <CardDescription>There was an error connecting to the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Error: {error.message}
            </p>
            <Button onClick={() => mutate()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCustomers = customers?.filter(c => c.status === 'active') || [];
  const inactiveCustomers = customers?.filter(c => c.status === 'inactive') || [];
  const totalRevenue = customers?.reduce((sum, c) => sum + (c.stats?.total_spent || 0), 0) || 0;
  const totalJobs = customers?.reduce((sum, c) => sum + (c.stats?.total_jobs || 0), 0) || 0;
  const avgOrderValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage your customer relationships and track their activity</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, ID, or email..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {activeCustomers.length} active, {inactiveCustomers.length} inactive
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From all customers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Per completed job
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                All customer jobs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>Complete list of customers with human-readable IDs</CardDescription>
          </CardHeader>
          <CardContent>
            {customers && customers.length > 0 ? (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.customer_human_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{customer.business_name}</h3>
                          <Badge 
                            variant={customer.status === "active" ? "default" : "secondary"}
                            className={customer.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {customer.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {customer.contact_person || 'No contact person'} • {customer.customer_human_id}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {customer.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.city && customer.state && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {customer.city}, {customer.state}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {customer.stats?.total_jobs || 0} Jobs
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: ${(customer.stats?.total_spent || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">Last Payment</p>
                        <p className="text-xs text-gray-500">
                          {customer.stats?.last_payment 
                            ? new Date(customer.stats.last_payment).toLocaleDateString()
                            : 'No payments'
                          }
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first customer.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Human-Readable Query Examples */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Database Query Examples</CardTitle>
            <CardDescription>How to query customer data using human-readable IDs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Queries:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="text-blue-600">
                  {/* Get specific customer by human ID */}
                </div>
                <div>
                  supabase.from(&apos;customers&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get all jobs for a customer */}
                </div>
                <div>
                  supabase.from(&apos;jobs&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
                <div className="text-blue-600 mt-3">
                  {/* Get payments for a customer */}
                </div>
                <div>
                  supabase.from(&apos;payments&apos;).select(&apos;*&apos;).eq(&apos;customer_human_id&apos;, &apos;JKDP-CUS-001&apos;)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
