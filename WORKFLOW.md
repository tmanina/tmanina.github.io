# Two Repository Workflow

## Overview

You now have two separate repositories:

- **Staging**: https://github.com/tmanina/tmanina_staging.github.io
- **Production**: https://github.com/tmanina/tmanina.github.io

## Daily Workflow

### 1. Test Changes in Staging

Work in your local copy and push to staging:

```bash
cd /Users/mr-root/tmaninacopy4

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Feature: your description"

# Push to STAGING repository
git push staging main:main
```

**Test at**: https://tmanina_staging.github.io/

### 2. Deploy to Production

When staging tests pass:

```bash
# Push to PRODUCTION repository
git push origin main
```

**Live at**: Your production site

## Repository Remotes

Check configured remotes:

```bash
git remote -v
```

Should show:
- `origin` → Production repository
- `staging` → Staging repository

## Push Commands Reference

| Command | Destination | Purpose |
|---------|-------------|---------|
| `git push staging main:main` | Staging | Test changes |
| `git push origin main` | Production | Deploy live |
| `git push staging main:main -f` | Staging | Force update staging |

## Setting Up GitHub Pages

### For Staging Repository

1. Go to: https://github.com/tmanina/tmanina_staging.github.io/settings/pages
2. Source: GitHub Actions
3. Wait for deployment (~2-3 minutes)
4. Visit: https://tmanina_staging.github.io/

### For Production Repository

Already configured (no changes needed)

## Benefits

✅ **Simple**: Just two separate repos
✅ **Independent**: Changes in staging don't affect production  
✅ **Safe**: Test thoroughly before deploying  
✅ **No branches needed**: Everything on `main`  
✅ **No tokens needed**: Standard GitHub workflow  

## Quick Commands

**Push to both:**
```bash
git push staging main:main && git push origin main
```

**Check what remote you're pushing to:**
```bash
git remote get-url staging
git remote get-url origin
```

**Remove staging remote (if needed):**
```bash
git remote remove staging
```

**Add staging remote again:**
```bash
git remote add staging https://github.com/tmanina/tmanina_staging.github.io.git
```
