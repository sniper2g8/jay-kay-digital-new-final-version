import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database-generated.types";

type JobSpecification = Database["public"]["Tables"]["job_specifications"]["Row"];
type PaperSize = Database["public"]["Tables"]["paper_sizes"]["Row"];
type PaperWeight = Database["public"]["Tables"]["paper_weights"]["Row"];
type PaperType = Database["public"]["Tables"]["paper_types"]["Row"];
type FinishOption = Database["public"]["Tables"]["finish_options"]["Row"];

export function useJobSpecifications(jobId: string) {
  return useSWR<JobSpecification | null>(
    jobId ? ["job-specifications", jobId] : null,
    async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from("job_specifications")
        .select("*")
        .eq("job_id", jobId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    }
  );
}

export function usePaperSizes() {
  return useSWR<PaperSize[]>(
    "paper-sizes",
    async () => {
      const { data, error } = await supabase
        .from("paper_sizes")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    }
  );
}

export function usePaperWeights() {
  return useSWR<PaperWeight[]>(
    "paper-weights",
    async () => {
      const { data, error } = await supabase
        .from("paper_weights")
        .select("*")
        .order("gsm");

      if (error) throw error;
      return data || [];
    }
  );
}

export function usePaperTypes() {
  return useSWR<PaperType[]>(
    "paper-types",
    async () => {
      const { data, error } = await supabase
        .from("paper_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    }
  );
}

export function useFinishOptions() {
  return useSWR<FinishOption[]>(
    "finish-options",
    async () => {
      try {
        const { data, error } = await supabase
          .from("finish_options")
          .select("*")
          .order("name");

        if (error) {
          // If we can't access finish_options due to permissions, return empty array
          console.warn("Could not access finish_options table:", error.message);
          return [];
        }
        
        return data || [];
      } catch (error) {
        // If there's any other error, return empty array
        console.warn("Error fetching finish options:", error);
        return [];
      }
    }
  );
}