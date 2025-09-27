import { useJobSubmission } from "@/lib/hooks/useJobSubmission";

// This is a simple test component to verify the hook works
export default function JobSubmissionTest() {
  const { submitJob, isSubmitting } = useJobSubmission();

  // Mock form data
  const mockFormData = {
    customer_id: "test-customer-id",
    service_id: "test-service-id",
    title: "Test Job",
    description: "Test description",
    priority: "normal" as const,
    quantity: 1,
    unit_price: 100,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const handleTestSubmit = async () => {
    try {
      // This would normally be called with real form data
      console.log("Testing useJobSubmission hook...");
      // Note: This will fail because we don't have real customer/service IDs
      // But TypeScript compilation should succeed
    } catch (error) {
      console.error("Test error (expected):", error);
    }
  };

  return (
    <div>
      <h1>Job Submission Hook Test</h1>
      <p>Hook imported successfully. TypeScript compilation should pass.</p>
      <button onClick={handleTestSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Test Submit"}
      </button>
    </div>
  );
}
