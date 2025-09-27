import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/lib/database.types";

type PaperSize = Database["public"]["Tables"]["paper_sizes"]["Row"];
type PaperWeight = Database["public"]["Tables"]["paper_weights"]["Row"];
type PaperType = Database["public"]["Tables"]["paper_types"]["Row"];
type FinishOption = Database["public"]["Tables"]["finish_options"]["Row"];

// Fallback data for when tables don't exist yet
const fallbackPaperSizes: PaperSize[] = [
  {
    id: "1",
    name: "A0",
    width_inches: 33.11,
    height_inches: 46.81,
    width_mm: 33.11 * 25.4,
    height_mm: 46.81 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Technical drawings", "Posters"],
    description: "Largest standard paper size in A series",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "A1",
    width_inches: 23.39,
    height_inches: 33.11,
    width_mm: 23.39 * 25.4,
    height_mm: 33.11 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Posters", "Charts"],
    description: "Half the size of A0",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "A2",
    width_inches: 16.54,
    height_inches: 23.39,
    width_mm: 16.54 * 25.4,
    height_mm: 23.39 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Drawings", "Magazines"],
    description: "Half the size of A1",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "A3",
    width_inches: 11.69,
    height_inches: 16.54,
    width_mm: 11.69 * 25.4,
    height_mm: 16.54 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Drawings", "Presentations"],
    description: "Half the size of A2",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "A4",
    width_inches: 8.27,
    height_inches: 11.69,
    width_mm: 8.27 * 25.4,
    height_mm: 11.69 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Documents", "Letters"],
    description: "Most common office paper size",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "A5",
    width_inches: 5.83,
    height_inches: 8.27,
    width_mm: 5.83 * 25.4,
    height_mm: 8.27 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Notebooks", "Booklets"],
    description: "Half the size of A4",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "A6",
    width_inches: 4.13,
    height_inches: 5.83,
    width_mm: 4.13 * 25.4,
    height_mm: 5.83 * 25.4,
    category: "standard",
    series: "A Series",
    common_uses: ["Postcards", "Small booklets"],
    description: "Half the size of A5",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Custom",
    width_inches: 0,
    height_inches: 0,
    width_mm: 0,
    height_mm: 0,
    category: "custom",
    series: "Custom",
    common_uses: ["Custom sizes"],
    description: "Custom paper size",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const fallbackPaperWeights: PaperWeight[] = [
  {
    id: "1",
    name: "80 GSM",
    gsm: 80,
    category: "Standard",
    common_uses: ["Office printing", "Documents"],
    description: "Standard office paper",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 90,
    thickness_mm: 0.1,
  },
  {
    id: "2",
    name: "100 GSM",
    gsm: 100,
    category: "Standard",
    common_uses: ["Documents", "Reports"],
    description: "Slightly thicker than 80 GSM",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 92,
    thickness_mm: 0.12,
  },
  {
    id: "3",
    name: "120 GSM",
    gsm: 120,
    category: "Standard",
    common_uses: ["Presentations", "Brochures"],
    description: "Good for professional documents",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 94,
    thickness_mm: 0.14,
  },
  {
    id: "4",
    name: "150 GSM",
    gsm: 150,
    category: "Heavy",
    common_uses: ["Brochures", "Flyers"],
    description: "Heavy paper for marketing materials",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 96,
    thickness_mm: 0.17,
  },
  {
    id: "5",
    name: "200 GSM",
    gsm: 200,
    category: "Card",
    common_uses: ["Postcards", "Business cards"],
    description: "Cardstock thickness",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 98,
    thickness_mm: 0.22,
  },
  {
    id: "6",
    name: "250 GSM",
    gsm: 250,
    category: "Card",
    common_uses: ["Greeting cards", "Invitations"],
    description: "Thick cardstock",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 99,
    thickness_mm: 0.27,
  },
  {
    id: "7",
    name: "300 GSM",
    gsm: 300,
    category: "Card",
    common_uses: ["Posters", "Art prints"],
    description: "Very thick cardstock",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 100,
    thickness_mm: 0.32,
  },
  {
    id: "8",
    name: "350 GSM",
    gsm: 350,
    category: "Card",
    common_uses: ["Art prints", "High-quality cards"],
    description: "Extra thick cardstock",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    opacity_percent: 100,
    thickness_mm: 0.37,
  },
];

const fallbackPaperTypes: PaperType[] = [
  {
    id: "1",
    name: "Copy Paper",
    description: "Standard office copy paper",
    category: "Standard",
    common_uses: ["Office printing", "Documents"],
    grain_direction: "short",
    finish: "matte",
    compatible_weights: [80, 100, 120],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Premium Paper",
    description: "High-quality white paper",
    category: "Premium",
    common_uses: ["Presentations", "Reports"],
    grain_direction: "short",
    finish: "smooth",
    compatible_weights: [100, 120, 150],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Glossy Paper",
    description: "Glossy coated paper for photos",
    category: "Coated",
    common_uses: ["Photography", "Brochures"],
    grain_direction: "short",
    finish: "glossy",
    compatible_weights: [150, 200, 250],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Matte Paper",
    description: "Matte coated paper",
    category: "Coated",
    common_uses: ["Presentations", "Art prints"],
    grain_direction: "short",
    finish: "matte",
    compatible_weights: [150, 200, 250],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Cardstock",
    description: "Thick paper for cards",
    category: "Card",
    common_uses: ["Business cards", "Postcards"],
    grain_direction: "short",
    finish: "smooth",
    compatible_weights: [250, 300, 350],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const fallbackFinishOptions: FinishOption[] = [
  {
    id: "none",
    name: "No Finishing",
    category: "basic",
    pricing: { base: 0 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lamination",
    name: "Lamination",
    category: "coating",
    pricing: { base: 0.5 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "uv_coating",
    name: "UV Coating",
    category: "coating",
    pricing: { base: 0.75 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "embossing",
    name: "Embossing",
    category: "texture",
    pricing: { base: 1.0 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "foil_stamping",
    name: "Foil Stamping",
    category: "special",
    pricing: { base: 1.25 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "die_cutting",
    name: "Die Cutting",
    category: "cutting",
    pricing: { base: 0.8 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "folding",
    name: "Folding",
    category: "finishing",
    pricing: { base: 0.25 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "binding_spiral",
    name: "Spiral Binding",
    category: "binding",
    pricing: { base: 2.0 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "binding_perfect",
    name: "Perfect Binding",
    category: "binding",
    pricing: { base: 3.0 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "trimming",
    name: "Trimming",
    category: "cutting",
    pricing: { base: 0.15 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "hole_punching",
    name: "Hole Punching",
    category: "finishing",
    pricing: { base: 0.1 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "score_crease",
    name: "Scoring/Creasing",
    category: "finishing",
    pricing: { base: 0.2 },
    parameters: null,
    appliesTo: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Fetcher functions with fallback
const fetchPaperSizes = async (): Promise<PaperSize[]> => {
  try {
    // Fetch paper sizes with proper typing
    const { data, error } = await supabase
      .from("paper_sizes")
      .select("*")
      .order("name");

    if (error) {
      return fallbackPaperSizes;
    }

    if (data && data.length > 0) {
      return data;
    } else {
      return fallbackPaperSizes;
    }
  } catch {
    return fallbackPaperSizes;
  }
};

const fetchPaperWeights = async (): Promise<PaperWeight[]> => {
  try {
    // Fetch paper weights with proper typing
    const { data, error } = await supabase
      .from("paper_weights")
      .select("*")
      .order("weight_gsm");

    if (error) {
      return fallbackPaperWeights;
    }

    if (data && data.length > 0) {
      return data;
    } else {
      return fallbackPaperWeights;
    }
  } catch {
    return fallbackPaperWeights;
  }
};

const fetchPaperTypes = async (): Promise<PaperType[]> => {
  try {
    // Fetch paper types with proper typing
    const { data, error } = await supabase
      .from("paper_types")
      .select("*")
      .order("name");

    if (error) {
      return fallbackPaperTypes;
    }

    if (data && data.length > 0) {
      return data;
    } else {
      return fallbackPaperTypes;
    }
  } catch {
    return fallbackPaperTypes;
  }
};

const fetchFinishOptions = async (): Promise<FinishOption[]> => {
  try {
    const { data, error } = await supabase
      .from("finish_options")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) throw error;

    // Transform the data to match our interface
    const transformedData =
      data?.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        pricing: item.pricing as Record<string, number | string> | null,
        parameters: item.parameters as Record<
          string,
          string | number | boolean
        > | null,
        appliesTo: item.appliesTo as Record<string, boolean | string[]> | null,
        active: item.active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) || [];

    return transformedData.length > 0 ? transformedData : fallbackFinishOptions;
  } catch {
    return fallbackFinishOptions;
  }
};

// Hooks
export const usePaperSizes = () => {
  const { user, session } = useAuth();

  return useSWR(user && session ? "paper-sizes" : null, fetchPaperSizes, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
    errorRetryCount: 3,
    fallbackData: fallbackPaperSizes,
  });
};

export const usePaperWeights = () => {
  const { user, session } = useAuth();

  return useSWR(user && session ? "paper-weights" : null, fetchPaperWeights, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
    fallbackData: fallbackPaperWeights,
  });
};

export const usePaperTypes = () => {
  const { user, session } = useAuth();

  return useSWR(user && session ? "paper-types" : null, fetchPaperTypes, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
    fallbackData: fallbackPaperTypes,
  });
};

export const useFinishOptions = () => {
  const { user, session } = useAuth();

  return useSWR(user && session ? "finish-options" : null, fetchFinishOptions, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
    fallbackData: fallbackFinishOptions,
  });
};

// Combined hook for all paper specifications
export const usePaperSpecifications = () => {
  const paperSizes = usePaperSizes();
  const paperWeights = usePaperWeights();
  const paperTypes = usePaperTypes();
  const finishOptions = useFinishOptions();

  return {
    paperSizes,
    paperWeights,
    paperTypes,
    finishOptions,
    isLoading:
      paperSizes.isLoading ||
      paperWeights.isLoading ||
      paperTypes.isLoading ||
      finishOptions.isLoading,
    error:
      paperSizes.error ||
      paperWeights.error ||
      paperTypes.error ||
      finishOptions.error,
  };
};
