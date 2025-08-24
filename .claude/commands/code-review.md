# /code-review
Perform comprehensive code review for netpost project following our TypeScript/React standards.

## Review Checklist
1. **Code Quality**
   - Check TypeScript compilation: `npm run build` in affected directories (backend/dashboard/chrome-extension)
   - Verify ESLint passes: `npx eslint . --ext .ts,.tsx,.js,.jsx`
   - Verify Prettier formatting: `npx prettier --check .`
   - Ensure proper error handling and loading states in React components

2. **Testing Coverage**
   - Run test suite: `npm test` in each project directory
   - Verify critical API endpoints have tests (backend/api/)
   - Check React components have proper test coverage (dashboard/src/components/)
   - Validate Chrome extension functionality tests

3. **Security & Performance**
   - Review for SQL injection vulnerabilities in Supabase queries
   - Check authentication flows in backend/api/auth/
   - Validate CORS configuration in backend/src/middleware/cors.ts
   - Review rate limiting in backend/src/middleware/rateLimiting.ts
   - Check for XSS vulnerabilities in React components

4. **Architecture Compliance**
   - Verify proper separation between backend API, dashboard frontend, and Chrome extension
   - Check database schema migrations in database/migrations/
   - Validate shared types usage from shared/src/types/
   - Ensure proper Vercel deployment configuration

5. **Documentation & Standards**
   - Check if README files are up to date
   - Validate API endpoint documentation
   - Ensure component props are properly typed with TypeScript interfaces
   - Verify Chrome extension manifest.json is correct

## Post-Review Actions
- Generate summary of findings with file:line references
- Create GitHub issues for any critical vulnerabilities
- Update deployment status if review passes