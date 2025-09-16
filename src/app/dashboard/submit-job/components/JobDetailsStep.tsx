import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { JobFormData, Service } from '@/lib/hooks/useJobSubmissionForm';

interface JobDetailsStepProps {
  formData: JobFormData;
  updateFormData: (field: keyof JobFormData, value: JobFormData[keyof JobFormData]) => void;
  services: Service[];
}

export default function JobDetailsStep({
  formData,
  updateFormData,
  services
}: JobDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
        <p className="text-gray-600">Provide basic information about your print job</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="service">Service Type *</Label>
            <Select 
              value={formData.service_id} 
              onValueChange={(value) => updateFormData('service_id', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select service..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{service.title}</span>
                      {service.description && (
                        <span className="text-sm text-gray-500 truncate max-w-[200px]">
                          {service.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                updateFormData('priority', value)
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    Low Priority
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    Normal Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    Urgent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            placeholder="Business Cards, Brochures, etc."
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Detailed description of the job..."
            rows={3}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="unit_price">Unit Price ($) *</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price}
              onChange={(e) => updateFormData('unit_price', parseFloat(e.target.value) || 0)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => updateFormData('due_date', e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => updateFormData('requirements', e.target.value)}
            placeholder="Specific requirements, color preferences, etc."
            rows={3}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="special_instructions">Special Instructions</Label>
          <Textarea
            id="special_instructions"
            value={formData.special_instructions}
            onChange={(e) => updateFormData('special_instructions', e.target.value)}
            placeholder="Any special instructions for production..."
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Job Preview */}
        {formData.title && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Job Preview</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Quantity:</strong> {formData.quantity.toLocaleString()} units</p>
              <p><strong>Unit Price:</strong> SLL {formData.unit_price.toFixed(2)}</p>
              <p><strong>Estimated Total:</strong> SLL {(formData.quantity * formData.unit_price).toFixed(2)}</p>
              <p><strong>Priority:</strong> {formData.priority}</p>
              {formData.due_date && <p><strong>Due Date:</strong> {new Date(formData.due_date).toLocaleDateString('en-SL')}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}