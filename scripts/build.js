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

console.log('Copying files to dist...');

// Ensure dist directory exists
const distDir = path.join(targetDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy files
const filesToCopy = ['src/resizerTwo.js', 'src/index.js'];

filesToCopy.forEach(file => {
  const src = path.join(targetDir, file);
  const dest = path.join(distDir, path.basename(file));
  
  try {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to dist/`);
  } catch (error) {
    console.error(`✗ Failed to copy ${file}:`, error);
    process.exit(1);
  }
});

console.log('Build complete!');