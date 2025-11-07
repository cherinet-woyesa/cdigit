const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  // Skip the types/index.ts file itself
  if (filePath.includes('types\\index.ts') || filePath.includes('types/index.ts')) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;
  
  // Replace @types/Something with @types (to use barrel export)
  // But keep the specific type imports
  const patterns = [
    { from: /@types\/multiChannelAccess/g, to: '@types' },
    { from: /@types\/Branch/g, to: '@types' },
    { from: /@types\/ApiResponse/g, to: '@types' },
    { from: /@types\/ActionMessage/g, to: '@types' },
    { from: /@types\/DecodedToken/g, to: '@types' },
    { from: /@types\/ExchangeRate/g, to: '@types' },
    { from: /@types\/formTypes/g, to: '@types' },
    { from: /@types\/QueueCustomer/g, to: '@types' },
    { from: /@types\/BranchAnalytics/g, to: '@types' },
    { from: /@types\/PettyCash\/InitialRequestDto/g, to: '@types' },
    { from: /@types\/PettyCash\/PettyCashFormResponseDto/g, to: '@types' },
    { from: /@types\/Service/g, to: '@types' },
  ];
  
  for (const pattern of patterns) {
    if (newContent.match(pattern.from)) {
      newContent = newContent.replace(pattern.from, pattern.to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDirectory(dir) {
  let filesFixed = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        filesFixed += walkDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (processFile(filePath)) {
        filesFixed++;
      }
    }
  }
  
  return filesFixed;
}

// Start processing
console.log('Fixing @types imports...\n');
const srcDir = path.join(process.cwd(), 'src');
const filesFixed = walkDirectory(srcDir);
console.log(`\n✓ Complete! Fixed ${filesFixed} files.`);
