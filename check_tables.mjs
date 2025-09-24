import { createClient } from '@supabase/supabase-js'

// Supabase connection details from npx supabase status
const supabaseUrl = 'http://127.0.0.1:5439'
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  try {
    // Get list of tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10)

    if (error) {
      console.error('Error fetching tables:', error)
      return
    }

    console.log('Tables in public schema:')
    data.forEach(table => {
      console.log('- ' + table.table_name)
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

checkTables()