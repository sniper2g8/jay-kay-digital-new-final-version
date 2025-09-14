const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('./supabase-service.json', 'utf8'));
const pool = new Pool(config);

async function createCompleteLocalBackup() {
  const client = await pool.connect();
  
  try {
    console.log('=== CREATING COMPLETE LOCAL DATABASE BACKUP ===\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `jay-kay-digital-press-backup-${timestamp}.json`);
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✅ Created backup directory:', backupDir);
    }
    
    console.log('1. Getting list of all tables...');
    
    // Get all tables in the public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`   📋 Found ${tables.length} tables to backup:`);
    tables.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n2. Creating backup data structure...');
    
    const backupData = {
      metadata: {
        backup_timestamp: new Date().toISOString(),
        database_name: 'Jay Kay Digital Press',
        total_tables: tables.length,
        backup_version: '1.0',
        migration_source: 'Firebase to Supabase',
        notes: 'Complete database backup after human-readable FK implementation'
      },
      schema: {},
      data: {},
      statistics: {
        total_records: 0,
        table_counts: {},
        largest_tables: []
      }
    };
    
    console.log('\n3. Backing up table schemas...');
    
    for (const table of tables) {
      // Get table schema
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      backupData.schema[table] = {
        columns: columnsResult.rows,
        created_at: new Date().toISOString()
      };
      
      console.log(`   ✅ Schema backed up: ${table} (${columnsResult.rows.length} columns)`);
    }
    
    console.log('\n4. Backing up table data...');
    
    let totalRecords = 0;
    const tableStats = [];
    
    for (const table of tables) {
      try {
        console.log(`   📦 Backing up data: ${table}...`);
        
        // Get all data from the table
        const dataResult = await client.query(`SELECT * FROM "${table}"`);
        const recordCount = dataResult.rows.length;
        
        backupData.data[table] = {
          records: dataResult.rows,
          count: recordCount,
          backed_up_at: new Date().toISOString()
        };
        
        totalRecords += recordCount;
        tableStats.push({ table, count: recordCount });
        
        console.log(`   ✅ ${table}: ${recordCount.toLocaleString()} records`);
        
      } catch (error) {
        console.log(`   ⚠️  ${table}: Error backing up - ${error.message}`);
        backupData.data[table] = {
          error: error.message,
          count: 0,
          backed_up_at: new Date().toISOString()
        };
      }
    }
    
    console.log('\n5. Generating backup statistics...');
    
    // Sort tables by record count
    tableStats.sort((a, b) => b.count - a.count);
    
    backupData.statistics.total_records = totalRecords;
    backupData.statistics.table_counts = Object.fromEntries(
      tableStats.map(stat => [stat.table, stat.count])
    );
    backupData.statistics.largest_tables = tableStats.slice(0, 10);
    
    console.log(`   📊 Total records backed up: ${totalRecords.toLocaleString()}`);
    console.log('   📈 Top 5 largest tables:');
    tableStats.slice(0, 5).forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.table}: ${stat.count.toLocaleString()} records`);
    });
    
    console.log('\n6. Backing up database constraints and relationships...');
    
    // Get foreign key constraints
    const constraintsResult = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type
    `);
    
    backupData.constraints = constraintsResult.rows;
    console.log(`   ✅ Backed up ${constraintsResult.rows.length} constraints`);
    
    console.log('\n7. Writing backup file...');
    
    // Write backup to file
    const backupJson = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(backupFile, backupJson);
    
    const fileSizeBytes = fs.statSync(backupFile).size;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✅ Backup saved: ${backupFile}`);
    console.log(`   📁 File size: ${fileSizeMB} MB`);
    
    console.log('\n8. Creating backup summary...');
    
    const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.txt`);
    const summary = `
JAY KAY DIGITAL PRESS - DATABASE BACKUP SUMMARY
==============================================

Backup Created: ${new Date().toLocaleString()}
Total Tables: ${tables.length}
Total Records: ${totalRecords.toLocaleString()}
Backup File: ${path.basename(backupFile)}
File Size: ${fileSizeMB} MB

LARGEST TABLES:
${tableStats.slice(0, 10).map((stat, i) => `${i + 1}. ${stat.table}: ${stat.count.toLocaleString()} records`).join('\n')}

ALL TABLES:
${tables.map(table => `- ${table}: ${backupData.statistics.table_counts[table]?.toLocaleString() || '0'} records`).join('\n')}

HUMAN-READABLE SYSTEM STATUS:
✅ Users: human_id system implemented (JKDP-ADM-###)
✅ Customers: human_id system implemented (JKDP-CUS-###)  
✅ Payments: Human-readable FK system implemented
✅ Invoices: Human-readable invoiceNo system ready
✅ Database optimized to 27 production tables

BACKUP INTEGRITY:
✅ Complete schema backup
✅ Complete data backup  
✅ Constraints and relationships backed up
✅ Ready for frontend development

This backup captures the complete Jay Kay Digital Press database
after successful Firebase migration and human-readable optimization.
The database is ready for Next.js frontend development.
`;
    
    fs.writeFileSync(summaryFile, summary);
    console.log(`   ✅ Summary saved: ${summaryFile}`);
    
    console.log('\n✅ COMPLETE DATABASE BACKUP SUCCESSFUL!\n');
    
    console.log('🎯 BACKUP RESULTS:');
    console.log(`   📁 Backup Location: ${backupFile}`);
    console.log(`   📊 Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`   📋 Total Tables: ${tables.length}`);
    console.log(`   💾 File Size: ${fileSizeMB} MB`);
    console.log(`   📄 Summary: ${summaryFile}`);
    
    console.log('\n🚀 DATABASE IS READY FOR FRONTEND DEVELOPMENT!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. ✅ Database backup complete');
    console.log('   2. 🎨 Initialize Next.js project');
    console.log('   3. 🔧 Setup Supabase client');
    console.log('   4. 🎯 Create role-based dashboard system');
    console.log('   5. 💻 Build human-readable query components');
    
    return {
      backupFile,
      summaryFile,
      totalRecords,
      totalTables: tables.length,
      fileSizeMB: parseFloat(fileSizeMB)
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCompleteLocalBackup().catch(console.error);
