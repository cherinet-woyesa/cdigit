const fs = require('fs');
const path = require('path');

// Define alias mappings
const aliasMap = {
  'components': '@components',
  'hooks': '@hooks',
  'services': '@services',
  'context': '@context',
  'features': '@features',
  'utils': '@utils',
  'types': '@types',
  'config': '@config',
  'constants': '@constants',
  'shared': '@shared',
  'lib': '@lib',
  'assets': '@assets'
};

function getRelativeDepth(filePath) {
  const srcIndex = filePath.indexOf('src');
  if (srcIndex === -1) return 0;
  const relativePath = filePath.substring(srcIndex + 4);
  return relativePath.split(path.sep).length - 1;
}

function convertImportPath(importPath, currentFilePath) {
  // Skip if already using alias
  if (importPath.startsWith('@')) return null;
  
  // Skip if not a relative import
  if (!importPath.startsWith('.')) return null;
  
  // Calculate the absolute path
  const currentDir = path.dirname(currentFilePath);
  const absolutePath = path.resolve(currentDir, importPath);
  
  // Get path relative to src
  const srcPath = path.join(process.cwd(), 'src');
  let relativePath = path.relative(srcPath, absolutePath);
  
  // Normalize path separators
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Find matching alias
  for (const [folder, alias] of Object.entries(aliasMap)) {
    if (relativePath.startsWith(folder + '/') || relativePath === folder) {
      const aliasPath = relativePath.replace(folder, alias);
      return aliasPath;
    }
  }
  
  return null;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;
  
  // Match import statements
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  const matches = [...content.matchAll(importRegex)];
  
  for (const match of matches) {
    const originalImport = match[1];
    const newImport = convertImportPath(originalImport, filePath);
    
    if (newImport) {
      newContent = newContent.replace(
        `from '${originalImport}'`,
        `from '${newImport}'`
      );
      newContent = newContent.replace(
        `from "${originalImport}"`,
        `from "${newImport}"`
      );
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
console.log('Starting import path conversion...\n');
const srcDir = path.join(process.cwd(), 'src');
const filesFixed = walkDirectory(srcDir);
console.log(`\n✓ Complete! Fixed ${filesFixed} files.`);
