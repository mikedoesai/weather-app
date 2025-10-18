# Rain Check Weather App - Testing Guide

## 🚨 IMPORTANT: This file should NEVER be committed to GitHub
Add this to your `.gitignore` file to prevent accidental commits of sensitive testing information.

## 📋 Pre-Testing Setup

### 1. Update Supabase Database
- [ ] Go to Supabase dashboard → SQL Editor
- [ ] Copy and paste contents of `database-schema-safe.sql`
- [ ] Click "Run" to execute the schema update
- [ ] Verify RLS policies are enabled

### 2. Create Local Config File
```bash
cp public/config.example.js public/config.js
```

### 3. Update Config with Actual Credentials
Edit `public/config.js` and replace:
- `YOUR_OPENWEATHER_API_KEY_HERE` → `5fcfc173deb068b3716c14a2d27c8ee3`
- `YOUR_SUPABASE_URL_HERE` → `https://tzhzfiiwecohdkmxvol.supabase.co`
- `YOUR_SUPABASE_ANON_KEY_HERE` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aHpmaXlpd2Vjb2hka214dm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTk3MDgsImV4cCI6MjA3NjI3NTcwOH0.KIgVbyEw8DeaZlKBCZie-8qu9v4Bz9UZDTpwV5UeCek`
- `YOUR_ADMIN_PASSWORD_HERE` → `raincheck2024`

### 4. Start Local Server
```bash
npm start
```
**Note**: If port 3000 is in use, kill the existing process or use a different port.

## 🧪 Testing Checklist

### Main App Testing (`http://localhost:3000`)

#### Basic Functionality
- [ ] **Page Loads**: App loads without errors
- [ ] **Location Permission**: Browser requests location access
- [ ] **Weather Check**: Click "Check Weather" button
- [ ] **Weather Display**: Weather data displays correctly
- [ ] **Temperature Toggle**: Celsius/Fahrenheit conversion works
- [ ] **Profanity Toggle**: Switches between normal/rude messages
- [ ] **Feedback System**: Thumbs up/down buttons work
- [ ] **State Persistence**: Toggle states persist on refresh

#### Sponsored Messages
- [ ] **Sample Messages**: Test sponsored messages display for different weather types
- [ ] **Random Selection**: Multiple sponsors for same weather type show randomly
- [ ] **Message Styling**: Sponsored messages have proper styling (yellow border, heart icon)
- [ ] **Sponsor Attribution**: Sponsor name displays correctly

#### Data Storage
- [ ] **Usage Tracking**: Weather checks are stored in Supabase
- [ ] **Feedback Storage**: User feedback is stored in Supabase
- [ ] **Unique Users**: Browser fingerprinting works for unique user tracking

### Admin Panel Testing (`http://localhost:3000/admin.html`)

#### Authentication
- [ ] **Login Required**: Page shows login form initially
- [ ] **Password**: Login with `raincheck2024`
- [ ] **Session Persistence**: Stays logged in on refresh

#### Data Display
- [ ] **Metrics Load**: Total users, weather checks, feedback percentages display
- [ ] **Recent Activity**: Shows recent weather checks and feedback
- [ ] **Charts**: Usage and feedback charts render correctly
- [ ] **Revenue Tracking**: Total revenue displays correctly

#### Sponsorship Management
- [ ] **Pending Approvals**: Shows sponsorships awaiting approval
- [ ] **Approve/Reject**: Buttons work for pending sponsorships
- [ ] **Active Sponsorships**: Shows currently active sponsorships
- [ ] **Manual Addition**: Can add sponsorships manually via form

#### QA System
- [ ] **Weather Type Selection**: Dropdown works for all weather types
- [ ] **Message Preview**: Shows how sponsored messages will appear
- [ ] **Admin Preview**: Shows admin-style preview
- [ ] **Main App Preview**: Shows how it appears to users

### Donation Page Testing (`http://localhost:3000/donate.html`)

#### Package Selection
- [ ] **Package Display**: All 4 packages show with correct pricing
- [ ] **Daily Cost**: Daily cost breakdown displays for all packages
- [ ] **Clickable Packages**: Clicking packages selects them
- [ ] **Visual Feedback**: Selected packages show border styling
- [ ] **Form Update**: Selection updates the form below

#### Form Validation
- [ ] **Required Fields**: All required fields are validated
- [ ] **Character Limit**: Message input respects 100 character limit
- [ ] **Weather Type**: Must select a weather type
- [ ] **Duration**: Must select a duration
- [ ] **Inappropriate Content**: Basic content filtering works

#### Submission Process
- [ ] **Payment Simulation**: 2-second processing delay works
- [ ] **Success Message**: Shows approval process message
- [ ] **Data Storage**: Sponsorship is stored in Supabase with 'pending' status
- [ ] **Admin Visibility**: New sponsorship appears in admin panel

## 🔍 Error Testing

### Network Issues
- [ ] **Offline Mode**: App handles network failures gracefully
- [ ] **API Errors**: Weather API failures show user-friendly messages
- [ ] **Supabase Errors**: Database errors fall back to localStorage

### Input Validation
- [ ] **XSS Prevention**: Malicious input is sanitized
- [ ] **SQL Injection**: Database queries are properly parameterized
- [ ] **Rate Limiting**: Excessive requests are handled appropriately

## 📊 Performance Testing

### Load Testing
- [ ] **Multiple Weather Checks**: Rapid successive checks work
- [ ] **Large Data Sets**: Admin panel handles large amounts of data
- [ ] **Memory Usage**: No memory leaks during extended use

### Browser Compatibility
- [ ] **Chrome**: Full functionality
- [ ] **Firefox**: Full functionality
- [ ] **Safari**: Full functionality
- [ ] **Edge**: Full functionality
- [ ] **Mobile Browsers**: Responsive design works

## 🐛 Common Issues & Solutions

### Port 3000 Already in Use
```bash
# Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Supabase Connection Errors
- [ ] Check config.js has correct credentials
- [ ] Verify Supabase project is active
- [ ] Check RLS policies are enabled

### Module Import Errors
- [ ] Ensure all HTML files include security modules
- [ ] Check file paths are correct
- [ ] Verify ES6 module syntax

### Admin Panel Not Loading Data
- [ ] Check browser console for errors
- [ ] Verify Supabase connection
- [ ] Check RLS policies allow public access

## 📝 Testing Notes

### Test Data
- Sample sponsored messages are automatically inserted
- Test with different weather conditions
- Try various user scenarios (new vs returning users)

### Browser Console
- Monitor for JavaScript errors
- Check network requests to Supabase
- Verify data is being sent/received correctly

### Database Verification
- Check Supabase dashboard for new records
- Verify data structure matches schema
- Confirm RLS policies are working

## 🔄 Update This Guide

When adding new features or fixing bugs:
1. Update the relevant testing sections
2. Add new test cases
3. Document any new common issues
4. Update solutions for known problems

## 📞 Support

If you encounter issues not covered in this guide:
1. Check browser console for errors
2. Verify all setup steps are completed
3. Test with a fresh browser session
4. Check Supabase dashboard for data flow
