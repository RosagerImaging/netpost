# NetPost Database Schema

This directory contains the complete database schema for the NetPost cross-listing application built on Supabase (PostgreSQL).

## Structure

- `migrations/` - SQL migration files that define the database schema
- `seeds/` - Sample data and configurations for development/testing

## Migration Files

### 001_initial_schema.sql
- Core table definitions
- Custom types and enums
- Indexes for performance
- Triggers for updated_at columns

### 002_rls_policies.sql
- Row Level Security (RLS) policies
- User data isolation and security
- Granular access controls

### 003_functions_and_triggers.sql
- Database functions for business logic
- Automated inventory updates
- Analytics calculations
- Dead stock detection

## Key Features

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Encrypted platform credentials storage
- Secure JWT-based authentication

### Scalability
- Optimized indexes for common queries
- Efficient pagination support
- JSONB fields for flexible data storage
- Proper foreign key relationships

### Business Logic
- Automatic inventory synchronization
- Real-time analytics calculations
- Dead stock detection
- Platform-specific configurations

## Tables Overview

### Core Tables
- `users` - User accounts and subscription info
- `user_preferences` - User settings and preferences
- `platform_credentials` - Encrypted platform API keys
- `inventory_items` - Product inventory with variants
- `marketplace_listings` - Platform-specific listings

### Analytics Tables
- `seo_analyses` - AI-powered SEO recommendations
- `sales_analytics` - Revenue and performance metrics
- `tax_documents` - Tax preparation data
- `receipts` - Business expense tracking

### Operations Tables
- `crosslisting_requests` - Cross-listing job tracking
- `automation_rules` - User-defined automation rules

## Usage

### In Development
Run migrations in order against your Supabase instance:

```sql
-- Run each migration file in order
\i migrations/001_initial_schema.sql
\i migrations/002_rls_policies.sql  
\i migrations/003_functions_and_triggers.sql

-- Optionally load sample data
\i seeds/001_sample_data.sql
```

### In Production
Migrations should be run through Supabase CLI or dashboard migration system.

## Best Practices

1. **Always use transactions** when running migrations
2. **Test migrations** on a copy of production data first
3. **Backup before migrations** in production
4. **Use RLS policies** for all user data access
5. **Index frequently queried columns**
6. **Use JSONB** for flexible/evolving data structures