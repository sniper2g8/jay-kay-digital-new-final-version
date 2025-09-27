"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/constants";
import {
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import { ProfessionalInvoicePDF } from "@/components/ProfessionalInvoicePDF";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_no?: string;
  notes?: string;
}

interface Customer {
  id: string;
  business_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface InvoiceData {
  id: string;
  invoiceNo?: string;
  created_at: string;
  invoice_date?: string;
  invoice_status?: string;
  payment_status?: string;
  terms_days?: number;
  notes?: string;
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  discount?: number;
  total?: number;
  amountPaid?: number;
  currency?: string;
  customer_id?: string;
}

export function InvoiceManagement() {
  // State for invoice data
  const [invoice, setInvoice] = useState<InvoiceData>({
    id: "",
    invoiceNo: "",
    created_at: new Date().toISOString(),
    invoice_date: new Date().toISOString(),
    invoice_status: "draft",
    payment_status: "pending",
    terms_days: 30,
    notes: "",
    subtotal: 0,
    tax: 0,
    tax_rate: 0,
    discount: 0,
    total: 0,
    amountPaid: 0,
    currency: "SLL",
  });

  // State for items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);

  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // State for UI
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Calculate totals whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => {
      const totalPrice =
        typeof item.total_price === "string"
          ? parseFloat(item.total_price) || 0
          : item.total_price || 0;
      return sum + totalPrice;
    }, 0);

    const taxRate =
      typeof invoice.tax_rate === "string"
        ? parseFloat(invoice.tax_rate) || 0
        : invoice.tax_rate || 0;
    const newTax = (newSubtotal * taxRate) / 100;
    const discount =
      typeof invoice.discount === "string"
        ? parseFloat(invoice.discount) || 0
        : invoice.discount || 0;
    const newTotal = newSubtotal + newTax - discount;

    setInvoice((prev) => ({
      ...prev,
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
    }));
  }, [items, invoice.tax_rate, invoice.discount]);

  // Handle item changes
  const handleItemChange = (
    id: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total when quantity or unit_price changes
          if (field === "quantity" || field === "unit_price") {
            const quantity =
              field === "quantity" ? Number(value) : item.quantity;
            const unitPrice =
              field === "unit_price" ? Number(value) : item.unit_price;
            updatedItem.total_price = quantity * unitPrice;
          }

          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Add new item
  const addItem = () => {
    setItems((prevItems) => [
      ...prevItems,
      {
        id: prevItems.length + 1,
        description: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  // Remove item
  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    }
  };

  // Handle invoice field changes
  const handleInvoiceChange = (
    field: keyof InvoiceData,
    value: string | number,
  ) => {
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId) || null;
    setSelectedCustomer(customer);
    setInvoice((prev) => ({
      ...prev,
      customer_id: customerId,
    }));
  };

  // Save invoice
  const saveInvoice = () => {
    // In a real app, this would make an API call to save the invoice
    alert("Invoice saved successfully!");
  };

  // Send invoice
  const sendInvoice = () => {
    // In a real app, this would send the invoice to the customer
    alert("Invoice sent successfully!");
  };

  // Preview invoice
  const previewInvoice = () => {
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Create New Invoice
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={previewInvoice}
                className="flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={saveInvoice}
                className="flex items-center"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={sendInvoice}
                className="flex items-center bg-red-600 hover:bg-red-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice Number</Label>
              <Input
                id="invoiceNo"
                value={invoice.invoiceNo || ""}
                onChange={(e) =>
                  handleInvoiceChange("invoiceNo", e.target.value)
                }
                placeholder="INV-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <div className="relative">
                <Input
                  id="invoiceDate"
                  type="date"
                  value={
                    invoice.invoice_date
                      ? new Date(invoice.invoice_date)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleInvoiceChange("invoice_date", e.target.value)
                  }
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsDays">Payment Terms</Label>
              <Select
                value={invoice.terms_days?.toString() || "30"}
                onValueChange={(value) =>
                  handleInvoiceChange("terms_days", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <div className="flex space-x-2">
              <Select
                value={invoice.customer_id || ""}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Customer Details Preview */}
          {selectedCustomer && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">
                      {selectedCustomer.business_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.contact_person &&
                        `${selectedCustomer.contact_person} • `}
                      {selectedCustomer.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.address}
                      {selectedCustomer.city && `, ${selectedCustomer.city}`}
                      {selectedCustomer.country &&
                        `, ${selectedCustomer.country}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              <Button
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Textarea
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Item description"
                        className="min-h-[40px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "unit_price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Invoice Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notes</h3>
              <Textarea
                value={invoice.notes || ""}
                onChange={(e) => handleInvoiceChange("notes", e.target.value)}
                placeholder="Additional notes or terms"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Summary</h3>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_rate || 0}%):</span>
                    <span>{formatCurrency(invoice.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-lg">
                      {formatCurrency(invoice.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Amount Paid:</span>
                    <span className="text-green-600">
                      {formatCurrency(invoice.amountPaid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Amount Due:</span>
                    <span
                      className={
                        (invoice.total || 0) - (invoice.amountPaid || 0) > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(
                        (invoice.total || 0) - (invoice.amountPaid || 0),
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={invoice.tax_rate || 0}
                    onChange={(e) =>
                      handleInvoiceChange(
                        "tax_rate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoice.discount || 0}
                    onChange={(e) =>
                      handleInvoiceChange(
                        "discount",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>
                ×
              </Button>
            </div>
            <div className="p-4">
              <ProfessionalInvoicePDF
                invoice={invoice}
                customer={selectedCustomer || undefined}
                items={items}
                showActions={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
