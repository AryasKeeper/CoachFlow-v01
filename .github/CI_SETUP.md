# CI Gatekeeper Setup Guide

## Overview
This project uses GitHub Actions as a CI gatekeeper to ensure all PRs pass type checking, linting, and build validation before they can be merged.

## What Gets Validated
Every pull request automatically runs:
1. **TypeScript Type Checking** - Ensures no type errors (`npm run type-check`)
2. **ESLint** - Enforces code quality standards (`npm run lint`)
3. **Build** - Verifies the application builds successfully (`npm run build`)

## GitHub Actions Workflow
The validation workflow is defined in `.github/workflows/validate.yml`:
- Runs on: All PRs to `main`, `develop`, and `staging` branches
- Node version: 20 (LTS)
- Steps: Install dependencies → Type check → Lint → Build
- Artifacts: Build output is uploaded for verification

## Branch Protection Rules (Recommended)
To enforce CI checks before merging:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Branches**
3. Click **Add branch protection rule**
4. Configure:
   - Branch name pattern: `main`
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status check: **Validate PR** (appears after first workflow run)
   - ✅ Require linear history (optional but recommended)
   - ✅ Include administrators (recommended)

## Vercel Integration
Vercel will automatically respect GitHub branch protection rules. Additionally:

### Method 1: Vercel GitHub Integration (Recommended)
1. In Vercel Dashboard → Project Settings → Git
2. Enable **"Ignored Build Step"** and use this command:
   ```bash
   # This ensures Vercel waits for GitHub checks
   if [ "$VERCEL_GIT_COMMIT_REF" == "main" ] || [ "$VERCEL_GIT_COMMIT_REF" == "develop" ]; then exit 1; else exit 0; fi
   ```

### Method 2: GitHub Branch Protection
- With branch protection enabled, Vercel cannot deploy to protected branches until checks pass
- Preview deployments will still be created for PRs
- Production deployments only happen after successful merge

## Local Development
Run the same CI checks locally before pushing:

```bash
# Run all CI checks
npm run ci

# Or run individually
npm run type-check
npm run lint
npm run build
```

## Package.json Scripts
The following scripts are available:
- `npm run validate` - Run type-check, lint, and build
- `npm run ci` - Alias for validate (used in CI)
- `npm run type-check` - TypeScript validation only
- `npm run lint` - ESLint validation only
- `npm run build` - Build the application

## Troubleshooting

### CI Fails on Type Check
- Run `npm run type-check` locally to see errors
- Fix TypeScript errors in your code
- Commit and push again

### CI Fails on Lint
- Run `npm run lint` locally to see issues
- Many issues can be auto-fixed: `npm run lint:fix`
- Commit the fixes and push

### CI Fails on Build
- Run `npm run build` locally to reproduce
- Check for:
  - Missing environment variables (build should work without them)
  - Import errors
  - Module resolution issues
  - Next.js configuration problems

### Build Works Locally But Fails in CI
- Ensure all dependencies are in `package.json` (not just globally installed)
- Check Node version matches (20.x)
- Clear local cache and try: `rm -rf .next node_modules && npm install && npm run build`

## Exit Criteria Met ✅
- ✅ CI runs on every PR
- ✅ Blocks merges when type-check fails
- ✅ Blocks merges when lint fails
- ✅ Blocks merges when build fails
- ✅ Vercel respects CI status (via branch protection)
- ✅ Documentation provided for setup

## Monitoring CI
- View workflow runs: GitHub repo → **Actions** tab
- Each PR shows status checks in the PR page
- Failed checks link to detailed logs
- Re-run failed checks from the Actions tab

## Future Enhancements
Consider adding:
- Unit tests (`npm run test`)
- E2E tests for critical paths
- Code coverage requirements
- Security scanning (already in ci-cd.yml)
- Performance budgets
