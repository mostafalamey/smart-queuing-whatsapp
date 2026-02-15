/**
 * Script to combine multiple single-resolution ICO files into one multi-resolution ICO
 * Run with: node scripts/build-icon.js
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'build-resources', 'icons');
const outputPath = path.join(__dirname, '..', 'build-resources', 'icon.ico');

// ICO files in order of size (smallest to largest for better compatibility)
const iconFiles = [
  '16x16.ico',
  '24x24.ico', 
  '32x32.ico',
  '48x48.ico',
  '64x64.ico',
  '128x128.ico',
  '256x256.ico'
];

function readIconImages(files) {
  const images = [];
  
  for (const file of files) {
    const filePath = path.join(iconsDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${file} not found, skipping`);
      continue;
    }
    
    const buffer = fs.readFileSync(filePath);
    
    // ICO file structure:
    // - Header: 6 bytes (reserved, type, count)
    // - Entry: 16 bytes per image
    // - Image data follows
    
    const reserved = buffer.readUInt16LE(0);
    const type = buffer.readUInt16LE(2);
    const count = buffer.readUInt16LE(4);
    
    if (type !== 1 || count < 1) {
      console.warn(`Warning: ${file} is not a valid ICO, skipping`);
      continue;
    }
    
    // Read the first entry (single-resolution ICO files have 1 entry)
    const entryOffset = 6;
    const width = buffer.readUInt8(entryOffset);
    const height = buffer.readUInt8(entryOffset + 1);
    const colorCount = buffer.readUInt8(entryOffset + 2);
    const reserved2 = buffer.readUInt8(entryOffset + 3);
    const planes = buffer.readUInt16LE(entryOffset + 4);
    const bitCount = buffer.readUInt16LE(entryOffset + 6);
    const bytesInRes = buffer.readUInt32LE(entryOffset + 8);
    const imageOffset = buffer.readUInt32LE(entryOffset + 12);
    
    // Extract the image data
    const imageData = buffer.slice(imageOffset, imageOffset + bytesInRes);
    
    images.push({
      width: width === 0 ? 256 : width,
      height: height === 0 ? 256 : height,
      colorCount,
      reserved: reserved2,
      planes,
      bitCount,
      data: imageData
    });
    
    console.log(`Added: ${file} (${width === 0 ? 256 : width}x${height === 0 ? 256 : height}, ${bytesInRes} bytes)`);
  }
  
  return images;
}

function buildMultiResolutionIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const entriesSize = entrySize * images.length;
  
  // Calculate offsets for each image
  let currentOffset = headerSize + entriesSize;
  const imageOffsets = [];
  for (const img of images) {
    imageOffsets.push(currentOffset);
    currentOffset += img.data.length;
  }
  
  // Total file size
  const totalSize = currentOffset;
  const output = Buffer.alloc(totalSize);
  
  // Write header
  output.writeUInt16LE(0, 0);          // Reserved
  output.writeUInt16LE(1, 2);          // Type (1 = ICO)
  output.writeUInt16LE(images.length, 4); // Number of images
  
  // Write entries
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const entryOffset = headerSize + (i * entrySize);
    
    output.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset);
    output.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1);
    output.writeUInt8(img.colorCount, entryOffset + 2);
    output.writeUInt8(0, entryOffset + 3);  // Reserved
    output.writeUInt16LE(img.planes || 1, entryOffset + 4);
    output.writeUInt16LE(img.bitCount || 32, entryOffset + 6);
    output.writeUInt32LE(img.data.length, entryOffset + 8);
    output.writeUInt32LE(imageOffsets[i], entryOffset + 12);
  }
  
  // Write image data
  for (let i = 0; i < images.length; i++) {
    images[i].data.copy(output, imageOffsets[i]);
  }
  
  return output;
}

// Main
console.log('Building multi-resolution icon...\n');

const images = readIconImages(iconFiles);

if (images.length === 0) {
  console.error('No valid icon images found!');
  process.exit(1);
}

const icoBuffer = buildMultiResolutionIco(images);
fs.writeFileSync(outputPath, icoBuffer);

console.log(`\nCreated: ${outputPath}`);
console.log(`Size: ${(icoBuffer.length / 1024).toFixed(2)} KB`);
console.log(`Contains ${images.length} resolutions`);
