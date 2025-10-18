#!/usr/bin/env node

/**
 * Vercel Configuration Validator
 * Run this script before committing to catch common Vercel deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Vercel Configuration Validator\n');

let hasErrors = false;

// Check if vercel.json exists
function checkVercelJson() {
  console.log('1. Checking vercel.json...');
  
  if (!fs.existsSync('vercel.json')) {
    console.log('❌ vercel.json not found');
    hasErrors = true;
    return;
  }

  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // Check for conflicting builds and functions
    if (vercelConfig.builds && vercelConfig.functions) {
      console.log('❌ CONFLICT: Both builds and functions configured');
      console.log('   Fix: Remove builds array when using functions');
      hasErrors = true;
    }
    
    // Check version
    if (!vercelConfig.version || vercelConfig.version !== 2) {
      console.log('⚠️  Warning: Using version 1, consider upgrading to version 2');
    }
    
    // Check function duration
    if (vercelConfig.functions) {
      Object.keys(vercelConfig.functions).forEach(func => {
        const funcConfig = vercelConfig.functions[func];
        if (funcConfig.maxDuration && funcConfig.maxDuration > 30) {
          console.log(`⚠️  Warning: Function ${func} has maxDuration > 30s (Hobby plan limit)`);
        }
      });
    }
    
    console.log('✅ vercel.json structure looks good');
    
  } catch (error) {
    console.log('❌ Invalid JSON in vercel.json:', error.message);
    hasErrors = true;
  }
}

// Check package.json dependencies
function checkDependencies() {
  console.log('\n2. Checking dependencies...');
  
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json not found');
    hasErrors = true;
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for problematic dependencies
    const problematicDeps = ['redis', 'mongodb', 'mysql', 'pg', 'sqlite3'];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    Object.keys(allDeps).forEach(dep => {
      if (problematicDeps.some(prob => dep.includes(prob))) {
        console.log(`⚠️  Warning: ${dep} may cause deployment issues`);
      }
    });
    
    // Check Node.js version
    if (packageJson.engines && packageJson.engines.node) {
      console.log(`✅ Node.js version specified: ${packageJson.engines.node}`);
    } else {
      console.log('⚠️  Warning: No Node.js version specified in engines');
    }
    
    console.log('✅ Dependencies look compatible');
    
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    hasErrors = true;
  }
}

// Check API structure
function checkApiStructure() {
  console.log('\n3. Checking API structure...');
  
  if (!fs.existsSync('api')) {
    console.log('⚠️  No api/ directory found');
    return;
  }
  
  const apiFiles = fs.readdirSync('api');
  apiFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join('api', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for proper export
      if (!content.includes('module.exports')) {
        console.log(`❌ ${file} missing module.exports`);
        hasErrors = true;
      }
      
      // Check for CORS headers
      if (!content.includes('Access-Control-Allow-Origin')) {
        console.log(`⚠️  Warning: ${file} may need CORS headers`);
      }
      
      console.log(`✅ ${file} structure looks good`);
    }
  });
}

// Check public directory
function checkPublicDirectory() {
  console.log('\n4. Checking public directory...');
  
  if (!fs.existsSync('public')) {
    console.log('❌ public/ directory not found');
    hasErrors = true;
    return;
  }
  
  const publicFiles = fs.readdirSync('public');
  console.log(`✅ Found ${publicFiles.length} files in public/ directory`);
}

// Main validation
function main() {
  checkVercelJson();
  checkDependencies();
  checkApiStructure();
  checkPublicDirectory();
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ VALIDATION FAILED - Fix errors before committing');
    console.log('\n📚 Reference: https://vercel.com/docs/errors/error-list');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED - Safe to commit');
    console.log('\n🚀 Remember to test locally with: vercel dev');
  }
}

main();
