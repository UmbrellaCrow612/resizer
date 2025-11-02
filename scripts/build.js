const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Navigate to parent directory
const targetDir = path.join(__dirname, '..');
process.chdir(targetDir);

console.log('Running npm run build:types...');
try {
  execSync('npm run build:types', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to run build:types');
  process.exit(1);
}

console.log('Build complete!');