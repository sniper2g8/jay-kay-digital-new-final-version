#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git', 'supabase/functions'];
const srcDir = path.join(process.cwd(), 'src');

/**
 * Get all TypeScript/JavaScript files recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip ignored directories
      if (!ignoreDirs.some(ignoreDir => filePath.includes(ignoreDir))) {
        getAllFiles(filePath, fileList);
      }
    } else if (extensions.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Remove unused imports from a file
 */
function removeUnusedImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Track imports and their usage
    const imports = new Map();
    const usedImports = new Set();
    
    // First pass: collect all imports
    lines.forEach((line, index) => {
      const importMatch = line.match(/^import\s+(?:type\s+)?(?:{([^}]+)}|(\w+)|(\*\s+as\s+\w+))\s+from\s+['"][^'"]+['"];?\s*$/);
      if (importMatch) {
        if (importMatch[1]) {
          // Named imports: import { a, b, c } from 'module'
          const namedImports = importMatch[1]
            .split(',')
            .map(imp => imp.trim().replace(/\s+as\s+\w+/, '').trim())
            .filter(imp => imp);
          
          namedImports.forEach(imp => {
            imports.set(imp, { line: index, type: 'named', original: line });
          });
        } else if (importMatch[2]) {
          // Default import: import Something from 'module'
          const defaultImport = importMatch[2].trim();
          imports.set(defaultImport, { line: index, type: 'default', original: line });
        }
      }
    });
    
    // Second pass: find usage of imports
    const codeWithoutImports = lines
      .filter((_, index) => !Array.from(imports.values()).some(imp => imp.line === index))
      .join('\n');
    
    imports.forEach((importInfo, importName) => {
      // Check if the import is used in the code
      const regex = new RegExp(`\\b${importName}\\b`, 'g');
      if (regex.test(codeWithoutImports)) {
        usedImports.add(importName);
      }
    });
    
    // Third pass: rebuild file without unused imports
    const newLines = [];
    const processedLines = new Set();
    
    lines.forEach((line, index) => {
      const importInfo = Array.from(imports.values()).find(imp => imp.line === index);
      
      if (importInfo && !processedLines.has(index)) {
        // This is an import line
        const importMatch = line.match(/^import\s+(?:type\s+)?({[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+(['"][^'"]+['"];?\s*)$/);
        
        if (importMatch && importMatch[1].startsWith('{')) {
          // Named imports - filter out unused ones
          const namedImports = importMatch[1]
            .slice(1, -1)
            .split(',')
            .map(imp => imp.trim())
            .filter(imp => {
              const importName = imp.replace(/\s+as\s+\w+/, '').trim();
              return usedImports.has(importName);
            });
          
          if (namedImports.length > 0) {
            newLines.push(`import { ${namedImports.join(', ')} } from ${importMatch[2]}`);
          }
        } else {
          // Default or namespace import
          const importName = importMatch[1].replace(/\*\s+as\s+/, '').trim();
          if (usedImports.has(importName)) {
            newLines.push(line);
          }
        }
        
        processedLines.add(index);
      } else if (!importInfo) {
        // Not an import line, keep it
        newLines.push(line);
      }
    });
    
    const newContent = newLines.join('\n');
    
    // Only write if content changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Cleaned unused imports in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Starting unused import removal...\n');
  
  // Get all files
  const files = getAllFiles(srcDir);
  console.log(`📁 Found ${files.length} files to process\n`);
  
  let processedCount = 0;
  let changedCount = 0;
  
  files.forEach(file => {
    const changed = removeUnusedImports(file);
    processedCount++;
    if (changed) changedCount++;
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files modified: ${changedCount}`);
  console.log(`   Files unchanged: ${processedCount - changedCount}`);
  
  if (changedCount > 0) {
    console.log('\n🎉 Unused imports have been removed!');
    console.log('💡 Tip: Run your linter/formatter to ensure code style consistency.');
  } else {
    console.log('\n✨ No unused imports found!');
  }
}

// Run the script
main();

export { removeUnusedImports, getAllFiles };