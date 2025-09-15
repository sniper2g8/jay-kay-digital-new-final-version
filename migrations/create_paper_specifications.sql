-- Create paper_sizes table
CREATE TABLE IF NOT EXISTS public.paper_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    series VARCHAR(10) NOT NULL, -- A, B, C series
    width_mm DECIMAL(8,2) NOT NULL,
    height_mm DECIMAL(8,2) NOT NULL,
    width_inches DECIMAL(8,3) NOT NULL,
    height_inches DECIMAL(8,3) NOT NULL,
    category VARCHAR(20) DEFAULT 'standard', -- standard, custom, envelope
    description TEXT,
    common_uses TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create paper_weights table
CREATE TABLE IF NOT EXISTS public.paper_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gsm INTEGER NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL, -- lightweight, standard, heavyweight, cardstock
    description TEXT,
    common_uses TEXT[],
    thickness_mm DECIMAL(6,3),
    opacity_percent INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create paper_types table (for different paper materials)
CREATE TABLE IF NOT EXISTS public.paper_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(30) NOT NULL, -- matte, glossy, textured, specialty
    description TEXT,
    finish VARCHAR(30), -- matte, glossy, satin, linen, etc.
    grain_direction VARCHAR(20), -- short, long, none
    compatible_weights INTEGER[],
    common_uses TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert A-series paper sizes
INSERT INTO public.paper_sizes (name, series, width_mm, height_mm, width_inches, height_inches, description, common_uses) VALUES
('A0', 'A', 841, 1189, 33.11, 46.81, 'Largest standard A-series format', ARRAY['Posters', 'Large format printing', 'Technical drawings']),
('A1', 'A', 594, 841, 23.39, 33.11, 'Large format poster size', ARRAY['Posters', 'Flip charts', 'Large drawings']),
('A2', 'A', 420, 594, 16.54, 23.39, 'Medium poster size', ARRAY['Small posters', 'Drawings', 'Diagrams']),
('A3', 'A', 297, 420, 11.69, 16.54, 'Tabloid size', ARRAY['Drawings', 'Diagrams', 'Small posters']),
('A4', 'A', 210, 297, 8.27, 11.69, 'Standard letter size', ARRAY['Letters', 'Documents', 'Flyers', 'Brochures']),
('A5', 'A', 148, 210, 5.83, 8.27, 'Half letter size', ARRAY['Greeting cards', 'Small flyers', 'Notebooks']),
('A6', 'A', 105, 148, 4.13, 5.83, 'Postcard size', ARRAY['Postcards', 'Small invitations', 'Business cards']),
('Letter', 'US', 216, 279, 8.5, 11, 'US Letter standard', ARRAY['Letters', 'Documents', 'Resumes']),
('Legal', 'US', 216, 356, 8.5, 14, 'US Legal standard', ARRAY['Legal documents', 'Contracts']),
('Tabloid', 'US', 279, 432, 11, 17, 'US Tabloid standard', ARRAY['Newspapers', 'Large documents']),
('Custom', 'CUSTOM', 0, 0, 0, 0, 'Custom dimensions specified by user', ARRAY['Special projects', 'Custom designs']);

-- Insert common paper weights
INSERT INTO public.paper_weights (gsm, name, category, description, common_uses, thickness_mm, opacity_percent) VALUES
(60, '60 GSM', 'lightweight', 'Very light paper, translucent', ARRAY['Tissue paper', 'Bible paper'], 0.08, 85),
(70, '70 GSM', 'lightweight', 'Light copy paper', ARRAY['Economy copying', 'Draft printing'], 0.09, 88),
(80, '80 GSM', 'standard', 'Standard copy paper', ARRAY['Office documents', 'Letters', 'Invoices'], 0.10, 90),
(90, '90 GSM', 'standard', 'Quality copy paper', ARRAY['Presentations', 'Reports'], 0.11, 92),
(100, '100 GSM', 'standard', 'Premium copy paper', ARRAY['Letterheads', 'Certificates'], 0.12, 94),
(120, '120 GSM', 'standard', 'Light cardstock', ARRAY['Brochures', 'Flyers', 'Greeting cards'], 0.15, 96),
(150, '150 GSM', 'heavyweight', 'Medium cardstock', ARRAY['Business cards', 'Postcards', 'Invitations'], 0.18, 98),
(200, '200 GSM', 'heavyweight', 'Heavy cardstock', ARRAY['Business cards', 'Covers', 'Tags'], 0.24, 99),
(250, '250 GSM', 'cardstock', 'Premium cardstock', ARRAY['Business cards', 'Luxury invitations'], 0.30, 99),
(300, '300 GSM', 'cardstock', 'Extra heavy cardstock', ARRAY['Premium business cards', 'Book covers'], 0.36, 99),
(350, '350 GSM', 'cardstock', 'Ultra heavy cardstock', ARRAY['Luxury cards', 'Rigid invitations'], 0.42, 99);

-- Insert common paper types
INSERT INTO public.paper_types (name, category, description, finish, compatible_weights, common_uses) VALUES
('Copy Paper', 'standard', 'Standard office copy paper', 'matte', ARRAY[70, 80, 90], ARRAY['Documents', 'Letters', 'Reports']),
('Premium Paper', 'standard', 'High-quality white paper', 'matte', ARRAY[80, 90, 100, 120], ARRAY['Presentations', 'Letterheads']),
('Glossy Paper', 'coated', 'Glossy coated paper for photos', 'glossy', ARRAY[120, 150, 200, 250], ARRAY['Photos', 'Brochures', 'Flyers']),
('Matte Paper', 'coated', 'Matte coated paper', 'matte', ARRAY[120, 150, 200, 250], ARRAY['Brochures', 'Art prints']),
('Cardstock', 'heavyweight', 'Thick paper for cards', 'various', ARRAY[200, 250, 300, 350], ARRAY['Business cards', 'Invitations', 'Tags']),
('Recycled Paper', 'eco', 'Environmentally friendly paper', 'matte', ARRAY[70, 80, 90, 100], ARRAY['Eco-friendly printing']),
('Linen Paper', 'textured', 'Textured linen finish', 'linen', ARRAY[80, 100, 120, 150], ARRAY['Letterheads', 'Certificates']),
('Canvas Paper', 'specialty', 'Textured canvas for art', 'textured', ARRAY[200, 250, 300], ARRAY['Art prints', 'Photography']);

-- Enable RLS
ALTER TABLE public.paper_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "auth_users_select_paper_sizes" ON public.paper_sizes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_paper_weights" ON public.paper_weights
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_users_select_paper_types" ON public.paper_types
    FOR SELECT TO authenticated USING (true);

-- Admin policies for managing paper specifications
CREATE POLICY "admin_manage_paper_sizes" ON public.paper_sizes
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role = 'admin'
        )
    );

CREATE POLICY "admin_manage_paper_weights" ON public.paper_weights
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role = 'admin'
        )
    );

CREATE POLICY "admin_manage_paper_types" ON public.paper_types
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public."appUsers"
            WHERE id = auth.uid() AND primary_role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_paper_sizes_active ON public.paper_sizes (active);
CREATE INDEX idx_paper_weights_active ON public.paper_weights (active);
CREATE INDEX idx_paper_types_active ON public.paper_types (active);
CREATE INDEX idx_paper_sizes_series ON public.paper_sizes (series);
CREATE INDEX idx_paper_weights_category ON public.paper_weights (category);
CREATE INDEX idx_paper_types_category ON public.paper_types (category);