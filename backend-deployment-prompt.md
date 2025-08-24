# Backend Deployment Preparation Prompt

I need you to prepare this backend for production deployment following developer best practices. This project has automated hooks and custom slash commands configured to streamline the deployment process.

## Available Tools & Automation

### Custom Slash Commands
- `/code-review` - Comprehensive code review with TypeScript/React standards
- `/deploy-prep` - Complete pre-deployment checklist for all components
- `/fix-issue [number]` - Automated GitHub issue resolution workflow

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
- Check TypeScript compilation across all directories
- Verify ESLint and Prettier compliance
- Run comprehensive test coverage analysis
- Review security vulnerabilities and performance
- Generate detailed findings with file:line references

**Then use the deployment preparation command:**
```
/deploy-prep
```

This will systematically validate:
- Backend API testing and security audit
- Database connections and migrations
- Environment configuration
- Build processes and error handling

## Manual Steps (if needed)

If custom commands don't cover specific issues, use agents for:

1. **Code Review Agent**: Focus on security vulnerabilities, API design, error handling, database queries, authentication flows, and performance issues.

2. **Fix Implementation Agent**: Implement all fixes identified in the review (hooks will auto-format and test changes).

3. **Testing Agent**: Create comprehensive test coverage (hooks will run tests automatically as you code).

4. **Security Audit Agent**: Audit for SQL injection, authentication bypasses, CORS configuration, input validation, rate limiting, and secrets management.

5. **Deployment Verification Agent**: Verify build processes, environment configuration, Supabase integration, error logging setup.

## Benefits of Using Custom Commands

- **Consistency**: Standardized review process across all deployments
- **Speed**: Pre-configured workflows eliminate setup time  
- **Quality**: Hooks ensure code is automatically formatted and tested
- **Safety**: Security hooks prevent accidental critical file modifications
- **Traceability**: Automated git commits provide change history

Start with `/code-review` to leverage the full automated workflow, then proceed with `/deploy-prep` for comprehensive validation.