#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  console.log(`\n📁 Running migration: ${migrationFile}`);
  
  const migrationPath = path.join(__dirname, 'database', 'migrations', migrationFile);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error(`❌ Error running migration ${migrationFile}:`, error);
      return false;
    }
    
    console.log(`✅ Migration ${migrationFile} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception running migration ${migrationFile}:`, err);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up NetPost database...');
  console.log(`📡 Connected to: ${supabaseUrl}`);
  
  // Test connection
  try {
    const { data, error } = await supabase.from('_supabase_migrations').select('version').limit(1);
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Cannot connect to Supabase:', error);
      process.exit(1);
    }
    console.log('✅ Connected to Supabase successfully');
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
  
  // Migration files in order
  const migrations = [
    '001_initial_schema.sql',
    '002_rls_policies.sql', 
    '003_functions_and_triggers.sql',
    '004_performance_security_indexes.sql',
    '005_optimize_rls_performance.sql'
  ];
  
  console.log('\n📋 Running migrations...');
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      console.log(`⚠️  Migration ${migration} failed, but continuing...`);
    }
    
    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Verify tables were created
  console.log('\n🔍 Verifying database setup...');
  
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'spatial_ref_sys'); // Exclude PostGIS system table if present
    
    if (error) {
      console.error('❌ Could not verify tables:', error);
    } else {
      console.log(`✅ Found ${tables.length} tables in database:`);
      tables.forEach(table => {
        console.log(`   📋 ${table.table_name}`);
      });
    }
  } catch (err) {
    console.log('⚠️  Could not verify tables, but migrations may have succeeded');
  }
  
  console.log('\n🎉 Database setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your .env.local with the DATABASE_URL from Supabase dashboard');
  console.log('2. Test the connection using: node scripts/test-supabase.js');
  console.log('3. Deploy your application to Vercel');
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'Success';
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      // Try alternative approach
      await supabase.rpc('exec', { sql: createFunctionSQL });
    }
  } catch (err) {
    console.log('Note: Could not create exec_sql function, using direct SQL execution');
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect(migrationFile) {
  console.log(`\n📁 Running migration: ${migrationFile}`);
  
  const migrationPath = path.join(__dirname, 'database', 'migrations', migrationFile);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });
      if (error) {
        console.log(`⚠️  Statement error (continuing):`, error.message.substring(0, 100));
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  Statement exception (continuing):`, err.message.substring(0, 100));
      errorCount++;
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Migration ${migrationFile}: ${successCount} successful, ${errorCount} errors`);
  return successCount > 0;
}

// Run setup
setupDatabase().catch(console.error);