'use client';

import React from 'react';
import { useJobSubmissionForm } from '@/lib/hooks/useJobSubmissionForm';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { useJobSubmission } from '@/lib/hooks/useJobSubmission';
import DashboardHeader from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User,
  FileText,
  Settings,
  Upload,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';

// Import step components
import CustomerStep from './components/CustomerStep';
import JobDetailsStep from './components/JobDetailsStep';
import SpecificationsStep from './components/SpecificationsStep';
import FilesStep from './components/FilesStep';
import ReviewStep from './components/ReviewStep';

const formSteps = [
  { id: 'customer', title: 'Customer', icon: User, description: 'Select or add customer' },
  { id: 'details', title: 'Job Details', icon: FileText, description: 'Basic job information' },
  { id: 'specifications', title: 'Specifications', icon: Settings, description: 'Size, paper & finishing' },
  { id: 'files', title: 'Files', icon: Upload, description: 'Upload attachments' },
  { id: 'review', title: 'Review', icon: CheckCircle2, description: 'Final review & submit' }
];

export default function SubmitJobPage() {
  const formHook = useJobSubmissionForm();
  const fileHook = useFileUpload();
  const submissionHook = useJobSubmission();

  const {
    currentStep,
    validateCurrentStep,
    nextStep,
    prevStep,
    formData,
    estimatedPrice,
    finishingOptionPrices
  } = formHook;

  const { uploadFiles } = fileHook;
  const { submitJob, isSubmitting } = submissionHook;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload files first if any
      const uploadedFileRecords = fileHook.fileUploads.length > 0 
        ? await uploadFiles(crypto.randomUUID()) // Temporary ID, will be replaced with actual job ID
        : [];

      // Submit the job
      await submitJob(formData, estimatedPrice, finishingOptionPrices, uploadedFileRecords);
      
      // Clear files after successful submission
      fileHook.clearFiles();
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CustomerStep {...formHook} />;
      case 1:
        return <JobDetailsStep {...formHook} />;
      case 2:
        return <SpecificationsStep {...formHook} />;
      case 3:
        return <FilesStep {...fileHook} />;
      case 4:
        return <ReviewStep {...formHook} {...fileHook} estimatedPrice={estimatedPrice} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardHeader />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Submit New Job</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a comprehensive printing job request with our step-by-step form
            </p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-4 shadow-sm border">
              {formSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center space-x-3 ${
                      index < formSteps.length - 1 ? 'mr-4' : ''
                    }`}>
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                        ${isActive ? 'bg-blue-600 border-blue-600 text-white' : ''}
                        ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="hidden md:block">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                      </div>
                    </div>
                    {index < formSteps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Step Content */}
            <div className="min-h-[500px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {formSteps.length}
              </div>

              <div>
                {currentStep < formSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateCurrentStep()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !validateCurrentStep()}
                    className="flex items-center gap-2 min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Job
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Progress Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Form Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {formSteps.map((step, index) => (
                <div key={step.id} className="text-center">
                  <div className={`text-sm font-medium ${
                    index <= currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-xs mt-1 ${
                    index < currentStep ? 'text-green-500' : 
                    index === currentStep ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {index < currentStep ? '✓ Complete' : 
                     index === currentStep ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  FileText, 
  Plus, 
  User,
  Calculator,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Settings,
  Package,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  human_id: string | null;
  business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

interface Service {
  id: string;
  title: string | null;
  description: string | null;
  specSchema: unknown;
  active: boolean | null;
  slug: string | null;
  imageUrl: string | null;
}

interface JobFormData {
  customer_id: string;
  service_id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  quantity: number;
  due_date: string;
  requirements: string;
  special_instructions: string;
  // New fields
  unit_price: number;
  size_type: 'standard' | 'custom';
  size_preset: string;
  custom_width: number;
  custom_height: number;
  custom_unit: 'inches' | 'cm' | 'mm';
  paper_type: string;
  paper_weight: number;
  finishing_options: string[];
  finishing_price: number;
}

interface NewCustomerData {
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id: string;
}

const paperTypes = [
  'Bond Paper',
  'Copy Paper',
  'Cardstock',
  'Photo Paper',
  'Glossy Paper',
  'Matte Paper',
  'Recycled Paper',
  'Premium Paper'
];

const paperWeights = [20, 24, 28, 32, 40, 60, 80, 100, 110, 120, 150, 200, 250, 300];

// Finishing options with pricing
const finishingOptions = [
  { id: 'none', name: 'No Finishing', price: 0 },
  { id: 'lamination', name: 'Lamination', price: 0.50 },
  { id: 'uv_coating', name: 'UV Coating', price: 0.75 },
  { id: 'embossing', name: 'Embossing', price: 1.00 },
  { id: 'foil_stamping', name: 'Foil Stamping', price: 1.25 },
  { id: 'die_cutting', name: 'Die Cutting', price: 0.80 },
  { id: 'folding', name: 'Folding', price: 0.25 },
  { id: 'binding_spiral', name: 'Spiral Binding', price: 2.00 },
  { id: 'binding_perfect', name: 'Perfect Binding', price: 3.00 },
  { id: 'trimming', name: 'Trimming', price: 0.15 },
  { id: 'hole_punching', name: 'Hole Punching', price: 0.10 },
  { id: 'score_crease', name: 'Scoring/Creasing', price: 0.20 }
];

// Service-specific paper types and finishing options
const serviceSpecifications = {
  'business_cards': {
    paper_types: ['Cardstock', 'Premium Paper', 'Glossy Paper'],
    paper_weights: [250, 300, 350],
    finishing_options: ['lamination', 'uv_coating', 'embossing', 'foil_stamping', 'die_cutting']
  },
  'brochures': {
    paper_types: ['Glossy Paper', 'Matte Paper', 'Premium Paper'],
    paper_weights: [80, 100, 120, 150],
    finishing_options: ['lamination', 'uv_coating', 'folding', 'trimming']
  },
  'flyers': {
    paper_types: ['Copy Paper', 'Glossy Paper', 'Matte Paper'],
    paper_weights: [80, 100, 120],
    finishing_options: ['lamination', 'uv_coating', 'trimming']
  },
  'posters': {
    paper_types: ['Photo Paper', 'Glossy Paper', 'Matte Paper'],
    paper_weights: [120, 150, 200],
    finishing_options: ['lamination', 'uv_coating', 'trimming']
  },
  'booklets': {
    paper_types: ['Copy Paper', 'Bond Paper', 'Premium Paper'],
    paper_weights: [60, 80, 100],
    finishing_options: ['binding_spiral', 'binding_perfect', 'folding', 'trimming']
  },
  'banners': {
    paper_types: ['Vinyl', 'Canvas'],
    paper_weights: [200, 250, 300],
    finishing_options: ['hole_punching', 'trimming']
  }
};

const sizePresets = [
  // A-Series Standard Sizes (ISO 216)
  { name: 'A0 (841mm x 1189mm)', width: 33.1, height: 46.8, unit: 'inches' },
  { name: 'A1 (594mm x 841mm)', width: 23.4, height: 33.1, unit: 'inches' },
  { name: 'A2 (420mm x 594mm)', width: 16.5, height: 23.4, unit: 'inches' },
  { name: 'A3 (297mm x 420mm)', width: 11.7, height: 16.5, unit: 'inches' },
  { name: 'A4 (210mm x 297mm)', width: 8.27, height: 11.69, unit: 'inches' },
  { name: 'A5 (148mm x 210mm)', width: 5.83, height: 8.27, unit: 'inches' },
  { name: 'A6 (105mm x 148mm)', width: 4.13, height: 5.83, unit: 'inches' },
  
  // Common US Sizes
  { name: 'Letter (8.5" x 11")', width: 8.5, height: 11, unit: 'inches' },
  { name: 'Legal (8.5" x 14")', width: 8.5, height: 14, unit: 'inches' },
  { name: 'Tabloid (11" x 17")', width: 11, height: 17, unit: 'inches' },
  
  // Business & Marketing
  { name: 'Business Card (3.5" x 2")', width: 3.5, height: 2, unit: 'inches' },
  { name: 'Postcard (4" x 6")', width: 4, height: 6, unit: 'inches' },
  { name: 'Flyer (8.5" x 11")', width: 8.5, height: 11, unit: 'inches' },
  { name: 'Poster (18" x 24")', width: 18, height: 24, unit: 'inches' },
  { name: 'Poster (24" x 36")', width: 24, height: 36, unit: 'inches' },
  { name: 'Banner (36" x 72")', width: 36, height: 72, unit: 'inches' }
];

const initialFormData: JobFormData = {
  customer_id: '',
  service_id: '',
  title: '',
  description: '',
  priority: 'normal',
  quantity: 1,
  due_date: '',
  requirements: '',
  special_instructions: '',
  unit_price: 0,
  size_type: 'standard',
  size_preset: '',
  custom_width: 0,
  custom_height: 0,
  custom_unit: 'inches',
  paper_type: '',
  paper_weight: 20,
  finishing_options: [],
  finishing_price: 0
};

const initialCustomerData: NewCustomerData = {
  business_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: ''
};

export default function EnhancedSubmitJobPage() {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>(initialCustomerData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  
  // Dynamic options based on service type
  const [availablePaperTypes, setAvailablePaperTypes] = useState<string[]>(paperTypes);
  const [availablePaperWeights, setAvailablePaperWeights] = useState<number[]>(paperWeights);
  const [availableFinishingOptions, setAvailableFinishingOptions] = useState<typeof finishingOptions>([]);
  const [finishingOptionPrices, setFinishingOptionPrices] = useState<Record<string, number>>({});
  
  // Form progress tracking
  const [currentStep, setCurrentStep] = useState(0);
  
  const formSteps = [
    { id: 'customer', title: 'Customer', icon: User, description: 'Select or add customer' },
    { id: 'details', title: 'Job Details', icon: FileText, description: 'Basic job information' },
    { id: 'specifications', title: 'Specifications', icon: Settings, description: 'Size, paper & finishing' },
    { id: 'files', title: 'Files', icon: Upload, description: 'Upload attachments' },
    { id: 'review', title: 'Review', icon: CheckCircle2, description: 'Final review & submit' }
  ];
  
  const { user } = useAuth();
  const router = useRouter();

  // Calculate estimated price based on form data
  const calculateEstimatedPrice = useCallback(() => {
    // Calculate total finishing options price using custom prices
    const finishingPrice = formData.finishing_options.reduce((total, optionId) => {
      return total + (finishingOptionPrices[optionId] || 0);
    }, 0);
    
    // New formula: (unit price + finishing option price) * quantity
    const unitPriceWithFinishing = formData.unit_price + finishingPrice;
    const total = unitPriceWithFinishing * formData.quantity;
    
    // Add paper weight multiplier if needed
    const weightMultiplier = formData.paper_weight >= 200 ? 1.1 : 1.0;
    
    // Add custom size multiplier if needed
    const sizeMultiplier = formData.size_type === 'custom' ? 1.15 : 1.0;
    
    const finalPrice = total * weightMultiplier * sizeMultiplier;
    setEstimatedPrice(Math.round(finalPrice * 100) / 100);
  }, [formData.unit_price, formData.finishing_options, formData.quantity, formData.paper_weight, formData.size_type, finishingOptionPrices]);

  // Update available options when service changes
  const updateAvailableOptions = useCallback(() => {
    const selectedService = services.find(s => s.id === formData.service_id);
    if (!selectedService) {
      // Reset to default options when no service selected
      setAvailablePaperTypes(paperTypes);
      setAvailablePaperWeights(paperWeights);
      setAvailableFinishingOptions(finishingOptions);
      return;
    }

    // Try to match service title/slug with specifications
    const serviceKey = selectedService.title?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const serviceSpec = serviceSpecifications[serviceKey as keyof typeof serviceSpecifications];
    
    if (serviceSpec) {
      // Filter paper types based on service
      const filteredPaperTypes = paperTypes.filter(type => 
        serviceSpec.paper_types.includes(type)
      );
      setAvailablePaperTypes(filteredPaperTypes.length > 0 ? filteredPaperTypes : paperTypes);
      
      // Filter paper weights based on service
      setAvailablePaperWeights(serviceSpec.paper_weights);
      
      // Filter finishing options based on service
      const filteredFinishing = finishingOptions.filter(option => 
        serviceSpec.finishing_options.includes(option.id)
      );
      setAvailableFinishingOptions(filteredFinishing);
      
      // Reset form selections if they're no longer valid
      if (filteredPaperTypes.length > 0 && !filteredPaperTypes.includes(formData.paper_type)) {
        setFormData(prev => ({ ...prev, paper_type: filteredPaperTypes[0] }));
      }
      
      if (!serviceSpec.paper_weights.includes(formData.paper_weight)) {
        setFormData(prev => ({ ...prev, paper_weight: serviceSpec.paper_weights[0] }));
      }
    } else {
      // Use default options if service not found in specifications
      setAvailablePaperTypes(paperTypes);
      setAvailablePaperWeights(paperWeights);
      setAvailableFinishingOptions(finishingOptions);
    }
  }, [services, formData.service_id, formData.paper_type, formData.paper_weight]);

  useEffect(() => {
    loadCustomers();
    loadServices();
  }, []);

  useEffect(() => {
    calculateEstimatedPrice();
  }, [calculateEstimatedPrice]);

  useEffect(() => {
    updateAvailableOptions();
  }, [updateAvailableOptions]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, human_id, business_name, contact_person, email, phone')
        .order('business_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      toast.error('Failed to load customers');
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, description, specSchema, active, slug, imageUrl')
        .eq('active', true)
        .order('title', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error loading services:', err);
      toast.error('Failed to load services');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newUploads: FileUpload[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      id: crypto.randomUUID()
    }));
    
    setFileUploads(prev => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const createNewCustomer = async () => {
    if (!newCustomerData.business_name || !newCustomerData.contact_person) {
      toast.error('Business name and contact person are required');
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const customerData = {
        id: crypto.randomUUID(),
        human_id: `CUST-${Date.now()}`,
        business_name: newCustomerData.business_name,
        contact_person: newCustomerData.contact_person,
        email: newCustomerData.email || null,
        phone: newCustomerData.phone || null,
        address: newCustomerData.address || null,
        city: newCustomerData.city || null,
        state: newCustomerData.state || null,
        zip_code: newCustomerData.zip_code || null,
        customer_status: 'active',
        customer_type: 'walk_in'
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, customer_id: data.id }));
      setNewCustomerData(initialCustomerData);
      setShowNewCustomerDialog(false);
      toast.success('Customer created successfully!');
    } catch (err) {
      console.error('Error creating customer:', err);
      toast.error('Failed to create customer');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

interface FileRecord {
  entity_id: string;
  entity_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
}

  const uploadFiles = async (jobId: string): Promise<FileRecord[]> => {
    const uploadedFiles: FileRecord[] = [];

    for (let i = 0; i < fileUploads.length; i++) {
      const upload = fileUploads[i];
      
      try {
        setFileUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u
        ));

        const fileName = `${jobId}/${upload.file.name}`;
        
        const { data, error } = await supabase.storage
          .from('job-files')
          .upload(fileName, upload.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        setFileUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u
        ));

        const { data: fileUrl } = supabase.storage
          .from('job-files')
          .getPublicUrl(data.path);

        uploadedFiles.push({
          entity_id: jobId,
          entity_type: 'job',
          file_name: upload.file.name,
          file_url: fileUrl.publicUrl,
          file_size: upload.file.size,
          file_type: upload.file.type,
          uploaded_by: user?.id
        });
      } catch (err) {
        console.error('Error uploading file:', err);
        setFileUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'error', progress: 0 } : u
        ));
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a job');
      return;
    }

    if (!formData.customer_id || !formData.service_id || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate job number
      const jobNumber = `JKDP-JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      // Prepare specifications with all details
      const specifications = {
        requirements: formData.requirements,
        special_instructions: formData.special_instructions,
        unit_price: formData.unit_price,
        size: formData.size_type === 'standard' 
          ? { type: 'standard', preset: formData.size_preset }
          : { 
              type: 'custom', 
              width: formData.custom_width, 
              height: formData.custom_height, 
              unit: formData.custom_unit 
            },
        paper: {
          type: formData.paper_type,
          weight: formData.paper_weight
        }
      };

      // Create job record matching the actual database schema
      const jobData = {
        id: crypto.randomUUID(),
        jobNo: jobNumber,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        title: formData.title,
        description: formData.description || null,
        status: 'pending',
        priority: formData.priority,
        quantity: formData.quantity,
        estimated_cost: estimatedPrice,
        estimated_delivery: formData.due_date || null,
        specifications: specifications,
        submittedDate: new Date().toISOString(),
        createdBy: user?.id || null,
        // Finishing options data
        finishIds: formData.finishing_options,
        finishOptions: formData.finishing_options.map(id => 
          finishingOptions.find(opt => opt.id === id)?.name || id
        ),
        finishPrices: finishingOptionPrices
      };

      console.log('Submitting job data:', jobData);

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      if (jobError) {
        console.error('Job creation error details:', {
          message: jobError.message,
          code: jobError.code,
          details: jobError.details,
          hint: jobError.hint
        });
        
        // Provide user-friendly error messages
        let userMessage = 'Failed to create job.';
        if (jobError.message.includes('permission denied')) {
          userMessage = 'Permission denied. Please contact an administrator to configure database permissions.';
        } else if (jobError.message.includes('duplicate')) {
          userMessage = 'A job with this information already exists.';
        } else if (jobError.message.includes('foreign key')) {
          userMessage = 'Invalid customer or service selected.';
        }
        
        throw new Error(userMessage);
      }

      // Upload files if any
      if (fileUploads.length > 0) {
        const uploadedFileRecords = await uploadFiles(job.id);
        
        if (uploadedFileRecords.length > 0) {
          const { error: filesError } = await supabase
            .from('file_attachments')
            .insert(uploadedFileRecords);

          if (filesError) {
            console.error('File attachment error:', filesError);
            throw new Error(`Failed to attach files: ${filesError.message}`);
          }
        }
      }

      toast.success('Job submitted successfully!');
      router.push(`/dashboard/jobs`);
    } catch (err) {
      console.error('Error submitting job:', err);
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err?.constructor?.name);
      
      // Log the full error object for debugging
      try {
        console.error('Error JSON:', JSON.stringify(err, null, 2));
      } catch (jsonErr) {
        console.error('Error serialization failed:', jsonErr);
        console.error('Error keys:', Object.keys(err || {}));
      }
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to submit job. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('permission denied')) {
          errorMessage = 'Database permissions need to be configured. Please contact support.';
          console.log('🔧 SOLUTION: Execute the SQL in add-auth-policies.sql in your Supabase dashboard');
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.message.includes('duplicate')) {
          errorMessage = 'A job with this information already exists.';
        } else if (err.message.includes('foreign key')) {
          errorMessage = 'Please select valid customer and service options.';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardHeader />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Submit New Job</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a comprehensive printing job request with our step-by-step form
            </p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-4 shadow-sm border">
              {formSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center space-x-3 ${
                      index < formSteps.length - 1 ? 'mr-4' : ''
                    }`}>
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                        ${isActive ? 'bg-blue-600 border-blue-600 text-white' : ''}
                        ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="hidden md:block">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                      </div>
                    </div>
                    {index < formSteps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Step Content */}
            <div className="min-h-[500px]">
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Customer Information</h2>
                    <p className="text-gray-600">Select an existing customer or add a new one</p>
                  </div>
                  
                  {/* Customer Selection Content */}
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor="customer" className="text-sm font-semibold text-gray-700">
                          Select Customer *
                        </Label>
                        <Select 
                          value={formData.customer_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                        >
                          <SelectTrigger className="mt-2 h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors">
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
                          <Button type="button" variant="outline" className="h-12 px-6 border-2 border-gray-200 hover:border-blue-500 transition-colors">
                            <Plus className="h-4 w-4 mr-2" />
                            New Customer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="business_name">Business Name *</Label>
                              <Input
                                id="business_name"
                                value={newCustomerData.business_name}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, business_name: e.target.value }))}
                                placeholder="ABC Company"
                              />
                            </div>
                            <div>
                              <Label htmlFor="contact_person">Contact Person *</Label>
                              <Input
                                id="contact_person"
                                value={newCustomerData.contact_person}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, contact_person: e.target.value }))}
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newCustomerData.email}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="john@example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input
                                id="phone"
                                value={newCustomerData.phone}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="address">Address</Label>
                              <Input
                                id="address"
                                value={newCustomerData.address}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="123 Main St"
                              />
                            </div>
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={newCustomerData.city}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Anytown"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                value={newCustomerData.state}
                                onChange={(e) => setNewCustomerData(prev => ({ ...prev, state: e.target.value }))}
                                placeholder="CA"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowNewCustomerDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="button" 
                              onClick={createNewCustomer}
                              disabled={isCreatingCustomer}
                            >
                              {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Job Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                    <p className="text-gray-600">Provide basic information about your print job</p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service">Service Type *</Label>
                  <Select 
                    value={formData.service_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.title}
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
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Business Cards, Brochures, etc."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the job..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Size Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Size Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Size Type</Label>
                <Select 
                  value={formData.size_type} 
                  onValueChange={(value: 'standard' | 'custom') => 
                    setFormData(prev => ({ ...prev, size_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Size</SelectItem>
                    <SelectItem value="custom">Custom Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.size_type === 'standard' ? (
                <div>
                  <Label htmlFor="size_preset">Standard Size</Label>
                  <Select 
                    value={formData.size_preset} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, size_preset: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sizePresets.map((size) => (
                        <SelectItem key={size.name} value={size.name}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="custom_width">Width</Label>
                    <Input
                      id="custom_width"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.custom_width}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_width: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_height">Height</Label>
                    <Input
                      id="custom_height"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.custom_height}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_height: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_unit">Unit</Label>
                    <Select 
                      value={formData.custom_unit} 
                      onValueChange={(value: 'inches' | 'cm' | 'mm') => 
                        setFormData(prev => ({ ...prev, custom_unit: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inches">Inches</SelectItem>
                        <SelectItem value="cm">Centimeters</SelectItem>
                        <SelectItem value="mm">Millimeters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paper Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Paper Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paper_type">Paper Type</Label>
                  <Select 
                    value={formData.paper_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paper_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paperTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paper_weight">Paper Weight (GSM)</Label>
                  <Select 
                    value={formData.paper_weight.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paper_weight: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paperWeights.map((weight) => (
                        <SelectItem key={weight} value={weight.toString()}>
                          {weight} GSM
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Finishing Options</CardTitle>
              <p className="text-sm text-gray-600">Select additional finishing services and set custom pricing</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {availableFinishingOptions.map((option) => (
                  <div key={option.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id={`finishing-${option.id}`}
                        checked={formData.finishing_options.includes(option.id)}
                        onChange={(e) => {
                          const updatedOptions = e.target.checked
                            ? [...formData.finishing_options, option.id]
                            : formData.finishing_options.filter(id => id !== option.id);
                          
                          setFormData(prev => ({
                            ...prev,
                            finishing_options: updatedOptions
                          }));

                          // Initialize with default price when selected, remove when deselected
                          if (e.target.checked) {
                            setFinishingOptionPrices(prev => ({
                              ...prev,
                              [option.id]: option.price
                            }));
                          } else {
                            setFinishingOptionPrices(prev => {
                              const newPrices = { ...prev };
                              delete newPrices[option.id];
                              return newPrices;
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`finishing-${option.id}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {option.name}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Default: ${option.price.toFixed(2)} per unit
                        </p>
                      </div>
                    </div>
                    
                    {formData.finishing_options.includes(option.id) && (
                      <div className="ml-7">
                        <Label htmlFor={`price-${option.id}`} className="text-sm">
                          Custom Price per Unit ($)
                        </Label>
                        <Input
                          id={`price-${option.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={finishingOptionPrices[option.id] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFinishingOptionPrices(prev => ({
                              ...prev,
                              [option.id]: value
                            }));
                          }}
                          className="mt-1 w-32"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Total: ${((finishingOptionPrices[option.id] || 0) * formData.quantity).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {availableFinishingOptions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No finishing options available for the selected service
                </p>
              )}
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.tiff,.eps,.ai,.psd"
                />
                <Label htmlFor="file-upload">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG, AI, PSD files supported</p>
                  </div>
                </Label>
              </div>

              {fileUploads.length > 0 && (
                <div className="space-y-2">
                  {fileUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{upload.file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(upload.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {upload.status === 'uploading' && (
                          <Progress value={upload.progress} className="mt-1" />
                        )}
                        {upload.status === 'completed' && (
                          <Badge variant="outline" className="text-green-600 border-green-600 mt-1">
                            Uploaded
                          </Badge>
                        )}
                        {upload.status === 'error' && (
                          <Badge variant="outline" className="text-red-600 border-red-600 mt-1">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Specific requirements, finishing options, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={formData.special_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                  placeholder="Any special instructions for production..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Price Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-lg">
                <span>Estimated Total:</span>
                <span className="font-bold text-green-600">
                  <DollarSign className="h-5 w-5 inline" />{estimatedPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Final price may vary based on actual specifications and finishing options
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}