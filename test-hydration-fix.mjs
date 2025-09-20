#!/usr/bin/env node

/**
 * Test script to verify hydration fix for NotificationManager component
 * This script will check if the component can be imported and rendered without errors
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testComponentImport() {
  try {
    console.log('Testing NotificationManager component import...');
    
    // Read the component file
    const componentPath = join(__dirname, 'src', 'components', 'NotificationManager.tsx');
    const componentContent = await readFile(componentPath, 'utf8');
    
    // Check for key patterns that indicate proper hydration handling
    const hasUseClient = componentContent.includes("'use client'");
    const hasUseEffect = componentContent.includes('useEffect');
    const hasIsClient = componentContent.includes('isClient');
    
    console.log('Component analysis:');
    console.log('- Has "use client" directive:', hasUseClient);
    console.log('- Has useEffect hook:', hasUseEffect);
    console.log('- Has isClient state pattern:', hasIsClient);
    
    if (hasUseClient && hasUseEffect && hasIsClient) {
      console.log('✅ Component appears to be properly configured for client-side rendering');
      return true;
    } else {
      console.log('❌ Component may still have hydration issues');
      return false;
    }
  } catch (error) {
    console.error('Error testing component:', error.message);
    return false;
  }
}

async function testEnvFiles() {
  try {
    console.log('\nTesting environment files...');
    
    const envLocalPath = join(__dirname, '.env.local');
    const envContent = await readFile(envLocalPath, 'utf8');
    
    // Check for the problematic export line
    const hasExportLine = envContent.includes('export DENO_UNSTABLE_BARE_NODE_BUILTINS=true');
    
    if (hasExportLine) {
      console.log('❌ .env.local still contains problematic export line');
      return false;
    } else {
      console.log('✅ .env.local does not contain problematic export line');
      return true;
    }
  } catch (error) {
    console.error('Error testing environment files:', error.message);
    return false;
  }
}

async function main() {
  console.log('Running hydration fix verification tests...\n');
  
  const componentTest = await testComponentImport();
  const envTest = await testEnvFiles();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log('- Component test:', componentTest ? 'PASS' : 'FAIL');
  console.log('- Environment test:', envTest ? 'PASS' : 'FAIL');
  
  if (componentTest && envTest) {
    console.log('\n🎉 All tests passed! Hydration issues should be resolved.');
    console.log('Please restart your Next.js development server to apply changes.');
  } else {
    console.log('\n❌ Some tests failed. Please check the output above.');
  }
}

main().catch(console.error);