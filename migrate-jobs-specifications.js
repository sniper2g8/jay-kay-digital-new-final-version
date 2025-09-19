require('dotenv').config({ path: '.env.local' });
import { Client } from 'pg';;

async function migrateJobsSpecifications() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, add the necessary columns to the jobs table if they don't exist
    console.log('Adding specification columns to jobs table...');
    
    const alterTableQueries = [
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS size_type VARCHAR(20) DEFAULT 'standard'`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS size_preset VARCHAR(50)`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_width DECIMAL(8,2)`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_height DECIMAL(8,2)`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS size_unit VARCHAR(10) DEFAULT 'mm'`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paper_type VARCHAR(50)`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paper_weight INTEGER`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS finishing_options JSONB`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS special_instructions TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT`
    ];

    for (const query of alterTableQueries) {
      try {
        await client.query(query);
        console.log(`Executed: ${query.substring(0, 50)}...`);
      } catch (err) {
        console.log(`Column may already exist or error: ${err.message}`);
      }
    }

    // Now migrate data from jobs_backup_data to jobs table
    console.log('Migrating data from jobs_backup_data to jobs table...');
    
    // Get all rows from jobs_backup_data
    const backupData = await client.query(`
      SELECT id, specifications, size, paper, "finishOptions", "finishIds", "finishPrices"
      FROM jobs_backup_data
    `);
    
    console.log(`Found ${backupData.rows.length} rows to migrate`);
    
    let migratedCount = 0;
    for (const row of backupData.rows) {
      try {
        // Parse the specifications JSON
        let specifications = {};
        if (row.specifications && typeof row.specifications === 'object') {
          specifications = row.specifications;
        } else if (typeof row.specifications === 'string') {
          try {
            specifications = JSON.parse(row.specifications);
          } catch (e) {
            console.log(`Could not parse specifications for job ${row.id}:`, e.message);
          }
        }
        
        // Parse size data
        let sizeData = {};
        if (row.size && typeof row.size === 'object') {
          sizeData = row.size;
        } else if (typeof row.size === 'string') {
          try {
            sizeData = JSON.parse(row.size);
          } catch (e) {
            console.log(`Could not parse size for job ${row.id}:`, e.message);
          }
        }
        
        // Parse paper data
        let paperData = {};
        if (row.paper && typeof row.paper === 'object') {
          paperData = row.paper;
        } else if (typeof row.paper === 'string') {
          try {
            paperData = JSON.parse(row.paper);
          } catch (e) {
            console.log(`Could not parse paper for job ${row.id}:`, e.message);
          }
        }
        
        // Combine finish options data
        let finishOptions = [];
        if (row.finishOptions && Array.isArray(row.finishOptions)) {
          finishOptions = row.finishOptions;
        }
        
        if (row.finishIds && Array.isArray(row.finishIds)) {
          finishOptions = [...new Set([...finishOptions, ...row.finishIds])];
        }
        
        // Create finishing options object with prices
        let finishingOptionsObj = {};
        if (row.finishPrices && typeof row.finishPrices === 'object') {
          finishingOptionsObj = row.finishPrices;
        }
        
        // Extract specification fields
        const sizeType = specifications.size?.type || sizeData.sizeMode || 'standard';
        const sizePreset = specifications.size?.preset || sizeData.standardSize || null;
        const customWidth = sizeData.width || null;
        const customHeight = sizeData.height || null;
        const sizeUnit = sizeData.unit || 'mm';
        const paperType = specifications.paper?.type || paperData.type || null;
        const paperWeight = specifications.paper?.weight || paperData.weightGsm || paperData.weight || null;
        const specialInstructions = specifications.special_instructions || null;
        const requirements = specifications.requirements || null;
        
        // Update the jobs table with the extracted data
        const updateResult = await client.query(
          `UPDATE jobs SET 
            size_type = $1,
            size_preset = $2,
            custom_width = $3,
            custom_height = $4,
            size_unit = $5,
            paper_type = $6,
            paper_weight = $7,
            finishing_options = $8,
            special_instructions = $9,
            requirements = $10
          WHERE id = $11`,
          [
            sizeType,
            sizePreset,
            customWidth,
            customHeight,
            sizeUnit,
            paperType,
            paperWeight,
            JSON.stringify(finishingOptionsObj),
            specialInstructions,
            requirements,
            row.id
          ]
        );
        
        if (updateResult.rowCount > 0) {
          migratedCount++;
        }
      } catch (err) {
        console.log(`Error migrating data for job ${row.id}:`, err.message);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount} rows`);
    
    // Verify the migration by checking a few rows
    console.log('\nVerifying migration...');
    const verification = await client.query(`
      SELECT id, title, size_type, size_preset, paper_type, paper_weight, special_instructions, requirements
      FROM jobs 
      WHERE size_type IS NOT NULL OR paper_type IS NOT NULL
      LIMIT 5
    `);
    
    console.log('Sample migrated data:');
    verification.rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

migrateJobsSpecifications();