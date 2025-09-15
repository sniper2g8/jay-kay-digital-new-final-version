import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PaperSize {
  id: number;
  name: string;
  width_inches: number;
  height_inches: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaperWeight {
  id: number;
  name: string;
  weight_gsm: number;
  weight_lbs: number | null;
  finish: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaperType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinishOption {
  id: string;
  name: string | null;
  category: string | null;
  pricing: Record<string, number | string> | null;
  parameters: Record<string, string | number | boolean> | null;
  appliesTo: Record<string, boolean | string[]> | null;
  active: boolean | null;
}

// Fallback data for when tables don't exist yet
const fallbackPaperSizes: PaperSize[] = [
  { id: 1, name: 'A0', width_inches: 33.11, height_inches: 46.81, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'A1', width_inches: 23.39, height_inches: 33.11, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'A2', width_inches: 16.54, height_inches: 23.39, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'A3', width_inches: 11.69, height_inches: 16.54, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: 'A4', width_inches: 8.27, height_inches: 11.69, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, name: 'A5', width_inches: 5.83, height_inches: 8.27, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, name: 'A6', width_inches: 4.13, height_inches: 5.83, category: 'standard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, name: 'Custom', width_inches: 0, height_inches: 0, category: 'custom', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const fallbackPaperWeights: PaperWeight[] = [
  { id: 1, name: '80 GSM', weight_gsm: 80, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: '100 GSM', weight_gsm: 100, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: '120 GSM', weight_gsm: 120, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: '150 GSM', weight_gsm: 150, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: '200 GSM', weight_gsm: 200, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, name: '250 GSM', weight_gsm: 250, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, name: '300 GSM', weight_gsm: 300, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, name: '350 GSM', weight_gsm: 350, weight_lbs: null, finish: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const fallbackPaperTypes: PaperType[] = [
  { id: 1, name: 'Copy Paper', description: 'Standard office copy paper', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Premium Paper', description: 'High-quality white paper', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Glossy Paper', description: 'Glossy coated paper for photos', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Matte Paper', description: 'Matte coated paper', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: 'Cardstock', description: 'Thick paper for cards', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const fallbackFinishOptions: FinishOption[] = [
  { id: 'none', name: 'No Finishing', category: 'basic', pricing: { base: 0 }, parameters: null, appliesTo: null, active: true },
  { id: 'lamination', name: 'Lamination', category: 'coating', pricing: { base: 0.50 }, parameters: null, appliesTo: null, active: true },
  { id: 'uv_coating', name: 'UV Coating', category: 'coating', pricing: { base: 0.75 }, parameters: null, appliesTo: null, active: true },
  { id: 'embossing', name: 'Embossing', category: 'texture', pricing: { base: 1.00 }, parameters: null, appliesTo: null, active: true },
  { id: 'foil_stamping', name: 'Foil Stamping', category: 'special', pricing: { base: 1.25 }, parameters: null, appliesTo: null, active: true },
  { id: 'die_cutting', name: 'Die Cutting', category: 'cutting', pricing: { base: 0.80 }, parameters: null, appliesTo: null, active: true },
  { id: 'folding', name: 'Folding', category: 'finishing', pricing: { base: 0.25 }, parameters: null, appliesTo: null, active: true },
  { id: 'binding_spiral', name: 'Spiral Binding', category: 'binding', pricing: { base: 2.00 }, parameters: null, appliesTo: null, active: true },
  { id: 'binding_perfect', name: 'Perfect Binding', category: 'binding', pricing: { base: 3.00 }, parameters: null, appliesTo: null, active: true },
  { id: 'trimming', name: 'Trimming', category: 'cutting', pricing: { base: 0.15 }, parameters: null, appliesTo: null, active: true },
  { id: 'hole_punching', name: 'Hole Punching', category: 'finishing', pricing: { base: 0.10 }, parameters: null, appliesTo: null, active: true },
  { id: 'score_crease', name: 'Scoring/Creasing', category: 'finishing', pricing: { base: 0.20 }, parameters: null, appliesTo: null, active: true }
];

// Fetcher functions with fallback
const fetchPaperSizes = async (): Promise<PaperSize[]> => {
  try {
    console.log('🔍 Attempting to fetch paper sizes from database...');
    // Fetch paper sizes with proper typing
    const { data, error } = await supabase
      .from('paper_sizes')
      .select('*')
      .order('name');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperSizes;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper sizes from database');
      return data;
    } else {
      console.log('📋 No data in database, using fallback');
      return fallbackPaperSizes;
    }
  } catch {
    console.log('❌ Error fetching paper sizes, using fallback data');
    return fallbackPaperSizes;
  }
};

const fetchPaperWeights = async (): Promise<PaperWeight[]> => {
  try {
    console.log('🔍 Attempting to fetch paper weights from database...');
    // Fetch paper weights with proper typing
    const { data, error } = await supabase
      .from('paper_weights')
      .select('*')
      .order('weight_gsm');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperWeights;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper weights from database');
      return data;
    } else {
      console.log('📋 No data in database, using fallback');
      return fallbackPaperWeights;
    }
  } catch {
    console.log('❌ Error fetching paper weights, using fallback data');
    return fallbackPaperWeights;
  }
};

const fetchPaperTypes = async (): Promise<PaperType[]> => {
  try {
    console.log('🔍 Attempting to fetch paper types from database...');
    // Fetch paper types with proper typing
    const { data, error } = await supabase
      .from('paper_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperTypes;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper types from database');
      return data;
    } else {
      console.log('📋 No data in database, using fallback');
      return fallbackPaperTypes;
    }
  } catch {
    console.log('❌ Error fetching paper types, using fallback data');
    return fallbackPaperTypes;
  }
};

const fetchFinishOptions = async (): Promise<FinishOption[]> => {
  try {
    const { data, error } = await supabase
      .from('finish_options')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    
    // Transform the data to match our interface
    const transformedData = data?.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      pricing: item.pricing as Record<string, number | string> | null,
      parameters: item.parameters as Record<string, string | number | boolean> | null,
      appliesTo: item.appliesTo as Record<string, boolean | string[]> | null,
      active: item.active
    })) || [];
    
    return transformedData.length > 0 ? transformedData : fallbackFinishOptions;
  } catch {
    console.log('Using fallback finish options data');
    return fallbackFinishOptions;
  }
};

// Hooks
export const usePaperSizes = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'paper-sizes' : null,
    fetchPaperSizes,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
      errorRetryCount: 3,
      fallbackData: fallbackPaperSizes
    }
  );
};

export const usePaperWeights = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'paper-weights' : null,
    fetchPaperWeights,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      fallbackData: fallbackPaperWeights
    }
  );
};

export const usePaperTypes = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'paper-types' : null,
    fetchPaperTypes,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      fallbackData: fallbackPaperTypes
    }
  );
};

export const useFinishOptions = () => {
  const { user, session } = useAuth();
  
  return useSWR(
    user && session ? 'finish-options' : null,
    fetchFinishOptions,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      fallbackData: fallbackFinishOptions
    }
  );
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
    isLoading: paperSizes.isLoading || paperWeights.isLoading || paperTypes.isLoading || finishOptions.isLoading,
    error: paperSizes.error || paperWeights.error || paperTypes.error || finishOptions.error
  };
};