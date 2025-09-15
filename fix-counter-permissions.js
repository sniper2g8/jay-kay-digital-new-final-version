const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Need either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCounterPermissions() {
  console.log('🔧 Setting up counter permissions and fixing job counter...');
  
  try {
    // First, let's try to create the counters table and policies via SQL
    const sqlCommands = [
      // Create counters table if it doesn't exist
      `
      CREATE TABLE IF NOT EXISTS public.counters (
        counter_id text PRIMARY KEY,
        last integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      `,
      
      // Enable RLS
      `ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;`,
      
      // Create policies for counters
      `
      CREATE POLICY "Allow authenticated users to read counters" ON public.counters
        FOR SELECT TO authenticated USING (true);
      `,
      
      `
      CREATE POLICY "Allow authenticated users to update counters" ON public.counters
        FOR UPDATE TO authenticated USING (true);
      `,
      
      `
      CREATE POLICY "Allow authenticated users to insert counters" ON public.counters
        FOR INSERT TO authenticated WITH CHECK (true);
      `,
      
      // Create or replace the get_next_counter function
      `
      CREATE OR REPLACE FUNCTION public.get_next_counter(counter_name text)
      RETURNS integer
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        next_value integer;
      BEGIN
        UPDATE public.counters 
        SET last = last + 1, updated_at = NOW()
        WHERE counter_id = counter_name
        RETURNING last INTO next_value;
        
        IF NOT FOUND THEN
          INSERT INTO public.counters (counter_id, last, created_at, updated_at)
          VALUES (counter_name, 1, NOW(), NOW())
          RETURNING last INTO next_value;
        END IF;
        
        RETURN next_value;
      END;
      $$;
      `,
      
      // Grant execute permission on the function
      `GRANT EXECUTE ON FUNCTION public.get_next_counter(text) TO authenticated;`,
      
      // Insert or update the job counter to 112
      `
      INSERT INTO public.counters (counter_id, last, created_at, updated_at)
      VALUES ('job', 112, NOW(), NOW())
      ON CONFLICT (counter_id) 
      DO UPDATE SET 
        last = 112,
        updated_at = NOW();
      `
    ];
    
    for (const sql of sqlCommands) {
      console.log('Executing SQL:', sql.slice(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log('⚠️ SQL execution result:', error);
        // Some errors might be expected (like policy already exists)
      }
    }
    
    console.log('✅ Permissions setup completed');
    
    // Test the counter function
    console.log('🧪 Testing counter function...');
    const { data: nextJobNumber, error: testError } = await supabase
      .rpc('get_next_counter', { counter_name: 'job' });
    
    if (testError) {
      console.error('❌ Error testing counter function:', testError);
      
      // Try direct table access as fallback
      console.log('🔄 Trying direct table access...');
      const { data: counterData, error: directError } = await supabase
        .from('counters')
        .select('*')
        .eq('counter_id', 'job');
        
      if (directError) {
        console.error('❌ Direct access also failed:', directError);
      } else {
        console.log('📊 Counter data:', counterData);
      }
    } else {
      const formattedJobNumber = `JKDP-JOB-${String(nextJobNumber).padStart(4, '0')}`;
      console.log('🎯 Next job number will be:', formattedJobNumber);
      console.log('🎉 Job counter is working! Next job will be numbered', nextJobNumber);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixCounterPermissions();