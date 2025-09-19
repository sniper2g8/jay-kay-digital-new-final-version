import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Settings, 
  Package, 
  Scissors, 
  Layers, 
  Sparkles, 
  Zap, 
  Grip, 
  LucideIcon,
  Palette
} from "lucide-react";
import { JobFormData } from "@/lib/hooks/useJobSubmissionForm";
import { Database } from "@/lib/database.types";

type FinishOption = Database["public"]["Tables"]["finish_options"]["Row"];

interface SpecificationsStepProps {
  formData: JobFormData;
  updateFormData: (
    field: keyof JobFormData,
    value: JobFormData[keyof JobFormData],
  ) => void;
  availablePaperTypes: string[];
  availablePaperWeights: number[];
  availableFinishingOptions: FinishOption[];
  finishingOptionPrices: Record<string, number>;
  setFinishingOptionPrices: (prices: Record<string, number>) => void;
  paperSizesData?: { name: string; width_mm: number; height_mm: number }[];
}

// Size presets from the original form
const sizePresets = [
  { name: "A0 (841mm x 1189mm)", width: 33.1, height: 46.8, unit: "inches" },
  { name: "A1 (594mm x 841mm)", width: 23.4, height: 33.1, unit: "inches" },
  { name: "A2 (420mm x 594mm)", width: 16.5, height: 23.4, unit: "inches" },
  { name: "A3 (297mm x 420mm)", width: 11.7, height: 16.5, unit: "inches" },
  { name: "A4 (210mm x 297mm)", width: 8.27, height: 11.69, unit: "inches" },
  { name: "A5 (148mm x 210mm)", width: 5.83, height: 8.27, unit: "inches" },
  { name: "A6 (105mm x 148mm)", width: 4.13, height: 5.83, unit: "inches" },
  { name: 'Letter (8.5" x 11")', width: 8.5, height: 11, unit: "inches" },
  { name: 'Legal (8.5" x 14")', width: 8.5, height: 14, unit: "inches" },
  { name: 'Tabloid (11" x 17")', width: 11, height: 17, unit: "inches" },
  { name: 'Business Card (3.5" x 2")', width: 3.5, height: 2, unit: "inches" },
  { name: 'Postcard (4" x 6")', width: 4, height: 6, unit: "inches" },
  { name: 'Banner (36" x 72")', width: 36, height: 72, unit: "inches" },
];

export default function SpecificationsStep({
  formData,
  updateFormData,
  availablePaperTypes,
  availablePaperWeights,
  availableFinishingOptions,
  finishingOptionPrices,
  setFinishingOptionPrices,
  paperSizesData,
}: SpecificationsStepProps) {
  const [activeFinishingTab, setActiveFinishingTab] = useState("coating");

  // Group finishing options by category
  const finishingCategories = availableFinishingOptions.reduce(
    (acc, option) => {
      const category = option.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    },
    {} as Record<string, FinishOption[]>,
  );

  // Category metadata with icons and labels
  const categoryInfo: Record<
    string,
    { label: string; icon: LucideIcon; description: string }
  > = {
    coating: {
      label: "Coating & Protection",
      icon: Layers,
      description: "Protective coatings and lamination",
    },
    cutting: {
      label: "Cutting & Shaping",
      icon: Scissors,
      description: "Die cutting, trimming, and shaping",
    },
    binding: {
      label: "Binding",
      icon: Grip,
      description: "Spiral, perfect, and other binding options",
    },
    finishing: {
      label: "General Finishing",
      icon: Settings,
      description: "Folding, scoring, and general finishing",
    },
    texture: {
      label: "Texture & Effects",
      icon: Sparkles,
      description: "Embossing and textural effects",
    },
    special: {
      label: "Special Effects",
      icon: Zap,
      description: "Foil stamping and premium effects",
    },
    other: {
      label: "Other Options",
      icon: Package,
      description: "Additional finishing services",
    },
  };

  // Get available categories (only those with options)
  const availableCategories = Object.keys(finishingCategories).sort();

  // Set first available category as default if current tab doesn't exist
  React.useEffect(() => {
    if (
      availableCategories.length > 0 &&
      !availableCategories.includes(activeFinishingTab)
    ) {
      setActiveFinishingTab(availableCategories[0]);
    }
  }, [availableCategories, activeFinishingTab]);

  const handleFinishingOptionChange = (
    optionId: string,
    checked: boolean,
    defaultPrice: number,
  ) => {
    const updatedOptions = checked
      ? [...formData.finishing_options, optionId]
      : formData.finishing_options.filter((id) => id !== optionId);

    updateFormData("finishing_options", updatedOptions);

    // Update prices
    if (checked) {
      setFinishingOptionPrices({
        ...finishingOptionPrices,
        [optionId]: defaultPrice,
      });
    } else {
      const newPrices = { ...finishingOptionPrices };
      delete newPrices[optionId];
      setFinishingOptionPrices(newPrices);
    }
  };

  const totalFinishingCost = formData.finishing_options.reduce(
    (total, optionId) => {
      return total + (finishingOptionPrices[optionId] || 0);
    },
    0,
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Specifications</h2>
        <p className="text-gray-600">
          Configure size, paper, and finishing options
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Size Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Size Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Size Type</Label>
              <Select
                value={formData.size_type}
                onValueChange={(value: "standard" | "custom") =>
                  updateFormData("size_type", value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Size</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.size_type === "standard" ? (
              <div>
                <Label htmlFor="size_preset">Standard Size</Label>
                <Select
                  value={formData.size_preset}
                  onValueChange={(value) =>
                    updateFormData("size_preset", value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select size..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(paperSizesData || sizePresets).map((size) => (
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
                    onChange={(e) =>
                      updateFormData(
                        "custom_width",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="mt-2"
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
                    onChange={(e) =>
                      updateFormData(
                        "custom_height",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="custom_unit">Unit</Label>
                  <Select
                    value={formData.custom_unit}
                    onValueChange={(value: "inches" | "cm" | "mm") =>
                      updateFormData("custom_unit", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
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
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Paper Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paper_type">Paper Type *</Label>
                <Select
                  value={formData.paper_type}
                  onValueChange={(value) => updateFormData("paper_type", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select paper type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaperTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paper_weight">Paper Weight (GSM) *</Label>
                <Select
                  value={formData.paper_weight.toString()}
                  onValueChange={(value) =>
                    updateFormData("paper_weight", parseInt(value))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select weight..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaperWeights.map((weight) => (
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Finishing Options
            </CardTitle>
            <p className="text-sm text-gray-600">
              Choose professional finishing services to enhance your print
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {availableCategories.length > 0 ? (
              <Tabs
                value={activeFinishingTab}
                onValueChange={setActiveFinishingTab}
                className="w-full"
              >
                {/* Enhanced Tab Navigation */}
                <div className="relative">
                  <TabsList className="w-full h-auto p-1 bg-gray-100 rounded-xl grid grid-flow-col auto-cols-fr gap-1">
                    {availableCategories.map((category) => {
                      const info = categoryInfo[category];
                      const Icon = info?.icon || Package;
                      const selectedInCategory =
                        finishingCategories[category]?.filter((option) =>
                          formData.finishing_options.includes(option.id),
                        ).length || 0;

                      return (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="relative flex flex-col items-center gap-1.5 h-auto py-3 px-2 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-gray-50 hover:scale-102 group"
                          style={{
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        >
                          <div className="relative">
                            <Icon className="h-5 w-5 text-gray-600 group-data-[state=active]:text-blue-600 group-hover:scale-110 transition-all duration-300" />
                            {selectedInCategory > 0 && (
                              <div className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                                {selectedInCategory}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-data-[state=active]:text-blue-700 text-center leading-tight">
                            {info?.label || category}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {/* Enhanced Tab Content */}
                {availableCategories.map((category) => (
                  <TabsContent
                    key={category}
                    value={category}
                    className="mt-6 space-y-4"
                  >
                    {/* Category Header */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                      {React.createElement(
                        categoryInfo[category]?.icon || Package,
                        {
                          className:
                            "h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse",
                        },
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {categoryInfo[category]?.label || category}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {categoryInfo[category]?.description ||
                            "Additional finishing options"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            {finishingCategories[category]?.length || 0} options
                            available
                          </span>
                          {finishingCategories[category]?.filter((option) =>
                            formData.finishing_options.includes(option.id),
                          ).length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                              {
                                finishingCategories[category]?.filter(
                                  (option) =>
                                    formData.finishing_options.includes(
                                      option.id,
                                    ),
                                ).length
                              }{" "}
                              selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {finishingCategories[category]?.map((option) => {
                        const isSelected = formData.finishing_options.includes(
                          option.id,
                        );
                        const customPrice = finishingOptionPrices[option.id];
                        const defaultPrice =
                          typeof option.pricing === 'object' && option.pricing !== null && 'base' in option.pricing && typeof (option.pricing as Record<string, unknown>).base === "number"
                            ? (option.pricing as Record<string, number>).base
                            : Number(typeof option.pricing === 'object' && option.pricing !== null && 'base' in option.pricing ? (option.pricing as Record<string, unknown>).base : 0) || 0;
                        const finalPrice = customPrice || defaultPrice;

                        return (
                          <div
                            key={option.id}
                            className={`relative group border-2 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                              isSelected
                                ? "border-blue-200 bg-blue-50 shadow-md ring-2 ring-blue-100"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                            style={{
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onClick={() => {
                              const checkbox = document.getElementById(
                                `finishing-${option.id}`,
                              ) as HTMLInputElement;
                              if (checkbox) {
                                checkbox.click();
                                // Add selection animation
                                const card = document.getElementById(
                                  `card-${option.id}`,
                                );
                                if (card) {
                                  card.style.animation = "none";
                                  setTimeout(() => {
                                    card.style.animation =
                                      "selectionPulse 0.6s ease-out";
                                  }, 10);
                                }
                              }
                            }}
                            id={`card-${option.id}`}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 animate-in">
                                <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                                  <svg
                                    className="h-3.5 w-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}

                            {/* Checkbox (hidden but functional) */}
                            <input
                              type="checkbox"
                              id={`finishing-${option.id}`}
                              checked={isSelected}
                              onChange={(e) =>
                                handleFinishingOptionChange(
                                  option.id,
                                  e.target.checked,
                                  defaultPrice,
                                )
                              }
                              className="sr-only"
                              suppressHydrationWarning={true}
                            />

                            {/* Option Content */}
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-base font-semibold text-gray-900 mb-1">
                                  {option.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    Starting at
                                  </span>
                                  <span className="text-lg font-bold text-blue-600">
                                    ${defaultPrice.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    per unit
                                  </span>
                                  {customPrice !== undefined &&
                                    customPrice !== defaultPrice && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        Custom: ${customPrice.toFixed(2)}
                                      </span>
                                    )}
                                </div>
                              </div>

                              {/* Custom Price Input */}
                              {isSelected && (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                                  <div>
                                    <Label
                                      htmlFor={`price-${option.id}`}
                                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                                    >
                                      <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                                      Custom Price (optional)
                                      {customPrice === 0 && (
                                        <span className="text-xs text-green-600 font-medium">
                                          • Free service
                                        </span>
                                      )}
                                    </Label>
                                    <div className="mt-2 relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                                        $
                                      </span>
                                      <Input
                                        id={`price-${option.id}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={defaultPrice.toFixed(2)}
                                        value={
                                          customPrice !== undefined
                                            ? customPrice.toString()
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const inputValue = e.target.value;
                                          // Allow empty string or valid numbers including 0
                                          if (inputValue === "") {
                                            const newPrices = {
                                              ...finishingOptionPrices,
                                            };
                                            delete newPrices[option.id];
                                            setFinishingOptionPrices(newPrices);
                                          } else {
                                            const value =
                                              parseFloat(inputValue);
                                            if (!isNaN(value) && value >= 0) {
                                              setFinishingOptionPrices({
                                                ...finishingOptionPrices,
                                                [option.id]: value,
                                              });
                                            }
                                          }
                                        }}
                                        className="pl-7 h-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-sm text-gray-600 flex items-center gap-2">
                                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
                                      Total for {formData.quantity} units:
                                    </span>
                                    <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                                      <span className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></span>
                                      {finalPrice === 0
                                        ? "Free"
                                        : `$${(finalPrice * formData.quantity).toFixed(2)}`}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Empty State */}
                    {!finishingCategories[category] ||
                      (finishingCategories[category].length === 0 && (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">
                            No options available in this category
                          </p>
                        </div>
                      ))}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  No finishing options available
                </p>
                <p className="text-sm text-gray-400">
                  Finishing options depend on the selected service
                </p>
              </div>
            )}

            {/* Enhanced Summary */}
            {formData.finishing_options.length > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 animate-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <div className="absolute inset-0 h-5 w-5 text-green-600 animate-pulse opacity-75">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Selected Finishing Services
                  </h4>
                  <div className="ml-auto">
                    <div className="h-8 w-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {formData.finishing_options.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.finishing_options.map((optionId, index) => {
                    const option = availableFinishingOptions.find(
                      (o) => o.id === optionId,
                    );
                    const price =
                      finishingOptionPrices[optionId] ||
                      (typeof option?.pricing === 'object' && option?.pricing !== null && 'base' in option?.pricing && typeof (option?.pricing as Record<string, unknown>).base === "number"
                        ? (option?.pricing as Record<string, number>).base
                        : Number(typeof option?.pricing === 'object' && option?.pricing !== null && 'base' in option?.pricing ? (option?.pricing as Record<string, unknown>).base : 0) || 0);
                    const categoryLabel =
                      categoryInfo[option?.category || "other"]?.label ||
                      option?.category;
                    const CategoryIcon =
                      categoryInfo[option?.category || "other"]?.icon ||
                      Package;

                    return (
                      <div
                        key={optionId}
                        className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {option?.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {categoryLabel}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
                                {price === 0
                                  ? "Free service"
                                  : `$${price.toFixed(2)} × ${formData.quantity}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            {price === 0
                              ? "Free"
                              : `$${(price * formData.quantity).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t-2 border-green-200 pt-4 flex items-center justify-between bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="text-lg font-semibold text-gray-900">
                        Total Finishing Cost:
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 flex items-center gap-2">
                      <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                      ${(totalFinishingCost * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specifications Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                {formData.size_type === "standard" ? (
                  <Badge variant="outline">
                    {formData.size_preset || "Not selected"}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {formData.custom_width} x {formData.custom_height}{" "}
                    {formData.custom_unit}
                  </Badge>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Paper</h4>
                <div className="space-y-1">
                  <Badge variant="outline">
                    {formData.paper_type || "Not selected"}
                  </Badge>
                  <Badge variant="outline">{formData.paper_weight} GSM</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Finishing</h4>
                <div className="space-y-1">
                  {formData.finishing_options.length > 0 ? (
                    formData.finishing_options.map((optionId) => {
                      const option = availableFinishingOptions.find(
                        (o) => o.id === optionId,
                      );
                      return (
                        <Badge key={optionId} variant="outline">
                          {option?.name}
                        </Badge>
                      );
                    })
                  ) : (
                    <Badge variant="outline">None selected</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
