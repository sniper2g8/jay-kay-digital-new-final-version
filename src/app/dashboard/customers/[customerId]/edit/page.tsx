"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { mutate } from "swr";

interface Customer {
  id: string;
  business_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  customer_status: string | null;
  credit_limit: number | null;
  notes: string | null;
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    customer_status: "active",
    credit_limit: 0,
    notes: "",
  });

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCustomer(data);
          setFormData({
            business_name: data.business_name || "",
            contact_person: data.contact_person || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            zip_code: data.zip_code || "",
            customer_status: data.customer_status || "active",
            credit_limit: data.credit_limit || 0,
            notes: data.notes || "",
          });
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Failed to load customer data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          business_name: formData.business_name,
          contact_person: formData.contact_person,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          customer_status: formData.customer_status,
          credit_limit: formData.credit_limit || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);

      if (error) {
        throw error;
      }

      // Invalidate caches for real-time updates
      mutate("customers");
      mutate("jobs-with-customers");

      toast.success("Customer updated successfully!");
      router.push("/dashboard/customers");
    } catch (error) {
      console.error("Customer update error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        name: error instanceof Error ? error.name : "Unknown error type",
        code:
          error && typeof error === "object" && "code" in error
            ? (error as { code: unknown }).code
            : undefined,
        details:
          error && typeof error === "object" && "details" in error
            ? (error as { details: unknown }).details
            : undefined,
        hint:
          error && typeof error === "object" && "hint" in error
            ? (error as { hint: unknown }).hint
            : undefined,
        customerId: customerId,
        formData: "Form data submitted",
      });

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to update customer. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("permission denied")) {
          errorMessage = "Permission denied. Please check your access rights.";
        } else if (error.message.includes("unique constraint")) {
          errorMessage = "A customer with this email already exists.";
        } else if (error.message.includes("foreign key")) {
          errorMessage =
            "Invalid data reference. Please check your selections.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Customer not found. They may have been deleted.";
        } else if (error.message.includes("invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = `Update failed: ${error.message}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading customer details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="px-6 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-red-800">
                  Customer Not Found
                </h3>
              </div>
              <p className="text-sm text-red-600 mt-1">
                The requested customer could not be found.
              </p>
              <Button
                onClick={() => router.push("/dashboard/customers")}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/customers")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Edit Customer
                    </h1>
                    <p className="text-gray-600">{customer.business_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) =>
                          handleInputChange("business_name", e.target.value)
                        }
                        placeholder="Enter business name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person *</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) =>
                          handleInputChange("contact_person", e.target.value)
                        }
                        placeholder="Enter contact person name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) =>
                          handleInputChange("zip_code", e.target.value)
                        }
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_status">Status</Label>
                      <Select
                        value={formData.customer_status}
                        onValueChange={(value) =>
                          handleInputChange("customer_status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="credit_limit">Credit Limit</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) =>
                          handleInputChange(
                            "credit_limit",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/customers")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.business_name ||
                    !formData.contact_person
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Customer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
