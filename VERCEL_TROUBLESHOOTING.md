# 🔧 Vercel Weather App Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue #1: Geolocation Not Working**

#### **Symptoms:**
- "Location access denied" error
- App stuck on "Getting your location..."
- No weather data displayed

#### **Solutions:**

**1. Check HTTPS**
```javascript
// Geolocation requires HTTPS on Vercel
// Your app should be at: https://your-app.vercel.app
```

**2. Browser Permissions**
- Click the lock icon in browser address bar
- Allow location access
- Refresh the page

**3. Test Geolocation**
```javascript
// Open browser console and test:
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('Location:', pos.coords),
  (err) => console.error('Error:', err)
);
```

### **Issue #2: API Endpoints Not Working**

#### **Symptoms:**
- "Failed to fetch weather data" error
- 404 errors in console
- Network errors

#### **Solutions:**

**1. Check API Endpoints**
Visit these URLs on your Vercel app:
- `https://your-app.vercel.app/api/debug`
- `https://your-app.vercel.app/api/cache/status`

**2. Verify vercel.json**
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

**3. Check Server Logs**
- Go to Vercel Dashboard
- Click on your project
- Go to "Functions" tab
- Check server logs for errors

### **Issue #3: Redis Connection Issues**

#### **Symptoms:**
- App works but no caching
- Redis connection errors in logs
- Slow response times

#### **Solutions:**

**1. Check Redis Configuration**
```javascript
// In server.js, Redis will work without connection
// App will run without cache if Redis fails
```

**2. Add Redis to Vercel (Optional)**
- Go to Vercel Dashboard
- Add Redis addon
- Set environment variable: `REDIS_URL`

**3. Test Without Redis**
- App should work fine without Redis
- Just won't have caching benefits

### **Issue #4: Build/Deployment Issues**

#### **Symptoms:**
- Build fails on Vercel
- Deployment errors
- App doesn't load

#### **Solutions:**

**1. Check package.json**
```json
{
  "scripts": {
    "build": "echo 'No build step needed'",
    "vercel-build": "echo 'Vercel build completed'"
  }
}
```

**2. Verify Dependencies**
```bash
# Make sure all dependencies are in package.json
npm install
npm list
```

**3. Check vercel.json**
```json
{
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ]
}
```

## 🔍 **Debugging Steps**

### **Step 1: Check Basic Functionality**

**1. Visit Debug Endpoint**
```
https://your-app.vercel.app/api/debug
```

**Expected Response:**
```json
{
  "environment": "production",
  "vercel": "1",
  "port": "3000",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "redis": {
    "connected": false,
    "status": "disconnected"
  }
}
```

**2. Test Weather API**
```
https://your-app.vercel.app/api/weather?latitude=40.7128&longitude=-74.0060
```

**Expected Response:**
```json
{
  "isRaining": false,
  "temperature": 20,
  "weatherDescription": "Clear sky",
  "precipitation": 0,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### **Step 2: Check Browser Console**

**1. Open Developer Tools**
- Press F12 or right-click → Inspect
- Go to Console tab

**2. Look for Errors**
- Red error messages
- Network failures
- JavaScript errors

**3. Check Network Tab**
- Go to Network tab
- Refresh page
- Look for failed requests

### **Step 3: Test Geolocation**

**1. Check Permissions**
```javascript
// In browser console:
navigator.permissions.query({name: 'geolocation'})
  .then(result => console.log('Permission:', result.state));
```

**2. Test Geolocation**
```javascript
// In browser console:
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('Success:', pos.coords),
  (err) => console.error('Error:', err)
);
```

## 🛠️ **Quick Fixes**

### **Fix #1: Force HTTPS**
```javascript
// Add to index.html head
<script>
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
</script>
```

### **Fix #2: Add Error Boundaries**
```javascript
// Add to script.js
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});
```

### **Fix #3: Test with Manual Coordinates**
```javascript
// Add to script.js for testing
// Replace getCurrentPosition with:
const testCoords = { coords: { latitude: 40.7128, longitude: -74.0060 } };
this.fetchWeatherData(testCoords.coords.latitude, testCoords.coords.longitude);
```

## 📊 **Monitoring & Logs**

### **Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Check "Functions" tab for server logs
4. Check "Analytics" tab for performance

### **Browser Console**
1. Open Developer Tools (F12)
2. Check Console for errors
3. Check Network for failed requests
4. Check Application → Local Storage

### **Server Logs**
```javascript
// Add to server.js for better logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## 🚀 **Testing Checklist**

### **Before Deployment**
- [ ] App works locally (`npm start`)
- [ ] All dependencies installed
- [ ] No console errors
- [ ] Geolocation works on localhost

### **After Deployment**
- [ ] App loads at Vercel URL
- [ ] Debug endpoint works: `/api/debug`
- [ ] Weather API works: `/api/weather?latitude=40.7128&longitude=-74.0060`
- [ ] Geolocation permission prompt appears
- [ ] Weather data displays after location access
- [ ] No console errors in browser
- [ ] Mobile responsive design works

### **Common Test Coordinates**
```javascript
// New York City
latitude: 40.7128, longitude: -74.0060

// London
latitude: 51.5074, longitude: -0.1278

// Tokyo
latitude: 35.6762, longitude: 139.6503
```

## 🆘 **Emergency Fixes**

### **If Nothing Works**
1. **Redeploy**: Push a small change to trigger redeploy
2. **Check Vercel Status**: https://vercel-status.com
3. **Rollback**: Revert to previous working version
4. **Contact Support**: Vercel support if needed

### **Quick Rollback**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

**Your weather app should work perfectly on Vercel! 🌧️☀️**
