"use client";

import React from "react";
import { useJobSubmissionForm } from "@/lib/hooks/useJobSubmissionForm";
import { useFileUploadFixed } from "@/lib/hooks/useFileUploadFixed";
import { useJobSubmission } from "@/lib/hooks/useJobSubmission";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  FileText,
  Settings,
  Upload,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

// Import step components
import CustomerStep from "./components/CustomerStep.tsx";
import JobDetailsStep from "./components/JobDetailsStep.tsx";
import SpecificationsStep from "./components/SpecificationsStep.tsx";
import FilesStep from "./components/FilesStep.tsx";
import ReviewStep from "./components/ReviewStep.tsx";

const formSteps = [
  {
    id: "customer",
    title: "Customer",
    icon: User,
    description: "Select or add customer",
  },
  {
    id: "details",
    title: "Job Details",
    icon: FileText,
    description: "Basic job information",
  },
  {
    id: "specifications",
    title: "Specifications",
    icon: Settings,
    description: "Size, paper & finishing",
  },
  {
    id: "files",
    title: "Files",
    icon: Upload,
    description: "Upload attachments",
  },
  {
    id: "review",
    title: "Review",
    icon: CheckCircle2,
    description: "Final review & submit",
  },
];

export default function SubmitJobPage() {
  const formHook = useJobSubmissionForm();
  const fileHook = useFileUploadFixed();
  const submissionHook = useJobSubmission();

  const {
    currentStep,
    validateCurrentStep,
    nextStep,
    prevStep,
    formData,
    estimatedPrice,
    finishingOptionPrices,
  } = formHook;

  const { uploadFiles } = fileHook;
  const { submitJob, isSubmitting } = submissionHook;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate job ID first for consistent file organization
      const jobId = crypto.randomUUID();

      // Upload files first if any, using the actual job ID
      const uploadedFileRecords =
        fileHook.fileUploads.length > 0 ? await uploadFiles(jobId) : [];

      // Submit the job with the same ID
      await submitJob(
        formData,
        estimatedPrice,
        finishingOptionPrices,
        uploadedFileRecords,
        jobId,
      );

      // Clear files after successful submission
      fileHook.clearFiles();
    } catch (error) {
      console.error("Submission failed:", {
        message: error instanceof Error ? error.message : "Unknown error",
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        errorString: String(error),
      });
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
        return (
          <ReviewStep
            {...formHook}
            {...fileHook}
            estimatedPrice={estimatedPrice}
          />
        );
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Submit New Job
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a comprehensive printing job request with our step-by-step
              form
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
                    <div
                      className={`flex items-center space-x-3 ${
                        index < formSteps.length - 1 ? "mr-4" : ""
                      }`}
                    >
                      <div
                        className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                        ${isActive ? "bg-blue-600 border-blue-600 text-white" : ""}
                        ${isCompleted ? "bg-green-600 border-green-600 text-white" : ""}
                        ${!isActive && !isCompleted ? "bg-gray-100 border-gray-300 text-gray-500" : ""}
                      `}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="hidden md:block">
                        <p
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-blue-600"
                              : isCompleted
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {step.description}
                        </p>
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
            <div className="min-h-[500px]">{renderStepContent()}</div>

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
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStep ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      index < currentStep
                        ? "text-green-500"
                        : index === currentStep
                          ? "text-blue-500"
                          : "text-gray-400"
                    }`}
                  >
                    {index < currentStep
                      ? "✓ Complete"
                      : index === currentStep
                        ? "In Progress"
                        : "Pending"}
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
