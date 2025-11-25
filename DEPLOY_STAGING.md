# Deploying to Staging - Updated Workflow

## Important: Staging Uses Built Files

The **staging repository** (`tmanina_staging.github.io`) contains the **built/exported files**, NOT the source code.

The **production repository** (`tmanina.github.io`) contains the source code and uses GitHub Actions to build automatically.

## Quick Deploy to Staging

Run this script to build and push to staging:

```bash
#!/bin/bash
# deploy-staging.sh

cd /Users/mr-root/tmaninacopy4

# Build the app
echo  "🔨 Building Next.js app..."
npm run build:gh

# Push built files to staging
echo "🚀 Deploying to staging..."
cd out
git init
git add -A
git commit -m "Deploy: $(date +%Y-%m-%d\ %H:%M:%S)"
git push -f https://github.com/tmanina/tmanina_staging.github.io.git HEAD:main

cd ..
echo "✅ Deployed to https://tmanina_staging.github.io/"
```

### Make it executable:
```bash
chmod +x deploy-staging.sh
```

### Then run it:
```bash
./deploy-staging.sh
```

---

## Manual Deployment Steps

### 1. Build the app:
```bash
cd /Users/mr-root/tmaninacopy4
npm run build:gh
```

### 2. Deploy to staging:
```bash
cd out
git init
git add -A
git commit -m "Deploy: $(date)"
git push -f https://github.com/tmanina/tmanina_staging.github.io.git HEAD:main
cd ..
```

### 3. Visit staging site:
https://tmanina_staging.github.io/

---

## Deploy to Production

Production works differently - just push source code:

```bash
cd /Users/mr-root/tmaninacopy4
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub Actions will build and deploy automatically.

---

## Workflow Summary

| Step | Staging | Production |
|------|---------|------------|
| **What to push** | Built files (`out/`) | Source code |
| **How to push** | Build script above | `git push origin main` |
| **Build process** | Local (your machine) | GitHub Actions (automatic) |
| **Testing** | https://tmanina_staging.github.io/ | Your production URL |

---

## Tips

- **Always test in staging before deploying to production**
- **Staging deploys are fast** (just pushing built files)
- **Production deploys take 2-3 minutes** (build time included)
- **You can create a deploy script** to automate the staging deployment

---

## Troubleshooting

### Staging site not updating?
1. Make sure you ran `npm run build:gh` first
2. Check that the push succeeded to `tmanina_staging.github.io`
3. Wait 1-2 minutes for GitHub Pages to update
4. Clear browser cache or use incognito mode

### Build failed?
```bash
# Try cleaning and rebuilding
rm -rf .next out
npm run build:gh
```

### Want to check what's in the out directory?
```bash
ls -la out/
```

You should see `index.html`, `_next/`, etc.
