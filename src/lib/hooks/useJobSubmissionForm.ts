import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { usePaperSpecifications } from "./usePaperSpecifications.ts";
import { Database } from "@/lib/database-generated.types";

type FinishOption = Database["public"]["Tables"]["finish_options"]["Row"];

export interface JobFormData {
  customer_id: string;
  service_id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  quantity: number;
  due_date: string;
  requirements: string;
  special_instructions: string;
  unit_price: number;
  estimate_price: number;
  size_type: "standard" | "custom";
  size_preset: string;
  custom_width: number;
  custom_height: number;
  custom_unit: "inches" | "cm" | "mm";
  paper_type: string;
  paper_weight: number;
  finishing_options: string[];
  finishing_price: number;
}

export interface NewCustomerData {
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface Customer {
  id: string;
  human_id: string | null;
  business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

export interface Service {
  id: string;
  title: string | null;
  description: string | null;
  specSchema: unknown;
  active: boolean | null;
  slug: string | null;
  imageUrl: string | null;
  options: unknown; // JSON field from database
}

export interface ServiceOptions {
  finishIds?: string[];
  paper?: {
    types?: string[];
    weightsGsm?: number[];
  };
  sizing?: {
    standardSizes?: string[];
    supportsCustom?: boolean;
    supportsStandard?: boolean;
  };
}

const initialFormData: JobFormData = {
  customer_id: "",
  service_id: "",
  title: "",
  description: "",
  priority: "normal",
  quantity: 1,
  due_date: "",
  requirements: "",
  special_instructions: "",
  unit_price: 0,
  estimate_price: 0,
  size_type: "standard",
  size_preset: "",
  custom_width: 0,
  custom_height: 0,
  custom_unit: "inches",
  paper_type: "",
  paper_weight: 80,
  finishing_options: [],
  finishing_price: 0,
};

const initialCustomerData: NewCustomerData = {
  business_name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
};

export const useJobSubmissionForm = () => {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [newCustomerData, setNewCustomerData] =
    useState<NewCustomerData>(initialCustomerData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);

  // Dynamic options based on service type
  const [availablePaperTypes, setAvailablePaperTypes] = useState<string[]>([]);
  const [availablePaperWeights, setAvailablePaperWeights] = useState<number[]>(
    [],
  );
  const [availableFinishingOptions, setAvailableFinishingOptions] = useState<
    FinishOption[]
  >([]);
  const [finishingOptionPrices, setFinishingOptionPrices] = useState<
    Record<string, number>
  >({});

  const { paperSizes, paperWeights, paperTypes, finishOptions } =
    usePaperSpecifications();

  // Form steps configuration
  const formSteps = [
    {
      id: "customer",
      title: "Customer",
      description: "Select or add customer",
    },
    {
      id: "details",
      title: "Job Details",
      description: "Basic job information",
    },
    {
      id: "specifications",
      title: "Specifications",
      description: "Size, paper & finishing",
    },
    { id: "files", title: "Files", description: "Upload attachments" },
    { id: "review", title: "Review", description: "Final review & submit" },
  ];

  // Service-specific specifications mapping - memoized to prevent unnecessary re-renders
  const serviceSpecifications = useMemo(
    () => ({
      business_cards: {
        paper_types: ["Cardstock", "Premium Paper", "Glossy Paper"],
        paper_weights: [250, 300, 350],
        finishing_options: [
          "lamination",
          "uv_coating",
          "embossing",
          "foil_stamping",
          "die_cutting",
        ],
      },
      brochures: {
        paper_types: ["Glossy Paper", "Matte Paper", "Premium Paper"],
        paper_weights: [80, 100, 120, 150],
        finishing_options: ["lamination", "uv_coating", "folding", "trimming"],
      },
      flyers: {
        paper_types: ["Copy Paper", "Glossy Paper", "Matte Paper"],
        paper_weights: [80, 100, 120],
        finishing_options: ["lamination", "uv_coating", "trimming"],
      },
      posters: {
        paper_types: ["Photo Paper", "Glossy Paper", "Matte Paper"],
        paper_weights: [120, 150, 200],
        finishing_options: ["lamination", "uv_coating", "trimming"],
      },
      booklets: {
        paper_types: ["Copy Paper", "Bond Paper", "Premium Paper"],
        paper_weights: [60, 80, 100],
        finishing_options: [
          "binding_spiral",
          "binding_perfect",
          "folding",
          "trimming",
        ],
      },
      banners: {
        paper_types: ["Vinyl", "Canvas"],
        paper_weights: [200, 250, 300],
        finishing_options: ["hole_punching", "trimming"],
      },
    }),
    [],
  );

  // Load customers and services
  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, human_id, business_name, contact_person, email, phone")
        .order("business_name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      toast.error("Failed to load customers");
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, title, description, specSchema, active, slug, imageUrl, options")
        .eq("active", true)
        .order("title", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Error loading services:", err);
      toast.error("Failed to load services");
    }
  }, []);

  // Calculate estimated price
  const calculateEstimatedPrice = useCallback(() => {
    const finishingPrice = formData.finishing_options.reduce(
      (total, optionId) => {
        return total + (finishingOptionPrices[optionId] || 0);
      },
      0,
    );

    const unitPriceWithFinishing = formData.unit_price + finishingPrice;
    const total = unitPriceWithFinishing * formData.quantity;

    // No surcharges applied - paper weight and custom size don't add extra cost
    const finalPrice = total;
    setEstimatedPrice(Math.round(finalPrice * 100) / 100);
  }, [
    formData.unit_price,
    formData.finishing_options,
    formData.quantity,
    finishingOptionPrices,
  ]);

  // Update available options when service changes
  const updateAvailableOptions = useCallback(() => {
    if (!paperTypes.data || !paperWeights.data || !finishOptions.data) {
      return;
    }

    const selectedService = services.find((s) => s.id === formData.service_id);
    if (!selectedService) {
      // Use all available options from database
      setAvailablePaperTypes(paperTypes.data.map((p) => p.name));
      setAvailablePaperWeights(paperWeights.data.map((p) => p.gsm));
      setAvailableFinishingOptions(finishOptions.data);
      return;
    }

    // Parse service options from database
    const serviceOptions = selectedService.options as ServiceOptions | null;

    if (serviceOptions) {
      // Filter based on actual service options from database
      const filteredPaperTypes = serviceOptions.paper?.types || [];
      const filteredPaperWeights = serviceOptions.paper?.weightsGsm || [];
      const availableFinishIds = serviceOptions.finishIds || [];

      // Filter finishing options by the service's finishIds
      const filteredFinishing = finishOptions.data?.filter((option) =>
        availableFinishIds.includes(option.id),
      ) || [];

      // Set available options (use defaults if service doesn't specify)
      setAvailablePaperTypes(
        filteredPaperTypes.length > 0
          ? filteredPaperTypes
          : paperTypes.data?.map((p) => p.name) || [],
      );
      setAvailablePaperWeights(
        filteredPaperWeights.length > 0
          ? filteredPaperWeights
          : paperWeights.data?.map((p) => p.gsm) || [],
      );
      setAvailableFinishingOptions(
        filteredFinishing.length > 0 ? filteredFinishing : finishOptions.data || [],
      );

      // Reset selections if they're no longer valid
      if (
        filteredPaperTypes.length > 0 &&
        !filteredPaperTypes.includes(formData.paper_type)
      ) {
        setFormData((prev) => ({ ...prev, paper_type: filteredPaperTypes[0] }));
      }

      if (
        filteredPaperWeights.length > 0 &&
        !filteredPaperWeights.includes(formData.paper_weight)
      ) {
        setFormData((prev) => ({
          ...prev,
          paper_weight: filteredPaperWeights[0],
        }));
      }

      // Reset finishing options if any are no longer valid
      const validFinishingOptions = formData.finishing_options.filter(optionId =>
        availableFinishIds.length === 0 || availableFinishIds.includes(optionId)
      );
      
      if (validFinishingOptions.length !== formData.finishing_options.length) {
        setFormData((prev) => ({
          ...prev,
          finishing_options: validFinishingOptions,
        }));
      }
    } else {
      // Use all available options if service has no specific constraints
      setAvailablePaperTypes(paperTypes.data?.map((p) => p.name) || []);
      setAvailablePaperWeights(paperWeights.data?.map((p) => p.gsm) || []);
      setAvailableFinishingOptions(finishOptions.data || []);
    }
  }, [
    services,
    formData.service_id,
    formData.paper_type,
    formData.paper_weight,
    paperTypes.data,
    paperWeights.data,
    finishOptions.data,
  ]);

  // Create new customer
  const createNewCustomer = async () => {
    if (!newCustomerData.business_name || !newCustomerData.contact_person) {
      toast.error("Business name and contact person are required");
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
        customer_status: "active",
        customer_type: "walk_in",
      };

      const { data, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) => [...prev, data]);
      setFormData((prev) => ({ ...prev, customer_id: data.id }));
      setNewCustomerData(initialCustomerData);
      setShowNewCustomerDialog(false);
      toast.success("Customer created successfully!");
    } catch (err) {
      console.error("Customer creation error:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));

      let errorMessage = "Failed to create customer";
      if (err && typeof err === "object") {
        if ("message" in err && err.message) {
          errorMessage = `Customer creation failed: ${err.message}`;
        } else if ("code" in err && err.code) {
          errorMessage = `Database error: ${err.code}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Form validation
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Customer
        return !!formData.customer_id;
      case 1: // Job Details
        return !!(
          formData.service_id &&
          formData.title &&
          formData.unit_price > 0
        );
      case 2: // Specifications
        return !!(formData.paper_type && formData.paper_weight);
      case 3: // Files (optional)
        return true;
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < formSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (!validateCurrentStep()) {
      toast.error("Please fill in all required fields before continuing");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Initialize data
  useEffect(() => {
    loadCustomers();
    loadServices();
  }, [loadCustomers, loadServices]);

  useEffect(() => {
    calculateEstimatedPrice();
  }, [calculateEstimatedPrice]);

  useEffect(() => {
    updateAvailableOptions();
  }, [updateAvailableOptions]);

  // Update form data
  const updateFormData = (
    field: keyof JobFormData,
    value: JobFormData[keyof JobFormData],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNewCustomerData = (
    field: keyof NewCustomerData,
    value: string,
  ) => {
    setNewCustomerData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    // Form data
    formData,
    newCustomerData,
    customers,
    services,
    estimatedPrice,
    currentStep,
    formSteps,

    // Dynamic options
    availablePaperTypes,
    availablePaperWeights,
    availableFinishingOptions,
    finishingOptionPrices,
    setFinishingOptionPrices,

    // Loading states
    isSubmitting,
    isCreatingCustomer,
    showNewCustomerDialog,
    setShowNewCustomerDialog,

    // Paper specifications from database (transformed for compatibility)
    paperSizesData:
      paperSizes.data?.map((size) => ({
        name: size.name,
        width_mm: Math.round(size.width_inches * 25.4 * 100) / 100, // Convert inches to mm
        height_mm: Math.round(size.height_inches * 25.4 * 100) / 100,
      })) || [],
    paperWeightsData: paperWeights.data,
    paperTypesData: paperTypes.data,
    finishOptionsData: finishOptions.data,

    // Functions
    updateFormData,
    updateNewCustomerData,
    createNewCustomer,
    nextStep,
    prevStep,
    validateCurrentStep,

    // Setters for direct access
    setFormData,
    setCurrentStep,
    setIsSubmitting,
  };
};
