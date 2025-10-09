#!/usr/bin/env node

/**
 * Pre-Commit Code Review Script
 * Comprehensive code review before GitHub commits to prevent errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-Commit Code Review\n');

let hasErrors = false;
let hasWarnings = false;

// Color codes for output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function logError(message) {
  console.log(`${colors.red}❌ ERROR: ${message}${colors.reset}`);
  hasErrors = true;
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  WARNING: ${message}${colors.reset}`);
  hasWarnings = true;
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// 1. Check for syntax errors in JavaScript files
function checkJavaScriptSyntax() {
  console.log('1. Checking JavaScript syntax...');
  
  const jsFiles = [
    'public/script.js',
    'api/weather.js',
    'validate-vercel.js',
    'pre-commit-review.js'
  ];
  
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Basic syntax check - check for common syntax issues
        if (content.includes('undefined') && !content.includes('typeof')) {
          logWarning(`${file} may have undefined variable usage`);
        }
        // Check for basic syntax patterns
        if (content.includes('function') || content.includes('=>') || content.includes('const') || content.includes('let')) {
          logSuccess(`${file} appears to have valid JavaScript structure`);
        } else {
          logWarning(`${file} may not contain JavaScript code`);
        }
      } catch (error) {
        logError(`${file} could not be read: ${error.message}`);
      }
    }
  });
}

// 2. Check HTML structure and links
function checkHTMLStructure() {
  console.log('\n2. Checking HTML structure...');
  
  if (fs.existsSync('public/index.html')) {
    const htmlContent = fs.readFileSync('public/index.html', 'utf8');
    
    // Check for required elements
    const requiredElements = [
      'id="get-location-btn"',
      'id="temperature-toggle"',
      'id="profanity-toggle"',
      'id="weather-result"',
      'id="error-state"'
    ];
    
    requiredElements.forEach(element => {
      if (!htmlContent.includes(element)) {
        logError(`Missing required element: ${element}`);
      } else {
        logSuccess(`Found required element: ${element}`);
      }
    });
    
    // Check for script references
    if (!htmlContent.includes('script.js')) {
      logError('Missing script.js reference');
    } else {
      logSuccess('Script reference found');
    }
    
    // Check for external dependencies
    if (!htmlContent.includes('tailwindcss.com')) {
      logWarning('Tailwind CSS CDN not found');
    }
    
    if (!htmlContent.includes('font-awesome')) {
      logWarning('Font Awesome CDN not found');
    }
  }
}

// 3. Check API function structure
function checkAPIFunction() {
  console.log('\n3. Checking API function structure...');
  
  if (fs.existsSync('api/weather.js')) {
    const apiContent = fs.readFileSync('api/weather.js', 'utf8');
    
    // Check for required exports
    if (!apiContent.includes('module.exports')) {
      logError('API function missing module.exports');
    } else {
      logSuccess('API function has proper export');
    }
    
    // Check for CORS headers
    if (!apiContent.includes('Access-Control-Allow-Origin')) {
      logWarning('API function may need CORS headers');
    } else {
      logSuccess('API function has CORS headers');
    }
    
    // Check for error handling
    if (!apiContent.includes('try') || !apiContent.includes('catch')) {
      logWarning('API function may need better error handling');
    } else {
      logSuccess('API function has error handling');
    }
    
    // Check for required dependencies
    if (!apiContent.includes('require(\'node-fetch\')')) {
      logError('API function missing node-fetch dependency');
    } else {
      logSuccess('API function has node-fetch dependency');
    }
  }
}

// 4. Check for configuration consistency
function checkConfigurationConsistency() {
  console.log('\n4. Checking configuration consistency...');
  
  // Check vercel.json
  if (fs.existsSync('vercel.json')) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // Check for API routing
      const hasApiRoute = vercelConfig.routes && 
        vercelConfig.routes.some(route => route.src && route.src.includes('/api/'));
      
      if (!hasApiRoute) {
        logError('vercel.json missing API routing configuration');
      } else {
        logSuccess('vercel.json has API routing');
      }
      
      // Check for function configuration
      if (!vercelConfig.functions || !vercelConfig.functions['api/weather.js']) {
        logError('vercel.json missing API function configuration');
      } else {
        logSuccess('vercel.json has API function configuration');
      }
      
    } catch (error) {
      logError(`vercel.json is invalid: ${error.message}`);
    }
  }
  
  // Check package.json
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check for required dependencies
      const requiredDeps = ['express', 'cors', 'node-fetch'];
      requiredDeps.forEach(dep => {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          logError(`Missing required dependency: ${dep}`);
        } else {
          logSuccess(`Found required dependency: ${dep}`);
        }
      });
      
    } catch (error) {
      logError(`package.json is invalid: ${error.message}`);
    }
  }
}

// 5. Check for common JavaScript issues
function checkJavaScriptIssues() {
  console.log('\n5. Checking for common JavaScript issues...');
  
  if (fs.existsSync('public/script.js')) {
    const scriptContent = fs.readFileSync('public/script.js', 'utf8');
    
    // Check for undefined variables
    const undefinedChecks = [
      'this.temperatureToggle',
      'this.temperatureUnitText',
      'this.currentTemperatureCelsius'
    ];
    
    undefinedChecks.forEach(check => {
      if (scriptContent.includes(check)) {
        logSuccess(`Found expected property: ${check}`);
      } else {
        logWarning(`Missing expected property: ${check}`);
      }
    });
    
    // Check for proper event listeners
    if (!scriptContent.includes('addEventListener')) {
      logError('Missing event listeners');
    } else {
      logSuccess('Event listeners found');
    }
    
    // Check for temperature conversion functions
    if (!scriptContent.includes('convertTemperature')) {
      logError('Missing temperature conversion function');
    } else {
      logSuccess('Temperature conversion function found');
    }
  }
}

// 6. Check for file consistency
function checkFileConsistency() {
  console.log('\n6. Checking file consistency...');
  
  const requiredFiles = [
    'public/index.html',
    'public/script.js',
    'api/weather.js',
    'vercel.json',
    'package.json'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`Required file exists: ${file}`);
    } else {
      logError(`Missing required file: ${file}`);
    }
  });
  
  // Check for unnecessary files
  const unnecessaryFiles = [
    'server.js', // Should use server-simple.js or api/ structure
  ];
  
  unnecessaryFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logWarning(`Potentially unnecessary file: ${file}`);
    }
  });
}

// 7. Check for security issues
function checkSecurityIssues() {
  console.log('\n7. Checking for security issues...');
  
  // Check for hardcoded secrets
  const secretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i
  ];
  
  const filesToCheck = ['public/script.js', 'api/weather.js'];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          logWarning(`Potential secret found in ${file}: ${pattern}`);
        }
      });
    }
  });
  
  logSuccess('Security check completed');
}

// Main review function
function main() {
  checkJavaScriptSyntax();
  checkHTMLStructure();
  checkAPIFunction();
  checkConfigurationConsistency();
  checkJavaScriptIssues();
  checkFileConsistency();
  checkSecurityIssues();
  
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.log(`${colors.red}❌ CODE REVIEW FAILED - Fix errors before committing${colors.reset}`);
    console.log('\n📚 Common fixes:');
    console.log('   - Check syntax errors in JavaScript files');
    console.log('   - Verify all required HTML elements exist');
    console.log('   - Ensure API functions have proper exports');
    console.log('   - Validate configuration files');
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  CODE REVIEW PASSED WITH WARNINGS - Review warnings before committing${colors.reset}`);
    console.log('\n💡 Consider addressing warnings for better code quality');
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ CODE REVIEW PASSED - Safe to commit${colors.reset}`);
    console.log('\n🚀 All checks passed successfully!');
    process.exit(0);
  }
}

main();
