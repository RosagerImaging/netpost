# /create-migration
Create Supabase database migration for: $ARGUMENTS

## Migration Process

### 1. Plan Migration
1. **Analyze Current Schema**
   - Review existing tables in Supabase dashboard
   - Check current migrations in database/migrations/
   - Identify dependencies and relationships
   - Plan for data compatibility

2. **Design Changes**
   - Design backward-compatible schema changes
   - Plan for zero-downtime deployment
   - Consider impact on existing API endpoints
   - Design rollback strategy for safety

### 2. Create Migration Files
1. **Generate Migration**
   - Create new migration file: `database/migrations/[timestamp]_$ARGUMENTS.sql`
   - Use format: `YYYYMMDDHHMMSS_descriptive_name.sql`
   - Include both UP and DOWN migration commands
   - Add clear comments explaining changes

2. **Migration Structure**
   ```sql
   -- Migration: $ARGUMENTS
   -- Created: [timestamp]
   -- Description: [detailed description of changes]
   
   -- UP Migration
   BEGIN;
   
   -- Your schema changes here
   
   COMMIT;
   
   -- DOWN Migration (Rollback)
   -- BEGIN;
   -- -- Rollback commands (commented for safety)
   -- COMMIT;
   ```

### 3. Common Migration Patterns
1. **Adding Tables**
   - Include proper primary keys and indexes
   - Add Row Level Security (RLS) policies
   - Set appropriate column defaults and constraints
   - Add foreign key relationships

2. **Adding Columns**
   - Use `ALTER TABLE` with `ADD COLUMN`
   - Set appropriate default values for existing data
   - Add NOT NULL constraints carefully
   - Update related TypeScript interfaces

3. **Modifying Existing Data**
   - Use safe data transformations
   - Batch large updates to avoid locks
   - Test on sample data first
   - Consider performance impact

### 4. Security & Permissions
1. **Row Level Security (RLS)**
   - Enable RLS on new tables: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`
   - Create policies for different user roles
   - Test policies with different user contexts
   - Document policy logic

2. **API Permissions**
   - Grant appropriate permissions to API service role
   - Limit public access where needed
   - Test API endpoints after migration
   - Update backend/src/utils/database.ts if needed

### 5. Testing Migration
1. **Development Testing**
   - Apply migration to development database
   - Test all affected API endpoints in backend/api/
   - Verify dashboard components still work
   - Check Chrome extension functionality if applicable

2. **Data Integrity**
   - Run data validation queries
   - Check foreign key constraints
   - Verify indexes are working
   - Test rollback procedure

3. **Performance Testing**
   - Check query performance on larger datasets
   - Monitor for lock contention
   - Test under load if possible
   - Verify backup/restore still works

### 6. TypeScript Integration
1. **Update Type Definitions**
   - Regenerate TypeScript types: Use Supabase CLI or dashboard
   - Update interfaces in shared/src/types/
   - Update API response types
   - Fix TypeScript compilation errors

2. **Update Code References**
   - Update database queries in backend/
   - Modify dashboard components if data structure changed
   - Update Chrome extension if applicable
   - Test end-to-end workflows

### 7. Deployment Process
1. **Pre-deployment**
   - Backup production database
   - Schedule maintenance window if needed
   - Prepare rollback plan
   - Notify team of deployment

2. **Apply Migration**
   - Apply via Supabase CLI: `supabase db push`
   - Or apply via Supabase dashboard
   - Monitor for errors or performance issues
   - Verify all systems are working

3. **Post-deployment**
   - Test critical user workflows
   - Monitor error logs and performance
   - Verify data integrity
   - Update documentation

## Migration Templates

### New Table Template
```sql
-- Create new table with RLS
CREATE TABLE public.[table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Add your columns here
);

-- Enable RLS
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own [table_name]" ON public.[table_name]
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own [table_name]" ON public.[table_name]
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX [table_name]_user_id_idx ON public.[table_name](user_id);
CREATE INDEX [table_name]_created_at_idx ON public.[table_name](created_at);
```

### Add Column Template  
```sql
-- Add new column with default
ALTER TABLE public.[table_name] 
ADD COLUMN [column_name] [data_type] DEFAULT [default_value];

-- Add constraint if needed
ALTER TABLE public.[table_name] 
ADD CONSTRAINT [constraint_name] CHECK ([column_name] IS NOT NULL);
```

## Completion Checklist
- [ ] Migration file created with proper naming
- [ ] UP migration tested in development
- [ ] DOWN migration (rollback) planned and tested
- [ ] RLS policies created for new tables
- [ ] TypeScript types updated
- [ ] API endpoints tested with new schema
- [ ] Dashboard components working with changes
- [ ] Chrome extension compatibility verified
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Ready for production deployment