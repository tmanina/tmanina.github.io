# How to Fix the Permission Error

## The Problem

The workflow is getting a **403 Permission Denied** error because the built-in `GITHUB_TOKEN` doesn't have permission to push to a different repository (`tmanina_staging.github.io`).

**Error:**
```
remote: Permission to tmanina/tmanina_staging.github.io.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/tmanina/tmanina_staging.github.io.git/': The requested URL returned error: 403
```

## The Solution

You need to create a **Personal Access Token (PAT)** and add it as a secret.

---

## Step-by-Step Fix

### Step 1: Create a Personal Access Token

1. **Go to:** https://github.com/settings/tokens/new

2. **Fill in the details:**
   - **Note**: `Staging Deployment Token`
   - **Expiration**: Choose `90 days` or longer
   - **Select scopes:**
     - ✅ Check **`repo`** (Full control of private repositories)
     
3. **Click** "Generate token"

4. **IMPORTANT:** Copy the token NOW - you won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Step 2: Add Token as a Secret

1. **Go to:** https://github.com/tmanina/tmanina.github.io/settings/secrets/actions

2. **Click** "New repository secret"

3. **Fill in:**
   - **Name**: `STAGING_PAT` (exactly this name)
   - **Secret**: Paste the token you copied

4. **Click** "Add secret"

---

### Step 3: Push the Updated Workflow

I've already updated the workflow to use this token. You just need to push it:

```bash
cd /Users/mr-root/tmaninacopy4
git add .github/workflows/deploy-staging.yml
git commit -m "Fix: Use PAT for cross-repository deployment"
git push origin staging
```

---

### Step 4: Verify Deployment

After pushing:

1. **Go to:** https://github.com/tmanina/tmanina.github.io/actions
2. **Watch:** The new workflow run
3. **Expected:** Green checkmark ✓
4. **Check:** https://github.com/tmanina/tmanina_staging.github.io should have files
5. **Visit:** https://tmanina_staging.github.io/ (wait 2-3 minutes)

---

## Quick Reference

| What | Where |
|------|-------|
| Create PAT | https://github.com/settings/tokens/new |
| Add Secret | https://github.com/tmanina/tmanina.github.io/settings/secrets/actions |
| Secret Name | `STAGING_PAT` |
| Scope | `repo` |

---

## Why This is Needed

- `GITHUB_TOKEN` only has permission for the current repository
- To push to `tmanina_staging.github.io`, you need a PAT with `repo` scope
- The PAT authenticates as YOU, not as github-actions[bot]
- This allows writing to any repository you own

---

## Security Note

- The PAT gives write access to ALL your repositories
- Keep it secret - never commit it to code
- GitHub Actions secrets are encrypted and safe
- Set an expiration date and regenerate periodically
