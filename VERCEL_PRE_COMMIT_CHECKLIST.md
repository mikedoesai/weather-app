# 🔍 Vercel Pre-Commit Checklist

## Before Every GitHub Commit - Vercel Deployment Validation

### 1. Configuration Validation
- [ ] **vercel.json Structure**
  - [ ] No conflicting `builds` and `functions` configurations
  - [ ] Uses modern Vercel configuration (version 2)
  - [ ] Proper function duration limits (max 30s for Hobby plan)
  - [ ] Correct routing patterns

- [ ] **API Structure**
  - [ ] Uses `api/` directory for serverless functions
  - [ ] Functions export properly (module.exports = handler)
  - [ ] CORS headers set correctly
  - [ ] OPTIONS method handled for preflight requests

### 2. Dependencies Check
- [ ] **Package.json Validation**
  - [ ] All dependencies are Vercel-compatible
  - [ ] No Redis or external database dependencies
  - [ ] Node.js version specified (22.x recommended)
  - [ ] No conflicting package versions

- [ ] **Runtime Dependencies**
  - [ ] Only use supported runtimes (@vercel/node)
  - [ ] No global package installations
  - [ ] All packages listed in package.json

### 3. File Structure Validation
- [ ] **Static Files**
  - [ ] All static files in `public/` directory
  - [ ] No server-side files in public directory
  - [ ] Proper file permissions

- [ ] **Serverless Functions**
  - [ ] Functions in `api/` directory
  - [ ] Proper export structure
  - [ ] No file system writes (read-only)

### 4. Common Vercel Errors to Avoid
- [ ] **Conflicting Configuration**
  - [ ] No `builds` array when using `functions`
  - [ ] No duplicate route definitions
  - [ ] Proper environment variable configuration

- [ ] **Function Limitations**
  - [ ] No file system writes
  - [ ] No persistent connections
  - [ ] Proper error handling
  - [ ] Timeout considerations

### 5. Documentation References
- [ ] **Vercel Documentation Checked**
  - [ ] [Error List](https://vercel.com/docs/errors/error-list)
  - [ ] [Functions Configuration](https://vercel.com/docs/functions)
  - [ ] [Build Configuration](https://vercel.com/docs/builds)
  - [ ] [Routing Configuration](https://vercel.com/docs/routing)

### 6. Testing Before Commit
- [ ] **Local Testing**
  - [ ] `vercel dev` runs without errors
  - [ ] All API endpoints respond correctly
  - [ ] Static files serve properly
  - [ ] No console errors

- [ ] **Configuration Testing**
  - [ ] vercel.json syntax is valid
  - [ ] No circular dependencies
  - [ ] Proper environment variable usage

## Quick Reference Commands

```bash
# Validate vercel.json syntax
npx vercel --version

# Test locally
vercel dev

# Check for common issues
npm audit
npm outdated
```

## Emergency Rollback Plan
- [ ] Keep previous working commit hash
- [ ] Document what changes were made
- [ ] Have rollback strategy ready
- [ ] Test rollback locally if possible

---

**Remember:** Always check the [Vercel Error List](https://vercel.com/docs/errors/error-list) before committing to avoid common deployment failures.
