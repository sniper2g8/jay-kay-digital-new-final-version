#!/usr/bin/env node

/**
 * Script to restart the Next.js development server
 * This helps apply the hydration fix changes
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Restarting Next.js development server...');

// Kill any existing Next.js processes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe', '/T'], {
  stdio: 'inherit',
  shell: true
});

killProcess.on('close', () => {
  console.log('Previous Next.js processes terminated.');
  
  // Start the Next.js development server
  console.log('Starting Next.js development server...');
  
  const nextDev = spawn('pnpm', ['dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  nextDev.on('error', (error) => {
    console.error('Failed to start Next.js development server:', error.message);
  });

  nextDev.on('close', (code) => {
    console.log(`Next.js development server process exited with code ${code}`);
  });
});