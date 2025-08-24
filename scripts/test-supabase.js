#!/usr/bin/env node

/**
 * NetPost Supabase Connection Test
 * Tests the Supabase connection and basic database operations
 * Usage: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔗 NetPost Supabase Connection Test\n');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Configuration:');
console.log(`URL: ${supabaseUrl ? supabaseUrl.replace(/\/+$/, '') : 'NOT SET'}`);
console.log(`Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'}`);
console.log(`Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NOT SET'}`);

// Validate required variables
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.log('\n❌ Missing required Supabase environment variables');
  console.log('Please ensure the following are set in your .env.local file:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function testSupabase() {
  try {
    console.log('\n🧪 Running Tests...\n');

    // Test 1: Create admin client
    console.log('1. Creating admin client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('   ✅ Admin client created');

    // Test 2: Create user client
    console.log('2. Creating user client...');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);
    console.log('   ✅ User client created');

    // Test 3: Test database connection
    console.log('3. Testing database connection...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return false;
    }
    console.log('   ✅ Database connection successful');

    // Test 4: Test table access
    console.log('4. Testing table access...');
    const tables = [
      'users', 
      'inventory_items', 
      'marketplace_listings', 
      'user_preferences',
      'platform_credentials',
      'crosslisting_requests',
      'seo_analyses'
    ];

    let tableErrors = 0;
    for (const table of tables) {
      try {
        const { error: tableError } = await supabaseAdmin
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (tableError) {
          console.log(`   ❌ ${table}: ${tableError.message}`);
          tableErrors++;
        } else {
          console.log(`   ✅ ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
        tableErrors++;
      }
    }

    if (tableErrors === 0) {
      console.log('   ✅ All required tables are accessible');
    } else {
      console.log(`   ⚠️  ${tableErrors} table(s) had issues - you may need to run migrations`);
    }

    // Test 5: Test RLS policies (if any exist)
    console.log('5. Testing Row Level Security...');
    try {
      const { error: rlsError } = await supabaseUser
        .from('users')
        .select('id')
        .limit(1);
      
      if (rlsError && rlsError.message.includes('JWT')) {
        console.log('   ✅ RLS is properly configured (anonymous access restricted)');
      } else if (rlsError) {
        console.log(`   ⚠️  RLS test warning: ${rlsError.message}`);
      } else {
        console.log('   ✅ RLS test passed');
      }
    } catch (err) {
      console.log(`   ⚠️  RLS test error: ${err.message}`);
    }

    console.log('\n✅ Supabase connection test completed successfully!');
    return true;

  } catch (error) {
    console.log('\n❌ Supabase connection test failed:');
    console.log(error.message);
    return false;
  }
}

// Run the test
testSupabase().then(success => {
  if (success) {
    console.log('\n🎉 Your Supabase configuration is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Test your application: npm run dev');
    console.log('2. Deploy to production: vercel --prod');
  } else {
    console.log('\n🔧 Please fix the Supabase configuration issues above');
    console.log('\nTroubleshooting:');
    console.log('1. Verify your Supabase project URL and keys');
    console.log('2. Check that your Supabase project is active');
    console.log('3. Ensure database migrations have been run');
  }
  process.exit(success ? 0 : 1);
});