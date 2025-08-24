# /new-feature
Scaffold new feature: $ARGUMENTS with full development setup for netpost architecture.

## Setup Process

### 1. Planning & Branch Setup
1. **Create Feature Branch**
   - Create feature branch: `git checkout -b feature/$ARGUMENTS`
   - Determine which components need the feature:
     - Backend API (backend/api/)
     - Dashboard frontend (dashboard/src/)
     - Chrome extension (chrome-extension/src/)
     - Database schema (database/migrations/)

2. **Architecture Planning**
   - Plan API endpoints needed in backend/api/
   - Design React components for dashboard/src/components/
   - Plan Chrome extension integration if applicable
   - Design database schema changes if needed

### 2. Backend Implementation
1. **API Development**
   - Create new API routes in backend/api/[feature-name]/
   - Add TypeScript interfaces to shared/src/types/
   - Implement proper error handling and validation
   - Add rate limiting if needed

2. **Database Integration**
   - Update Supabase queries in backend/src/utils/database.ts
   - Create migration if schema changes needed
   - Add proper RLS policies for data security

### 3. Frontend Implementation  
1. **Dashboard Components**
   - Create new components in dashboard/src/components/
   - Add new pages in dashboard/src/pages/ if needed
   - Implement proper TypeScript interfaces
   - Add loading states and error boundaries

2. **UI/UX Integration**
   - Follow existing design patterns from dashboard/src/components/ui/
   - Ensure responsive design for mobile/tablet
   - Add proper accessibility attributes
   - Integrate with existing authentication context

### 4. Chrome Extension Integration
1. **Extension Features**
   - Add new functionality to chrome-extension/src/
   - Update manifest.json permissions if needed
   - Implement messaging between content scripts and popup
   - Ensure compatibility with dashboard features

### 5. Testing Strategy
1. **Backend Testing**
   - Write API endpoint tests
   - Test authentication and authorization
   - Validate error handling and edge cases
   - Test database queries and migrations

2. **Frontend Testing**
   - Write component unit tests
   - Add integration tests for user flows
   - Test responsive design on different screen sizes
   - Validate accessibility with screen readers

3. **Extension Testing**
   - Test extension functionality in Chrome
   - Verify content script injection works
   - Test data synchronization with dashboard

### 6. Integration & Documentation
1. **Cross-Platform Integration**
   - Ensure data sync between dashboard and extension
   - Test complete user workflows
   - Validate API endpoints work from all clients
   - Check authentication flows across platforms

2. **Documentation**
   - Update API documentation for new endpoints
   - Add component documentation with usage examples
   - Update README files if needed
   - Document any new environment variables

## File Templates

### API Endpoint Template
```typescript
// backend/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  // Implementation
}
```

### React Component Template
```typescript
// dashboard/src/components/[FeatureName].tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FeatureNameProps {
  // Define props
}

export default function FeatureName({ }: FeatureNameProps) {
  // Implementation
}
```

## Completion Criteria
- [ ] Backend API endpoints implemented and tested
- [ ] Dashboard components created with proper TypeScript
- [ ] Chrome extension integration working (if applicable)
- [ ] Database migrations applied (if needed)
- [ ] Test coverage for all new functionality
- [ ] Documentation updated
- [ ] Feature works across all platforms
- [ ] Code review completed
- [ ] Ready for deployment