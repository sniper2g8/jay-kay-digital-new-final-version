"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLargeFormatPrinting } from "@/lib/hooks/useLargeFormatPrinting";

interface LargeFormatCalculatorProps {
  serviceId: string | null;
  onServiceDataChange: (
    data: {
      subService: string | null;
      variant: string | null;
      dimensions: {
        length: number;
        height: number;
        lengthUnit: string;
        heightUnit: string;
      };
      pricing: {
        unitPrice: number;
        totalArea: number;
        totalPrice: number;
      };
    } | null,
  ) => void;
}

export function LargeFormatCalculator({
  serviceId,
  onServiceDataChange,
}: LargeFormatCalculatorProps) {
  const {
    state,
    handleServiceChange,
    handleSubServiceChange,
    handleVariantChange,
    handleDimensionChange,
    handleUnitPriceChange,
    getVariantsForSubService,
  } = useLargeFormatPrinting();

  // Update service when serviceId changes
  React.useEffect(() => {
    handleServiceChange(serviceId);
  }, [serviceId, handleServiceChange]);

  // Notify parent of data changes
  React.useEffect(() => {
    if (state.calculatorVisible) {
      onServiceDataChange({
        subService: state.selectedSubService,
        variant: state.selectedVariant,
        dimensions: state.dimensions,
        pricing: state.pricing,
      });
    } else {
      onServiceDataChange(null);
    }
  }, [state, onServiceDataChange]);

  // If calculator is not visible, render nothing
  if (!state.calculatorVisible) {
    return null;
  }

  // Get available variants for the selected sub-service
  const availableVariants = getVariantsForSubService(state.selectedSubService);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Large Format Printing Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sub-service selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sub-service">Sub-service</Label>
            <Select
              value={state.selectedSubService || ""}
              onValueChange={handleSubServiceChange}
            >
              <SelectTrigger id="sub-service">
                <SelectValue placeholder="Select sub-service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sav">SAV</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="blue_back_paper">Blue Back Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variant selection - only show when sub-service is selected */}
          {state.selectedSubService && (
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={state.selectedVariant || ""}
                onValueChange={handleVariantChange}
              >
                <SelectTrigger id="variant">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {variant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unit price input */}
          <div className="space-y-2">
            <Label htmlFor="unit-price">Unit Price (LE/m²)</Label>
            <Input
              id="unit-price"
              type="number"
              min="0"
              step="0.01"
              value={state.pricing.unitPrice}
              onChange={(e) =>
                handleUnitPriceChange(parseFloat(e.target.value) || 0)
              }
              placeholder="90.00"
            />
          </div>
        </div>

        {/* Dimensions calculator */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Area Calculator</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Length input */}
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <div className="flex gap-2">
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.dimensions.length || ""}
                  onChange={(e) =>
                    handleDimensionChange(
                      "length",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="Enter length"
                />
                <Select
                  value={state.dimensions.lengthUnit}
                  onValueChange={(value) =>
                    handleDimensionChange("lengthUnit", value)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meters</SelectItem>
                    <SelectItem value="cm">Centimeters</SelectItem>
                    <SelectItem value="in">Inches</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Height input */}
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.dimensions.height || ""}
                  onChange={(e) =>
                    handleDimensionChange(
                      "height",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="Enter height"
                />
                <Select
                  value={state.dimensions.heightUnit}
                  onValueChange={(value) =>
                    handleDimensionChange("heightUnit", value)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meters</SelectItem>
                    <SelectItem value="cm">Centimeters</SelectItem>
                    <SelectItem value="in">Inches</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calculation results */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Area</p>
                <p className="text-lg font-medium">
                  {state.pricing.totalArea.toFixed(4)} m²
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Price</p>
                <p className="text-lg font-medium">
                  LE {state.pricing.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
