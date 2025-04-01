#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

console.log('Starting Phone Agent development server...');

// Start Vite dev server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite server:', error);
  process.exit(1);
});

console.log('Vite server started. Press Ctrl+C to stop.');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down development server...');
  viteProcess.kill();
  process.exit(0);
});