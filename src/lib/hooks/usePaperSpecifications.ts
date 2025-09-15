import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PaperSize {
  id: string;
  name: string;
  series: string;
  width_mm: number;
  height_mm: number;
  width_inches: number;
  height_inches: number;
  category: string;
  description: string | null;
  common_uses: string[] | null;
  active: boolean;
}

export interface PaperWeight {
  id: string;
  gsm: number;
  name: string;
  category: string;
  description: string | null;
  common_uses: string[] | null;
  thickness_mm: number | null;
  opacity_percent: number | null;
  active: boolean;
}

export interface PaperType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  finish: string | null;
  compatible_weights: number[] | null;
  common_uses: string[] | null;
  active: boolean;
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
  { id: 'a0', name: 'A0', series: 'A', width_mm: 841, height_mm: 1189, width_inches: 33.11, height_inches: 46.81, category: 'standard', description: 'Largest standard A-series format', common_uses: ['Posters', 'Large format printing'], active: true },
  { id: 'a1', name: 'A1', series: 'A', width_mm: 594, height_mm: 841, width_inches: 23.39, height_inches: 33.11, category: 'standard', description: 'Large format poster size', common_uses: ['Posters', 'Flip charts'], active: true },
  { id: 'a2', name: 'A2', series: 'A', width_mm: 420, height_mm: 594, width_inches: 16.54, height_inches: 23.39, category: 'standard', description: 'Medium poster size', common_uses: ['Small posters', 'Drawings'], active: true },
  { id: 'a3', name: 'A3', series: 'A', width_mm: 297, height_mm: 420, width_inches: 11.69, height_inches: 16.54, category: 'standard', description: 'Tabloid size', common_uses: ['Drawings', 'Diagrams'], active: true },
  { id: 'a4', name: 'A4', series: 'A', width_mm: 210, height_mm: 297, width_inches: 8.27, height_inches: 11.69, category: 'standard', description: 'Standard letter size', common_uses: ['Letters', 'Documents', 'Flyers'], active: true },
  { id: 'a5', name: 'A5', series: 'A', width_mm: 148, height_mm: 210, width_inches: 5.83, height_inches: 8.27, category: 'standard', description: 'Half letter size', common_uses: ['Greeting cards', 'Small flyers'], active: true },
  { id: 'a6', name: 'A6', series: 'A', width_mm: 105, height_mm: 148, width_inches: 4.13, height_inches: 5.83, category: 'standard', description: 'Postcard size', common_uses: ['Postcards', 'Business cards'], active: true },
  { id: 'custom', name: 'Custom', series: 'CUSTOM', width_mm: 0, height_mm: 0, width_inches: 0, height_inches: 0, category: 'custom', description: 'Custom dimensions', common_uses: ['Special projects'], active: true }
];

const fallbackPaperWeights: PaperWeight[] = [
  { id: '80gsm', gsm: 80, name: '80 GSM', category: 'standard', description: 'Standard copy paper', common_uses: ['Office documents'], thickness_mm: 0.10, opacity_percent: 90, active: true },
  { id: '100gsm', gsm: 100, name: '100 GSM', category: 'standard', description: 'Premium copy paper', common_uses: ['Letterheads'], thickness_mm: 0.12, opacity_percent: 94, active: true },
  { id: '120gsm', gsm: 120, name: '120 GSM', category: 'standard', description: 'Light cardstock', common_uses: ['Brochures', 'Flyers'], thickness_mm: 0.15, opacity_percent: 96, active: true },
  { id: '150gsm', gsm: 150, name: '150 GSM', category: 'heavyweight', description: 'Medium cardstock', common_uses: ['Business cards'], thickness_mm: 0.18, opacity_percent: 98, active: true },
  { id: '200gsm', gsm: 200, name: '200 GSM', category: 'heavyweight', description: 'Heavy cardstock', common_uses: ['Business cards', 'Covers'], thickness_mm: 0.24, opacity_percent: 99, active: true },
  { id: '250gsm', gsm: 250, name: '250 GSM', category: 'cardstock', description: 'Premium cardstock', common_uses: ['Luxury invitations'], thickness_mm: 0.30, opacity_percent: 99, active: true },
  { id: '300gsm', gsm: 300, name: '300 GSM', category: 'cardstock', description: 'Extra heavy cardstock', common_uses: ['Premium business cards'], thickness_mm: 0.36, opacity_percent: 99, active: true },
  { id: '350gsm', gsm: 350, name: '350 GSM', category: 'cardstock', description: 'Ultra heavy cardstock', common_uses: ['Luxury cards'], thickness_mm: 0.42, opacity_percent: 99, active: true }
];

const fallbackPaperTypes: PaperType[] = [
  { id: 'copy', name: 'Copy Paper', category: 'standard', description: 'Standard office copy paper', finish: 'matte', compatible_weights: [70, 80, 90], common_uses: ['Documents', 'Letters'], active: true },
  { id: 'premium', name: 'Premium Paper', category: 'standard', description: 'High-quality white paper', finish: 'matte', compatible_weights: [80, 90, 100, 120], common_uses: ['Presentations'], active: true },
  { id: 'glossy', name: 'Glossy Paper', category: 'coated', description: 'Glossy coated paper for photos', finish: 'glossy', compatible_weights: [120, 150, 200, 250], common_uses: ['Photos', 'Brochures'], active: true },
  { id: 'matte', name: 'Matte Paper', category: 'coated', description: 'Matte coated paper', finish: 'matte', compatible_weights: [120, 150, 200, 250], common_uses: ['Brochures', 'Art prints'], active: true },
  { id: 'cardstock', name: 'Cardstock', category: 'heavyweight', description: 'Thick paper for cards', finish: 'various', compatible_weights: [200, 250, 300, 350], common_uses: ['Business cards', 'Invitations'], active: true }
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
    const { data, error } = await supabase
      .from('paper_sizes')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperSizes;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper sizes from database');
      return data as PaperSize[];
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
    const { data, error } = await supabase
      .from('paper_weights')
      .select('*')
      .eq('active', true)
      .order('gsm');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperWeights;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper weights from database');
      return data as PaperWeight[];
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
    const { data, error } = await supabase
      .from('paper_types')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.log('⚠️ Database fetch failed, using fallback data:', error.message);
      return fallbackPaperTypes;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully fetched paper types from database');
      return data as PaperType[];
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