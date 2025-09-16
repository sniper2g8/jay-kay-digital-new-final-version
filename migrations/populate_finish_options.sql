-- SQL script to populate finish_options table with default data

-- Insert common finishing options
INSERT INTO public.finish_options (id, name, category, pricing, parameters, appliesTo, active) VALUES
('none', 'No Finishing', 'basic', '{"base": 0}', null, null, true),
('lamination', 'Lamination', 'coating', '{"base": 0.50}', null, null, true),
('uv_coating', 'UV Coating', 'coating', '{"base": 0.75}', null, null, true),
('embossing', 'Embossing', 'texture', '{"base": 1.00}', null, null, true),
('foil_stamping', 'Foil Stamping', 'special', '{"base": 1.25}', null, null, true),
('die_cutting', 'Die Cutting', 'cutting', '{"base": 0.80}', null, null, true),
('folding', 'Folding', 'finishing', '{"base": 0.25}', null, null, true),
('binding_spiral', 'Spiral Binding', 'binding', '{"base": 2.00}', null, null, true),
('binding_perfect', 'Perfect Binding', 'binding', '{"base": 3.00}', null, null, true),
('trimming', 'Trimming', 'cutting', '{"base": 0.15}', null, null, true),
('hole_punching', 'Hole Punching', 'finishing', '{"base": 0.10}', null, null, true),
('score_crease', 'Scoring/Creasing', 'finishing', '{"base": 0.20}', null, null, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    pricing = EXCLUDED.pricing,
    parameters = EXCLUDED.parameters,
    appliesTo = EXCLUDED.appliesTo,
    active = EXCLUDED.active;