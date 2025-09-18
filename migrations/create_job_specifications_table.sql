-- Create job_specifications table to store detailed job specifications
CREATE TABLE IF NOT EXISTS public.job_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    
    -- Size specifications
    size_type VARCHAR(20) DEFAULT 'standard', -- 'standard' or 'custom'
    size_preset VARCHAR(50), -- e.g., 'A4', 'Letter'
    custom_width DECIMAL(8,2), -- Width in selected unit
    custom_height DECIMAL(8,2), -- Height in selected unit
    size_unit VARCHAR(10) DEFAULT 'mm', -- 'mm', 'cm', 'inches'
    
    -- Paper specifications
    paper_type VARCHAR(50), -- e.g., 'Glossy Paper', 'Matte Paper'
    paper_weight INTEGER, -- e.g., 80, 120, 250 (gsm)
    
    -- Finishing specifications
    finishing_options JSONB, -- Array of selected finish option IDs with prices
    special_instructions TEXT,
    
    -- Requirements
    requirements TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_specifications_job_id ON public.job_specifications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_specifications_paper_type ON public.job_specifications (paper_type);
CREATE INDEX IF NOT EXISTS idx_job_specifications_paper_weight ON public.job_specifications (paper_weight);

-- Enable RLS
ALTER TABLE public.job_specifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "auth_users_select_job_specifications" ON public.job_specifications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_manage_job_specifications" ON public.job_specifications
    FOR ALL TO authenticated USING (true);

-- Add a function to get job specifications with related data
CREATE OR REPLACE FUNCTION get_job_specifications_with_details(job_id_param UUID)
RETURNS TABLE (
    job_id UUID,
    size_type VARCHAR,
    size_preset VARCHAR,
    custom_width DECIMAL,
    custom_height DECIMAL,
    size_unit VARCHAR,
    paper_type VARCHAR,
    paper_weight INTEGER,
    finishing_options JSONB,
    special_instructions TEXT,
    requirements TEXT,
    finish_options_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        js.job_id,
        js.size_type,
        js.size_preset,
        js.custom_width,
        js.custom_height,
        js.size_unit,
        js.paper_type,
        js.paper_weight,
        js.finishing_options,
        js.special_instructions,
        js.requirements,
        COALESCE(
            (SELECT jsonb_agg(fo.*)
             FROM public.finish_options fo
             WHERE fo.id = ANY (SELECT jsonb_array_elements_text(js.finishing_options->'selected_options'))
            ), 
            '[]'::jsonb
        ) as finish_options_details
    FROM public.job_specifications js
    WHERE js.job_id = job_id_param;
END;
$$ LANGUAGE plpgsql;

-- Update the useJobSubmission hook to insert specifications when creating jobs
-- This will be handled in the application code