# Vercel Deployment Requirements & Best Practices

## 🚨 CRITICAL VERCEL REQUIREMENTS

### **1. Serverless Function Format**
```javascript
// ✅ CORRECT - Vercel Standard Format
export default async function handler(req, res) {
  try {
    // Function logic here
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ❌ WRONG - CommonJS format
module.exports = async (req, res) => {
  // This can cause FUNCTION_INVOCATION_FAILED
}
```

### **2. ES Module Configuration**
```json
// api/package.json - REQUIRED for serverless functions
{
  "type": "module"
}

// Root package.json - Keep CommonJS for local server
{
  "main": "server-simple.js"
  // NO "type": "module" here
}
```

### **3. Error Handling Requirements**
```javascript
// ✅ REQUIRED - Always return responses
export default async function handler(req, res) {
  try {
    const result = await someAsyncOperation();
    return res.json(result); // ✅ MUST use return
  } catch (error) {
    return res.status(500).json({ error: error.message }); // ✅ MUST use return
  }
}

// ❌ WRONG - Missing return statements
export default async function handler(req, res) {
  try {
    const result = await someAsyncOperation();
    res.json(result); // ❌ Missing return - causes FUNCTION_INVOCATION_FAILED
  } catch (error) {
    res.status(500).json({ error: error.message }); // ❌ Missing return
  }
}
```

### **4. Timeout Protection**
```javascript
// ✅ REQUIRED - Add timeout for external API calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { 'User-Agent': 'App-Name/1.0' }
  });
  clearTimeout(timeoutId);
  // Process response
} catch (fetchError) {
  clearTimeout(timeoutId);
  if (fetchError.name === 'AbortError') {
    throw new Error('Request timed out');
  }
  throw fetchError;
}
```

### **5. Node.js Version Requirements**
```json
// package.json - REQUIRED
{
  "engines": {
    "node": "22.x" // Vercel requires 22.x (18.x is discontinued)
  }
}
```

### **6. Built-in Fetch Usage**
```javascript
// ✅ CORRECT - Use built-in fetch (available in Node.js 22.x)
const response = await fetch(url);

// ❌ WRONG - Don't import node-fetch
import fetch from 'node-fetch'; // This can cause issues
```

### **7. CORS Headers**
```javascript
// ✅ REQUIRED - Always set CORS headers
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // ... rest of function
}
```

### **8. Environment Variables**
```javascript
// ✅ CORRECT - Use process.env with fallbacks
const apiKey = process.env.API_KEY || 'fallback-key';

// ❌ WRONG - Don't assume environment variables exist
const apiKey = process.env.API_KEY; // Could be undefined
```

## 🔍 PRE-COMMIT CHECKLIST

### **Before Every Commit to GitHub:**

1. **Syntax Validation**
   ```bash
   node -c api/weather.js
   node -c api/config.js
   node -c server-simple.js
   ```

2. **Function Format Check**
   - [ ] Uses `export default async function handler(req, res)`
   - [ ] All response calls use `return`
   - [ ] Proper try/catch blocks
   - [ ] Timeout protection for external calls

3. **Module System Check**
   - [ ] `api/package.json` has `"type": "module"`
   - [ ] Root `package.json` does NOT have `"type": "module"`
   - [ ] No CommonJS syntax in API functions

4. **Error Handling Check**
   - [ ] No unhandled promise rejections
   - [ ] All async operations wrapped in try/catch
   - [ ] Proper error responses with status codes

5. **Vercel Configuration**
   - [ ] `vercel.json` properly configured
   - [ ] Function timeouts set appropriately
   - [ ] No conflicting environment variables

## 🚨 COMMON CAUSES OF FUNCTION_INVOCATION_FAILED

1. **Missing Return Statements** - Most common cause
2. **Unhandled Promise Rejections** - Async operations without try/catch
3. **Infinite Loops** - Blocking operations
4. **Missing Environment Variables** - Undefined values causing errors
5. **Wrong Module Format** - CommonJS instead of ES modules
6. **Timeout Issues** - External API calls without timeout protection
7. **Memory Issues** - Large data processing without limits

## 📋 DEBUGGING STEPS

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Functions tab
   - Look for specific error messages
   - Check function invocation logs

2. **Test Locally**
   ```bash
   vercel dev  # Test serverless functions locally
   ```

3. **Add Debug Logging**
   ```javascript
   console.log('Function called:', req.method, req.url);
   console.log('Environment check:', process.env.NODE_ENV);
   ```

4. **Validate Function Structure**
   - Ensure proper export format
   - Check all return statements
   - Verify error handling

## 🎯 BEST PRACTICES

1. **Always use return statements** for responses
2. **Wrap all async operations** in try/catch
3. **Add timeout protection** for external calls
4. **Use built-in fetch** (Node.js 22.x)
5. **Set proper CORS headers**
6. **Provide fallback values** for environment variables
7. **Test locally** before deploying
8. **Monitor Vercel logs** after deployment

## 🔧 QUICK FIXES

### **If FUNCTION_INVOCATION_FAILED occurs:**

1. **Check for missing returns**
2. **Add proper error handling**
3. **Verify module format**
4. **Check environment variables**
5. **Add timeout protection**
6. **Review Vercel logs**

---

**Remember: Every commit should be Vercel-ready!** 🚀
