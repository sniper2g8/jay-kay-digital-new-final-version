import { useState, useEffect, useCallback } from "react";

// Define types for our large format printing service
export interface LargeFormatDimensions {
  length: number;
  height: number;
  lengthUnit: string;
  heightUnit: string;
}

export interface LargeFormatPricing {
  unitPrice: number;
  totalArea: number;
  totalPrice: number;
}

export interface LargeFormatState {
  selectedService: string | null;
  selectedSubService: string | null;
  selectedVariant: string | null;
  calculatorVisible: boolean;
  dimensions: LargeFormatDimensions;
  pricing: LargeFormatPricing;
}

// Unit conversion factors (to meters)
const UNIT_CONVERSIONS: Record<string, number> = {
  m: 1, // meters
  cm: 0.01, // centimeters
  in: 0.0254, // inches
  ft: 0.3048, // feet
};

export const useLargeFormatPrinting = () => {
  const [state, setState] = useState<LargeFormatState>({
    selectedService: null,
    selectedSubService: null,
    selectedVariant: null,
    calculatorVisible: false,
    dimensions: {
      length: 0,
      height: 0,
      lengthUnit: "m",
      heightUnit: "m",
    },
    pricing: {
      unitPrice: 90.0, // Default unit price per m²
      totalArea: 0,
      totalPrice: 0,
    },
  });

  // Sub-service and variant mappings based on database structure
  const SUB_SERVICE_VARIANTS: Record<string, string[]> = {
    sav: ["Normal SAV", "Transparent SAV", "Reflective SAV"],
    banner: [
      "Normal Banner",
      "PVC Banner",
      "Canvas Banner",
      "Reflective Banner",
    ],
    blue_back_paper: ["Blue Back Paper"],
  };

  // Check if the selected service is Large Format Printing
  const isLargeFormatService = useCallback(
    (serviceId: string | null): boolean => {
      // Check against the actual service ID from our database
      return serviceId === "27db6223-9883-44c4-aa89-34e82b4938f5"; // Large Format Printing service ID
    },
    [],
  );

  // Calculate area based on dimensions and unit conversions
  const calculateArea = useCallback((): number => {
    const { length, height, lengthUnit, heightUnit } = state.dimensions;

    if (length <= 0 || height <= 0) {
      return 0;
    }

    // Convert dimensions to meters
    const lengthInMeters = length * (UNIT_CONVERSIONS[lengthUnit] || 1);
    const heightInMeters = height * (UNIT_CONVERSIONS[heightUnit] || 1);

    // Calculate area in square meters
    return lengthInMeters * heightInMeters;
  }, [state.dimensions]);

  // Calculate total price based on area and unit price
  const calculatePrice = useCallback(
    (area: number, unitPrice: number): number => {
      return area * unitPrice;
    },
    [],
  );

  // Update pricing when dimensions or unit price change
  useEffect(() => {
    const area = calculateArea();
    const price = calculatePrice(area, state.pricing.unitPrice);

    setState((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        totalArea: parseFloat(area.toFixed(4)),
        totalPrice: parseFloat(price.toFixed(2)),
      },
    }));
  }, [
    state.dimensions,
    state.pricing.unitPrice,
    calculateArea,
    calculatePrice,
  ]);

  // Handle service selection
  const handleServiceChange = useCallback(
    (serviceId: string | null) => {
      const isLargeFormat = isLargeFormatService(serviceId);

      setState((prev) => ({
        ...prev,
        selectedService: serviceId,
        calculatorVisible: isLargeFormat,
        selectedSubService: null,
        selectedVariant: null,
        dimensions: {
          length: 0,
          height: 0,
          lengthUnit: "m",
          heightUnit: "m",
        },
        pricing: {
          ...prev.pricing,
          totalArea: 0,
          totalPrice: 0,
        },
      }));
    },
    [isLargeFormatService],
  );

  // Handle sub-service selection
  const handleSubServiceChange = useCallback((subService: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedSubService: subService,
      selectedVariant: null,
    }));
  }, []);

  // Handle variant selection
  const handleVariantChange = useCallback((variant: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedVariant: variant,
    }));
  }, []);

  // Handle dimension changes
  const handleDimensionChange = useCallback(
    (dimension: keyof LargeFormatDimensions, value: number | string) => {
      setState((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: value,
        },
      }));
    },
    [],
  );

  // Handle unit price change
  const handleUnitPriceChange = useCallback((price: number) => {
    setState((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        unitPrice: price,
      },
    }));
  }, []);

  // Get available variants for a sub-service
  const getVariantsForSubService = useCallback(
    (subService: string | null): string[] => {
      if (!subService) return [];

      // Use sub-service name directly for lookup (matches database structure)
      return SUB_SERVICE_VARIANTS[subService] || [];
    },
    [],
  );

  // Validation functions
  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    if (!state.selectedService) {
      errors.push("Please select a service");
      return errors;
    }

    if (state.calculatorVisible) {
      if (!state.selectedSubService) {
        errors.push("Please select a sub-service for Large Format Printing");
      }

      if (!state.selectedVariant) {
        errors.push("Please select a variant");
      }

      if (state.dimensions.length <= 0 || state.dimensions.height <= 0) {
        errors.push("Please enter valid dimensions for price calculation");
      }

      if (state.pricing.unitPrice <= 0) {
        errors.push("Unit price must be greater than 0");
      }
    }

    return errors;
  }, [state]);

  // Get job submission data structure
  const getJobSubmissionData = useCallback(() => {
    if (!state.calculatorVisible) {
      return null;
    }

    return {
      service: "Large Format Printing",
      subService: state.selectedSubService,
      variant: state.selectedVariant,
      specifications: {
        dimensions: { ...state.dimensions },
        pricing: { ...state.pricing },
      },
    };
  }, [state, state.calculatorVisible]);

  return {
    // State
    state,

    // Handlers
    handleServiceChange,
    handleSubServiceChange,
    handleVariantChange,
    handleDimensionChange,
    handleUnitPriceChange,

    // Utilities
    isLargeFormatService,
    getVariantsForSubService,
    validateForm,
    getJobSubmissionData,

    // Constants
    SUB_SERVICE_VARIANTS,
    UNIT_CONVERSIONS,
  };
};
