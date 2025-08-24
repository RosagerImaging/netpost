# /fix-issue
Find and fix GitHub issue #$ARGUMENTS following netpost development workflow.

## Process
1. **Understand Issue**
   - Run `gh issue view $ARGUMENTS` to get details
   - Read issue description and reproduction steps
   - Check labels to determine if it's backend, dashboard, or chrome-extension related
   - Review related issues or discussions

2. **Create Branch**
   - Create feature branch: `git checkout -b fix-issue-$ARGUMENTS`
   - If working in worktrees, switch to appropriate directory:
     - Backend issues: `cd ../netpost-backend`
     - Dashboard issues: `cd ../netpost-dashboard` 
     - Extension issues: `cd ../netpost-chrome-extension`

3. **Locate & Analyze**
   - For backend API issues: Check backend/api/ endpoints
   - For dashboard UI issues: Check dashboard/src/components/ and dashboard/src/pages/
   - For extension issues: Check chrome-extension/src/
   - For database issues: Review database/migrations/ and Supabase queries
   - For shared logic: Check shared/src/

4. **Implement Solution**
   - Fix the root cause, not just symptoms
   - Update TypeScript interfaces in shared/src/types/ if data structures changed
   - Add proper error handling and user feedback
   - Ensure fix works across all environments (dev, staging, production)

5. **Testing & Validation**
   - Add regression test to prevent issue recurrence
   - Test locally with `npm run dev` in affected directories
   - Verify fix works in both development and production builds
   - Test Chrome extension in browser if applicable

6. **Documentation & PR**
   - Update relevant documentation if needed
   - Create PR with conventional commit format: `fix: resolve issue #$ARGUMENTS`
   - Link PR to original issue: `Closes #$ARGUMENTS`
   - Include testing instructions in PR description
   - Request review from appropriate team members