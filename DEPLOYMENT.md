# Deployment Guide

This document explains how to deploy the tmanina application to both staging and production environments.

## Overview

We use a **dual-environment deployment strategy**:

- **Staging Environment**: Test changes before going live
  - Branch: `staging`
  - URL: https://tmanina.github.io/tmanina_staging
  - Repository: https://github.com/tmanina/tmanina_staging.github.io

- **Production Environment**: Live site for end users
  - Branch: `main`
  - URL: Your production domain
  - Repository: https://github.com/tmanina/tmanina.github.io

## Initial Setup

### 1. Create Staging Repository

1. Go to https://github.com/new
2. Create a new repository named `tmanina_staging.github.io`
3. Set it to **Public** (required for GitHub Pages on free plans)
4. Don't initialize with README, .gitignore, or license
5. Click "Create repository"

### 2. Enable GitHub Pages

For the **staging repository** (`tmanina_staging.github.io`):

1. Go to **Settings → Pages**
2. Under "Build and deployment"
3. Set **Source** to "GitHub Actions"
4. Save the settings

For the **main repository** (if not already configured):

1. Go to **Settings → Pages**
2. Set **Source** to "GitHub Actions"
3. Save the settings

### 3. Create Staging Branch

In your local repository:

```bash
# Create staging branch from main
git checkout -b staging

# Push to remote
git push -u origin staging
```

## Deployment Workflow

### Testing Changes (Staging)

1. **Make your changes** on a feature branch or directly on `staging`:
   ```bash
   git checkout staging
   # Make your changes
   git add .
   git commit -m "Your commit message"
   ```

2. **Push to staging**:
   ```bash
   git push origin staging
   ```

3. **Monitor deployment**:
   - Go to https://github.com/tmanina/tmanina.github.io/actions
   - Watch the "Deploy to Staging" workflow
   - Wait for it to complete (usually 2-3 minutes)

4. **Test on staging site**:
   - Visit https://tmanina.github.io/tmanina_staging
   - Test all your changes thoroughly
   - Check for errors in browser console
   - Test on different devices/browsers

### Deploying to Production

Once staging tests pass:

1. **Merge staging to main**:
   ```bash
   git checkout main
   git merge staging
   ```

2. **Push to production**:
   ```bash
   git push origin main
   ```

3. **Monitor deployment**:
   - Go to https://github.com/tmanina/tmanina.github.io/actions
   - Watch the "Deploy to Production" workflow
   - Wait for completion

4. **Verify production**:
   - Visit your production site
   - Confirm changes are live and working

## Manual Deployment

You can also trigger deployments manually from GitHub:

1. Go to **Actions** tab in your repository
2. Select either "Deploy to Staging" or "Deploy to Production"
3. Click "Run workflow"
4. Select the branch
5. Click "Run workflow" button

## Build Commands

Local development and testing:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build and export static files (what GitHub Actions uses)
npm run build:gh
```

## Troubleshooting

### Deployment Failed

1. Check the GitHub Actions logs:
   - Go to **Actions** tab
   - Click on the failed workflow
   - Review the error messages

2. Common issues:
   - **Build errors**: Fix syntax errors or missing dependencies
   - **Permission errors**: Ensure GitHub Pages is enabled
   - **Deployment timeout**: Try running the workflow again

### Staging Site Not Updating

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check workflow status**: Ensure deployment completed successfully
3. **Verify branch**: Make sure you pushed to the `staging` branch
4. **Check GitHub Pages settings**: Ensure source is set to "GitHub Actions"

### Changes Not Appearing in Production

1. **Verify merge**: Ensure staging was merged to main
2. **Check deployment**: Look at GitHub Actions for the main branch
3. **Wait for propagation**: GitHub Pages can take a few minutes to update
4. **Clear cache**: Try in incognito/private browsing mode

### Build Errors

If you encounter build errors:

1. **Test locally first**:
   ```bash
   npm run build:gh
   ```

2. **Check for errors** in the terminal output
3. **Fix issues** before pushing
4. **Verify dependencies** are installed:
   ```bash
   npm install
   ```

## Best Practices

1. **Always test in staging first** - Never push directly to main
2. **Review changes carefully** - Check the staging site thoroughly
3. **Keep staging updated** - Regularly sync staging with main
4. **Document changes** - Use clear commit messages
5. **Monitor deployments** - Watch the GitHub Actions logs
6. **Test on multiple devices** - Check mobile, tablet, and desktop
7. **Check browser console** - Look for JavaScript errors

## Workflow Files

- **Staging**: `.github/workflows/deploy-staging.yml`
- **Production**: `.github/workflows/deploy.yml`

Both workflows:
- Build the Next.js application
- Export static files to `out/` directory
- Deploy to GitHub Pages
- Can be triggered manually or automatically on push

## Environment Variables

Currently, no environment variables are required for deployment. The workflows use:
- `NODE_ENV=staging` for staging builds (informational only)
- Default production settings for main branch builds

If you need to add environment variables:
1. Go to **Settings → Secrets and variables → Actions**
2. Add your secrets
3. Reference them in the workflow files using `${{ secrets.YOUR_SECRET }}`

## Support

If you encounter issues not covered here:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the [Next.js deployment guide](https://nextjs.org/docs/pages/building-your-application/deploying)
3. Check the repository issues for similar problems
