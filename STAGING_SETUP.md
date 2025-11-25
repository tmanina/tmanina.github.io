# Quick Setup Guide for Staging Repository

Follow these exact steps to create and configure your staging repository:

## Step 1: Create the Staging Repository

1. **Go to GitHub**: https://github.com/new

2. **Fill in the details:**
   - **Owner**: Select `tmanina`
   - **Repository name**: `tmanina_staging.github.io` (exactly this name)
   - **Description**: `Staging environment for tmanina Islamic web app`
   - **Visibility**: **Public** ✓ (required for GitHub Pages)
   - **Initialize**: Leave all checkboxes UNCHECKED ❌
     - ❌ Do NOT add README
     - ❌ Do NOT add .gitignore
     - ❌ Do NOT choose a license

3. **Click "Create repository"**

## Step 2: Enable GitHub Pages

1. **In the new repository**, go to: **Settings** → **Pages**

2. **Under "Build and deployment":**
   - **Source**: Select **"Deploy from a branch"**
   - **Branch**: Select **"main"** (after first deployment)
   - **Folder**: Select **"/ (root)"**

3. **Save** the settings

## Step 3: Trigger First Deployment

Now push to the staging branch to trigger the deployment:

```bash
cd /Users/mr-root/tmaninacopy4

# Create a test commit on staging
git checkout staging
echo "# Test Deployment" >> TEST.md
git add TEST.md
git commit -m "Test: trigger first staging deployment"
git push origin staging
```

## Step 4: Monitor the Deployment

1. **Go to Actions**:https://github.com/tmanina/tmanina.github.io/actions

2. **Watch for**: "Deploy to Staging (tmanina_staging.github.io)" workflow

3. **Wait**: 2-3 minutes for completion

4. **Check status**: Should show green checkmark ✓

## Step 5: Verify Staging Site

After deployment completes:

1. **Visit**: https://tmanina_staging.github.io/
2. **You should see**: Your Islamic app (same as production but from staging branch)
3. **If 404**: Wait 2-3 more minutes for GitHub Pages to propagate

## Troubleshooting

### If the workflow fails:

1. Check the error in GitHub Actions logs
2. Make sure the repository `tmanina_staging.github.io` exists and is public
3. Ensure GitHub Actions is enabled in repository settings

### If you still get 404 after 10 minutes:

1. Go to the staging repository: https://github.com/tmanina/tmanina_staging.github.io
2. Check if files were pushed (should see index.html, _next/, etc.)
3. Verify Settings → Pages is enabled with "main" branch selected

### If you get permission errors:

The workflow uses the built-in `GITHUB_TOKEN` which should have permissions automatically. If it fails:
1. Go to your main repository Settings → Actions → General
2. Under "Workflow permissions", ensure "Read and write permissions" is selected
3. Save and re-run the workflow

## What Happens Next?

Once this is working:

- **Staging**: Push to `staging` branch → Deploys to https://tmanina_staging.github.io/
- **Production**: Push to `main` branch → Deploys to your production site

You can test all changes on staging before promoting to production!
