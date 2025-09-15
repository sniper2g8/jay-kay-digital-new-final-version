import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, DollarSign, FileText, User, Settings, Upload } from 'lucide-react';
import { JobFormData, Customer, Service } from '@/lib/hooks/useJobSubmissionForm';
import { FileUpload } from '@/lib/hooks/useFileUpload';
import { FinishOption } from '@/lib/hooks/usePaperSpecifications';

interface ReviewStepProps {
  formData: JobFormData;
  customers: Customer[];
  services: Service[];
  fileUploads: FileUpload[];
  estimatedPrice: number;
  finishingOptionPrices: Record<string, number>;
  availableFinishingOptions: FinishOption[];
}

export default function ReviewStep({
  formData,
  customers,
  services,
  fileUploads,
  estimatedPrice,
  finishingOptionPrices,
  availableFinishingOptions
}: ReviewStepProps) {
  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const selectedService = services.find(s => s.id === formData.service_id);
  
  const basePrice = formData.unit_price * formData.quantity;
  const finishingCost = formData.finishing_options.reduce((total, optionId) => {
    return total + (finishingOptionPrices[optionId] || 0) * formData.quantity;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
        <p className="text-gray-600">Please review all details before submitting your job</p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Business Name</p>
                  <p className="text-lg font-semibold">{selectedCustomer.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Person</p>
                  <p className="text-lg">{selectedCustomer.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg">{selectedCustomer.phone || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-red-500">No customer selected</p>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Job Title</p>
                <p className="text-lg font-semibold">{formData.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Service Type</p>
                <p className="text-lg">{selectedService?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <Badge 
                  variant="outline" 
                  className={
                    formData.priority === 'urgent' ? 'border-red-500 text-red-700' :
                    formData.priority === 'high' ? 'border-orange-500 text-orange-700' :
                    formData.priority === 'normal' ? 'border-blue-500 text-blue-700' :
                    'border-gray-500 text-gray-700'
                  }
                >
                  {formData.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="text-lg">{formData.quantity.toLocaleString()} units</p>
              </div>
              {formData.due_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="text-lg">{new Date(formData.due_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            {formData.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-700">{formData.description}</p>
              </div>
            )}
            
            {formData.requirements && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Requirements</p>
                <p className="text-gray-700">{formData.requirements}</p>
              </div>
            )}
            
            {formData.special_instructions && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Special Instructions</p>
                <p className="text-gray-700">{formData.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Size</p>
                {formData.size_type === 'standard' ? (
                  <Badge variant="outline" className="text-sm">
                    {formData.size_preset}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm">
                    {formData.custom_width}&quot; × {formData.custom_height}&quot; ({formData.custom_unit})
                  </Badge>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Paper</p>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-sm block w-fit">
                    {formData.paper_type}
                  </Badge>
                  <Badge variant="outline" className="text-sm block w-fit">
                    {formData.paper_weight} GSM
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Finishing Options</p>
                <div className="space-y-1">
                  {formData.finishing_options.length > 0 ? (
                    formData.finishing_options.map(optionId => {
                      const option = availableFinishingOptions.find(o => o.id === optionId);
                      return (
                        <Badge key={optionId} variant="outline" className="text-sm block w-fit">
                          {option?.name || optionId}
                        </Badge>
                      );
                    })
                  ) : (
                    <Badge variant="outline" className="text-sm">
                      None
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Attached Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fileUploads.length > 0 ? (
              <div className="space-y-2">
                {fileUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{upload.file.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        upload.status === 'completed' ? 'text-green-600 border-green-600' :
                        upload.status === 'error' ? 'text-red-600 border-red-600' :
                        'text-gray-600 border-gray-600'
                      }
                    >
                      {upload.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No files attached</p>
            )}
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Price ({formData.quantity} × ${formData.unit_price.toFixed(2)})</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              
              {formData.finishing_options.length > 0 && (
                <>
                  <div className="text-sm font-medium text-gray-700">Finishing Options:</div>
                  {formData.finishing_options.map(optionId => {
                    const option = availableFinishingOptions.find(o => o.id === optionId);
                    const price = finishingOptionPrices[optionId] || 0;
                    const total = price * formData.quantity;
                    return (
                      <div key={optionId} className="flex justify-between text-sm ml-4">
                        <span>{option?.name} ({formData.quantity} × ${price.toFixed(2)})</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm">
                    <span>Finishing Subtotal:</span>
                    <span>${finishingCost.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total Estimated Cost:</span>
                <span>${estimatedPrice.toFixed(2)}</span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                * This is an estimate. Final pricing may vary based on actual specifications and production requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final Confirmation */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Submit</h3>
              <p className="text-blue-700 text-sm">
                Please review all information above. Once submitted, you&apos;ll receive a confirmation 
                email and can track your job&apos;s progress in the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}