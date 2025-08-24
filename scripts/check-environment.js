#!/usr/bin/env node

/**
 * NetPost Environment Configuration Checker
 * Run this script to validate your environment configuration
 * Usage: node scripts/check-environment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NetPost Environment Configuration Checker\n');

// Define required environment variables by component
const requirements = {
  'CRITICAL': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'JWT_SECRET'
  ],
  'STRIPE_BILLING': [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET'
  ],
  'AI_SERVICES': [
    'OPENAI_API_KEY'
  ],
  'PLATFORM_APIS': [
    'EBAY_CLIENT_ID',
    'EBAY_CLIENT_SECRET'
  ],
  'SECURITY': [
    'ENCRYPTION_KEY'
  ],
  'APPLICATION': [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL'
  ]
};

// Load environment files
const envFiles = [
  '.env.local',
  '.env',
  'dashboard/.env.local',
  'backend/.env.local'
];

const envVars = {};

function loadEnvFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Found: ${filePath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    return true;
  } else {
    console.log(`❌ Missing: ${filePath}`);
    return false;
  }
}

// Load all environment files
console.log('📁 Environment Files:');
envFiles.forEach(loadEnvFile);

console.log('\n🔐 Environment Variable Validation:\n');

let hasErrors = false;
let hasWarnings = false;

// Check each category
Object.entries(requirements).forEach(([category, vars]) => {
  console.log(`\n📋 ${category}:`);
  
  vars.forEach(varName => {
    const value = envVars[varName];
    const hasValue = value && value.length > 0;
    const isPlaceholder = value && (
      value.includes('your-') || 
      value.includes('sk_test_') ||
      value.includes('localhost') ||
      value === 'your-super-secret-jwt-key-change-in-production-min-32-chars'
    );
    
    if (!hasValue) {
      console.log(`  ❌ ${varName}: NOT SET`);
      if (category === 'CRITICAL') hasErrors = true;
      else hasWarnings = true;
    } else if (isPlaceholder) {
      console.log(`  ⚠️  ${varName}: Using placeholder value`);
      hasWarnings = true;
    } else {
      const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    }
  });
});

// Special validations
console.log('\n🔍 Special Validations:');

// JWT Secret length
if (envVars.JWT_SECRET) {
  if (envVars.JWT_SECRET.length < 32) {
    console.log('  ❌ JWT_SECRET: Should be at least 32 characters');
    hasErrors = true;
  } else {
    console.log('  ✅ JWT_SECRET: Length is adequate');
  }
}

// URL format validation
const urlVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_APP_URL', 'DATABASE_URL'];
urlVars.forEach(varName => {
  const value = envVars[varName];
  if (value && !value.match(/^https?:\/\/.+/)) {
    console.log(`  ❌ ${varName}: Invalid URL format`);
    hasErrors = true;
  }
});

// Stripe key validation
if (envVars.STRIPE_SECRET_KEY) {
  if (envVars.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('  ⚠️  STRIPE_SECRET_KEY: Using test key (switch to live key for production)');
    hasWarnings = true;
  } else if (envVars.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('  ✅ STRIPE_SECRET_KEY: Using live key');
  }
}

// Final summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log('❌ ERRORS FOUND: Critical environment variables are missing or invalid');
  console.log('   Please fix these before deploying to production');
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS: Some variables may need production values');
  console.log('   Review placeholder values before production deployment');
} else {
  console.log('✅ ALL CHECKS PASSED: Environment configuration looks good');
}

console.log('\n📖 Next Steps:');
console.log('1. Fix any critical errors shown above');
console.log('2. Replace placeholder values with real credentials');
console.log('3. Test Supabase connection: node scripts/test-supabase.js');
console.log('4. Deploy to Vercel with environment variables set');

process.exit(hasErrors ? 1 : 0);