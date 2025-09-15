import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User } from 'lucide-react';
import { JobFormData, NewCustomerData, Customer } from '@/lib/hooks/useJobSubmissionForm';

interface CustomerStepProps {
  formData: JobFormData;
  updateFormData: (field: keyof JobFormData, value: JobFormData[keyof JobFormData]) => void;
  customers: Customer[];
  newCustomerData: NewCustomerData;
  updateNewCustomerData: (field: keyof NewCustomerData, value: string) => void;
  createNewCustomer: () => Promise<void>;
  showNewCustomerDialog: boolean;
  setShowNewCustomerDialog: (show: boolean) => void;
  isCreatingCustomer: boolean;
}

export default function CustomerStep({
  formData,
  updateFormData,
  customers,
  newCustomerData,
  updateNewCustomerData,
  createNewCustomer,
  showNewCustomerDialog,
  setShowNewCustomerDialog,
  isCreatingCustomer
}: CustomerStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <User className="w-8 h-8 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
        </div>
        <p className="text-sm text-gray-600">Select an existing customer or add a new one</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
              Select Customer *
            </Label>
            <Select 
              value={formData.customer_id} 
              onValueChange={(value) => updateFormData('customer_id', value)}
            >
              <SelectTrigger className="mt-1 h-10 border border-gray-300 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.business_name}</span>
                      {customer.contact_person && (
                        <span className="text-sm text-gray-500">{customer.contact_person}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="h-10 px-4 border border-gray-300 hover:border-blue-500 transition-colors">
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="business_name" className="text-sm">Business Name *</Label>
                    <Input
                      id="business_name"
                      className="h-9"
                      value={newCustomerData.business_name}
                      onChange={(e) => updateNewCustomerData('business_name', e.target.value)}
                      placeholder="ABC Company"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person" className="text-sm">Contact Person *</Label>
                    <Input
                      id="contact_person"
                      className="h-9"
                      value={newCustomerData.contact_person}
                      onChange={(e) => updateNewCustomerData('contact_person', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-9"
                      value={newCustomerData.email}
                      onChange={(e) => updateNewCustomerData('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm">Phone</Label>
                    <Input
                      id="phone"
                      className="h-9"
                      value={newCustomerData.phone}
                      onChange={(e) => updateNewCustomerData('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <Input
                    id="address"
                    className="h-9"
                    value={newCustomerData.address}
                    onChange={(e) => updateNewCustomerData('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNewCustomerDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm"
                  onClick={createNewCustomer}
                  disabled={isCreatingCustomer}
                >
                  {isCreatingCustomer ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Compact Selected Customer Preview */}
        {formData.customer_id && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            {(() => {
              const selectedCustomer = customers.find(c => c.id === formData.customer_id);
              return selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {selectedCustomer.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm">{selectedCustomer.business_name}</p>
                      <p className="text-xs text-blue-600">
                        {selectedCustomer.contact_person} 
                        {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => updateFormData('customer_id', '')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </Button>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}