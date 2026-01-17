/**
 * Icon Generation Script for Sentinella Extension
 * 
 * This script generates placeholder icons for the extension.
 * In production, replace these with actual designed icons.
 * 
 * Requirements: canvas package (npm install canvas)
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Since we can't use canvas in all environments, this creates a simple SVG-based solution
const sizes = [16, 32, 48, 128];

const createSVGIcon = (size) => {
  const fontSize = Math.floor(size * 0.6);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">S</text>
</svg>`;
};

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated: icon${size}.svg`);
});

console.log('\nNote: Convert SVG files to PNG for the extension.');
console.log('You can use a tool like https://cloudconvert.com/svg-to-png');

