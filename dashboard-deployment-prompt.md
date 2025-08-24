# Dashboard Deployment Preparation Prompt

I need you to prepare this dashboard frontend for production deployment following developer best practices. This project has automated hooks and custom slash commands configured to streamline the deployment process.

## Available Tools & Automation

### Custom Slash Commands
- `/code-review` - Comprehensive code review with TypeScript/React standards
- `/deploy-prep` - Complete pre-deployment checklist for all components  
- `/new-feature [name]` - Full-stack feature development workflow
- `/create-migration [description]` - Database migration creation process

### Automated Hooks
- **Auto-formatting**: Prettier + ESLint run automatically after editing .ts/.tsx/.js/.jsx files
- **Auto-testing**: Test suite runs in background after editing source files
- **Security validation**: Prevents editing critical files (.env, package-lock.json, etc.)
- **Git automation**: Auto-commits changes when session ends

## Deployment Process

**Start with the code review using our custom command:**
```
/code-review
```

This will automatically:
- Check TypeScript compilation for dashboard, backend, and chrome-extension
- Verify ESLint and Prettier compliance across all TypeScript/React files
- Run comprehensive test coverage analysis for all components
- Review React best practices, accessibility, and security (XSS prevention)
- Generate detailed findings with file:line references

**Then use the deployment preparation command:**
```
/deploy-prep
```

This will systematically validate:
- Dashboard frontend build and testing
- Performance optimization and bundle analysis  
- API endpoint configuration and authentication flows
- Mobile responsiveness and accessibility
- Production environment configuration

## Manual Steps (if needed)

If custom commands don't cover specific issues, use agents for:

1. **Frontend Code Review Agent**: Focus on React best practices, component architecture, state management, performance optimization, accessibility, TypeScript usage, and XSS prevention.

2. **Fix Implementation Agent**: Implement all fixes identified in the review (hooks will auto-format and test changes).

3. **Testing Agent**: Create comprehensive test suite including component tests, integration tests for API calls, user interaction tests, form validation tests, and accessibility tests.

4. **Performance Optimization Agent**: Analyze bundle size, implement code splitting, optimize images, add proper caching strategies, and ensure mobile responsiveness.

5. **Deployment Verification Agent**: Verify build processes, environment variables, API endpoint configuration, SEO optimization, and create production deployment checklist.

## Advanced Workflows

For ongoing development after deployment:

**Adding new features:**
```
/new-feature [feature-name]
```
Provides complete scaffolding for backend API, dashboard components, Chrome extension integration, and database changes.

**Database changes:**
```
/create-migration [description]  
```
Handles Supabase migration creation with proper RLS policies, TypeScript updates, and testing procedures.

## Benefits of Using Custom Commands

- **Consistency**: Standardized review and deployment process
- **Speed**: Pre-configured workflows eliminate manual setup
- **Quality**: Hooks ensure automatic formatting, testing, and validation
- **Safety**: Security hooks prevent critical file modifications
- **Full-stack Coverage**: Commands handle backend, frontend, and database concerns
- **Traceability**: Automated git commits provide change history

## Integration Benefits

The custom commands are aware of your project structure:
- **Multi-directory support**: Handles backend/, dashboard/, chrome-extension/
- **Shared types**: Understands shared/src/types/ TypeScript interfaces
- **Database integration**: Works with Supabase migrations and RLS policies
- **Testing integration**: Runs appropriate tests for each component

Start with `/code-review` to leverage the full automated workflow, then proceed with `/deploy-prep` for comprehensive validation.