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
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Eye
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedDashboard from "@/components/ProtectedDashboard";
import { transformFirebaseTimestamp, formatCurrency } from "@/lib/invoice-utils";

interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  notes?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

function InvoiceEditContent() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    issueDate: "",
    dueDate: "",
    status: "draft",
    notes: "",
    items: [] as InvoiceLineItem[],
    tax: 0
  });

  // Load invoice data
  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      if (data) {
        // Parse Firebase timestamps
        const issueDateString = transformFirebaseTimestamp(data.issueDate as never);
        const dueDateString = transformFirebaseTimestamp(data.dueDate as never);
        
        const issueDate = issueDateString ? new Date(issueDateString) : new Date();
        const dueDate = dueDateString ? new Date(dueDateString) : new Date();

        // Parse invoice items
        let items: InvoiceLineItem[] = [];
        try {
          items = data.items ? JSON.parse(data.items as string) : [];
        } catch (e) {
          console.warn('Failed to parse invoice items:', e);
          items = [];
        }

        const invoiceData: InvoiceData = {
          id: data.id,
          invoiceNo: data.invoiceNo || 'INV-000',
          customerName: data.customerName || '',
          customerEmail: '', // Not available in current schema
          customerPhone: '', // Not available in current schema
          issueDate: issueDate,
          dueDate: dueDate,
          status: data.payment_status || 'draft',
          notes: data.notes || '',
          items: items,
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.total || 0
        };

        setInvoice(invoiceData);
        
        // Set form data
        setFormData({
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail || '',
          customerPhone: invoiceData.customerPhone || '',
          issueDate: invoiceData.issueDate.toISOString().split('T')[0],
          dueDate: invoiceData.dueDate.toISOString().split('T')[0],
          status: invoiceData.status,
          notes: invoiceData.notes || '',
          items: invoiceData.items,
          tax: invoiceData.tax
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { subtotal, taxAmount, total } = calculateTotals();

      const updateData = {
        customerName: formData.customerName,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        payment_status: formData.status as "pending" | "partial" | "paid" | "overdue" | "cancelled",
        notes: formData.notes || null,
        items: JSON.stringify(formData.items),
        subtotal: subtotal,
        tax: taxAmount,
        total: total,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;

      // Redirect back to invoice list
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading invoice...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle>Error Loading Invoice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex space-x-2">
                <Button onClick={fetchInvoice} variant="outline">
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/dashboard/invoices">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Invoices
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Edit Invoice {invoice?.invoiceNo}
              </h1>
              <p className="text-muted-foreground">
                Modify invoice details and line items
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Update customer details for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                {/* Customer email and phone not available in current schema
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="+232 XX XXX XXXX"
                    />
                  </div>
                </div>
                */}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Configure invoice dates and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Payment Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Add or modify invoice line items
                    </CardDescription>
                  </div>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5">
                          <Label htmlFor={`item-desc-${index}`}>Description</Label>
                          <Input
                            id={`item-desc-${index}`}
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`item-qty-${index}`}>Quantity</Label>
                          <Input
                            id={`item-qty-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`item-price-${index}`}>Unit Price</Label>
                          <Input
                            id={`item-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Total</Label>
                          <div className="text-lg font-semibold">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No items added yet. Click &quot;Add Item&quot; to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Invoice Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div className="pt-4">
                  <Badge variant="outline" className="w-full justify-center">
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !formData.customerName}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/invoices/${invoiceId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Invoice
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/invoices">
                    Cancel
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Invoice Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-medium">{invoice?.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{invoice?.issueDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{formData.items.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceEditPage() {
  return (
    <ProtectedDashboard allowedRoles={["super_admin", "admin", "manager"]}>
      <InvoiceEditContent />
    </ProtectedDashboard>
  );
}