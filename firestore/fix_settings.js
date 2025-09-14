const { getSupabaseInstance } = require('./supabase');

async function fixSettingsTable() {
    try {
        const supabase = getSupabaseInstance();
        
        console.log('Dropping existing settings table...');
        const dropResult = await supabase.rpc('drop_table_if_exists', { table_name: 'settings' });
        
        if (dropResult.error) {
            console.log('Drop table result:', dropResult.error);
        } else {
            console.log('Settings table dropped successfully');
        }
        
    } catch (error) {
        console.error('Error fixing settings table:', error);
    }
}

fixSettingsTable();
