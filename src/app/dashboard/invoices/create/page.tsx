"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Save,
  Send,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useUninvoicedJobsByCustomer } from "@/lib/hooks/useJobs";
import {
  useInvoiceActions,
  type InvoiceFormData,
  type InvoiceLineItem,
} from "@/lib/hooks/useInvoiceManagement";
import { formatCurrency, formatDate } from "@/lib/constants";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";

interface InvoiceLineItemForm
  extends Omit<
    InvoiceLineItem,
    "id" | "invoice_id" | "created_at" | "updated_at"
  > {
  tempId: string;
}

function CreateInvoiceContent() {
  const router = useRouter();
  const { jobId } = useParams<{ jobId?: string }>(); // Get jobId from params using hook
  const { data: customers, isLoading: customersLoading } = useCustomers();
  // const { data: templates, isLoading: templatesLoading } = useInvoiceTemplates(); // Commented out - table doesn't exist
  const { createInvoice, createInvoiceFromJob } = useInvoiceActions();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    terms_days: 30,
    notes: "",
    template_id: "",
    line_items: [],
  });

  // Get uninvoiced jobs for selected customer
  const { data: uninvoicedJobs, isLoading: jobsLoading } =
    useUninvoicedJobsByCustomer(formData.customer_id || null);

  const [lineItems, setLineItems] = useState<InvoiceLineItemForm[]>([
    {
      tempId: "1",
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      line_order: 1,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Template functionality commented out - table doesn't exist in database
  // useEffect(() => {
  //   if (templates && templates.length > 0 && !formData.template_id) {
  //     const defaultTemplate = templates.find(t => t.is_default) || templates[0];
  //     setFormData(prev => ({ ...prev, template_id: defaultTemplate.id }));
  //   }
  // }, [formData.template_id]);

  // Calculate due date when invoice date or terms change
  useEffect(() => {
    if (formData.invoice_date && formData.terms_days) {
      const dueDate = new Date(formData.invoice_date);
      dueDate.setDate(dueDate.getDate() + formData.terms_days);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.invoice_date, formData.terms_days]);

  const handleInputChange = (
    field: keyof InvoiceFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLineItemChange = (
    tempId: string,
    field: keyof InvoiceLineItemForm,
    value: string | number,
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.tempId === tempId) {
          const updated = { ...item, [field]: value };

          // Auto-calculate total price
          if (field === "quantity" || field === "unit_price") {
            updated.total_price = updated.quantity * updated.unit_price;
          }

          // Auto-calculate tax amount
          if (field === "tax_rate" || field === "total_price") {
            updated.tax_amount =
              (updated.total_price * (updated.tax_rate || 0)) / 100;
          }

          return updated;
        }
        return item;
      }),
    );
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItemForm = {
      tempId: Date.now().toString(),
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      line_order: lineItems.length + 1,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const removeLineItem = (tempId: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }
  };

  // Job selection handlers
  const handleJobSelection = (jobId: string, selected: boolean) => {
    setSelectedJobIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAllJobs = () => {
    if (uninvoicedJobs) {
      setSelectedJobIds(new Set(uninvoicedJobs.map((job) => job.id)));
    }
  };

  const handleClearJobSelection = () => {
    setSelectedJobIds(new Set());
  };

  const addJobsToLineItems = () => {
    if (!uninvoicedJobs || selectedJobIds.size === 0) return;

    const selectedJobs = uninvoicedJobs.filter((job) =>
      selectedJobIds.has(job.id),
    );
    const newLineItems: InvoiceLineItemForm[] = selectedJobs.map(
      (job, index) => {
        // Use new consolidated cost structure
        // Priority: final_price -> unit_price * quantity -> estimate_price -> fallback to 0
        let unitPrice = 0;
        let totalPrice = 0;

        if (job.final_price && job.final_price > 0) {
          // If final_price exists, use it as total and calculate unit price
          totalPrice = job.final_price;
          unitPrice =
            job.quantity && job.quantity > 0
              ? job.final_price / job.quantity
              : job.final_price;
        } else if (job.unit_price && job.unit_price > 0) {
          // Use unit_price and calculate total
          unitPrice = job.unit_price;
          totalPrice = job.unit_price * (job.quantity || 1);
        } else if (job.estimate_price && job.estimate_price > 0) {
          // Fallback to estimate_price
          unitPrice = job.estimate_price;
          totalPrice = job.estimate_price * (job.quantity || 1);
        }

        return {
          tempId: `job-${job.id}`,
          description: job.description || `Job: ${job.jobNo || job.id}`,
          quantity: job.quantity || 1,
          unit_price: unitPrice,
          total_price: totalPrice,
          line_order: lineItems.length + index + 1,
          discount_amount: 0,
          tax_rate: 0,
          tax_amount: 0,
        };
      },
    );

    setLineItems((prev) => [...prev, ...newLineItems]);
    setSelectedJobIds(new Set()); // Clear selection after adding
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );
    const taxTotal = lineItems.reduce(
      (sum, item) => sum + (item.tax_amount || 0),
      0,
    );
    const discountTotal = lineItems.reduce(
      (sum, item) => sum + (item.discount_amount || 0),
      0,
    );
    const total = subtotal + taxTotal - discountTotal;

    return {
      subtotal,
      taxTotal,
      discountTotal,
      total,
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Customer is required";
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = "Invoice date is required";
    }

    if (lineItems.every((item) => !item.description.trim())) {
      newErrors.line_items =
        "At least one line item with description is required";
    }

    // Validate line items
    lineItems.forEach((item, index) => {
      if (item.description.trim() && item.unit_price <= 0) {
        newErrors[`line_item_${index}_price`] =
          "Unit price must be greater than 0";
      }
      if (item.description.trim() && item.quantity <= 0) {
        newErrors[`line_item_${index}_quantity`] =
          "Quantity must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (action: "save" | "send") => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty line items and remove temp fields
      const validLineItems = lineItems
        .filter((item) => item.description.trim())
        .map(({ tempId, ...item }) => {
          // Remove tempId from item
          void tempId; // Acknowledge we're not using tempId
          return item;
        });

      const invoiceData: InvoiceFormData = {
        ...formData,
        line_items: validLineItems,
      };

      let invoice;
      if (jobId) { // Changed from params?.jobId to jobId
        invoice = await createInvoiceFromJob(jobId, invoiceData); // Changed from params.jobId to jobId
      } else {
        invoice = await createInvoice(invoiceData);
      }

      if (action === "send") {
        // TODO: Implement send functionality
      }

      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      const formatSupabaseError = (err: unknown) => {
        if (!err) return "Unknown error";
        if (typeof err === "string") return err;
        if (err instanceof Error) {
          const anyErr = err as any;
          return {
            name: err.name,
            message: err.message,
            code: anyErr?.code,
            details: anyErr?.details,
            hint: anyErr?.hint,
            status: anyErr?.status,
          };
        }
        if (typeof err === "object") return err;
        return String(err);
      };
      console.error("Error creating invoice:", formatSupabaseError(error), error);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();
  const selectedCustomer = customers?.find(
    (c) => c.id === formData.customer_id,
  );

  if (customersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/finances">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Finances
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {jobId ? "Create Invoice from Job" : "Create New Invoice"} {/* Changed from params?.jobId to jobId */}
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate a new invoice for services or products
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Basic invoice information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) =>
                      handleInputChange("customer_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.business_name}
                          {customer.contact_person &&
                            ` - ${customer.contact_person}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customer_id && (
                    <p className="text-sm text-red-600">{errors.customer_id}</p>
                  )}
                </div>

                {/* Uninvoiced Jobs Section */}
                {formData.customer_id &&
                  uninvoicedJobs &&
                  uninvoicedJobs.length > 0 && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Uninvoiced Jobs</h4>
                          <p className="text-sm text-muted-foreground">
                            Select jobs to add as line items
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllJobs}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearJobSelection}
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={addJobsToLineItems}
                            disabled={selectedJobIds.size === 0}
                          >
                            Add Selected ({selectedJobIds.size})
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {uninvoicedJobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center space-x-3 p-3 border rounded-md bg-background hover:bg-muted/50 cursor-pointer"
                            onClick={() =>
                              handleJobSelection(
                                job.id,
                                !selectedJobIds.has(job.id),
                              )
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(job.id)}
                              onChange={(e) =>
                                handleJobSelection(job.id, e.target.checked)
                              }
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {job.jobNo || `Job ${job.id}`}
                                </p>
                                <span className="text-sm font-medium text-right">
                                  {formatCurrency(
                                    job.final_price ||
                                      (job.unit_price
                                        ? job.unit_price * (job.quantity || 1)
                                        : 0) ||
                                      job.estimate_price ||
                                      0,
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {job.description || "No description"}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Status: {job.status}
                                </span>
                                {job.quantity && job.quantity > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    Qty: {job.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {formData.customer_id &&
                  uninvoicedJobs &&
                  uninvoicedJobs.length === 0 &&
                  !jobsLoading && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground text-center">
                        No uninvoiced jobs found for this customer
                      </p>
                    </div>
                  )}

                {formData.customer_id && jobsLoading && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Loading jobs...
                      </span>
                    </div>
                  </div>
                )}

                {/* Date and Terms */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) =>
                        handleInputChange("invoice_date", e.target.value)
                      }
                    />
                    {errors.invoice_date && (
                      <p className="text-sm text-red-600">
                        {errors.invoice_date}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms_days">Payment Terms (Days)</Label>
                    <Select
                      value={formData.terms_days.toString()}
                      onValueChange={(value) =>
                        handleInputChange("terms_days", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="45">45 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Template Selection - Commented out since table doesn't exist */}
                {/* <div className="space-y-2">
                  <Label htmlFor="template_id">Invoice Template</Label>
                  <Select 
                    value={formData.template_id} 
                    onValueChange={(value) => handleInputChange('template_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.template_name}
                          {template.is_default && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or instructions..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Line Items
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add products or services to this invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.tempId}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Item #{index + 1}
                        </span>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.tempId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Description *</Label>
                          <Input
                            placeholder="Item description..."
                            value={item.description}
                            onChange={(e) =>
                              handleLineItemChange(
                                item.tempId,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                          {errors[`line_item_${index}_description`] && (
                            <p className="text-sm text-red-600">
                              {errors[`line_item_${index}_description`]}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.tempId,
                                  "quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                            {errors[`line_item_${index}_quantity`] && (
                              <p className="text-sm text-red-600">
                                {errors[`line_item_${index}_quantity`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Unit Price *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.tempId,
                                  "unit_price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                            {errors[`line_item_${index}_price`] && (
                              <p className="text-sm text-red-600">
                                {errors[`line_item_${index}_price`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Tax Rate (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.tax_rate}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.tempId,
                                  "tax_rate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>

                          <div>
                            <Label>Total</Label>
                            <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                              {formatCurrency(
                                item.total_price + (item.tax_amount || 0),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {errors.line_items && (
                    <p className="text-sm text-red-600">{errors.line_items}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleSubmit("save")}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSubmit("send")}
                disabled={isLoading}
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                Save & Send
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals Preview */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Calculator className="h-5 w-5 mr-2 inline" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">
                    {formatCurrency(totals.taxTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">
                    -{formatCurrency(totals.discountTotal)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>

                {selectedCustomer && formData.due_date && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Customer
                      </Label>
                      <p className="font-medium">
                        {selectedCustomer.business_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </Label>
                      <p className="font-medium">
                        {formatDate(formData.due_date)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  <strong>Save Draft:</strong> Create the invoice but don&apos;t
                  send it yet. You can edit it later.
                </p>
                <p>
                  <strong>Save & Send:</strong> Create and immediately send the
                  invoice to the customer.
                </p>
                <p>
                  Tax rates are applied per line item. Use 0% for tax-exempt
                  items.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CreateInvoicePage() {
  return (
    <ProtectedDashboard
      allowedRoles={["staff", "manager", "admin", "super_admin"]}
    >
      <CreateInvoiceContent />
    </ProtectedDashboard>
  );
}
