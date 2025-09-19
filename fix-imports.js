#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImportFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  // Check if file exists
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  // Read file safely
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  // Write file safely
  writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (error) {
      this.log(`Failed to write ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  // Fix package.json for ES modules
  fixPackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!this.fileExists(packagePath)) {
      this.log('No package.json found', 'warning');
      return;
    }

    const packageContent = this.readFile(packagePath);
    if (!packageContent) return;

    try {
      const packageJson = JSON.parse(packageContent);
      let modified = false;

      // Ensure proper main field for ES modules
      if (!packageJson.main && packageJson.type === 'module') {
        packageJson.main = 'index.js';
        modified = true;
        this.fixes.push('Added main field to package.json');
      }

      // Add exports field for better module resolution
      if (!packageJson.exports && packageJson.type === 'module') {
        packageJson.exports = {
          ".": "./index.js"
        };
        modified = true;
        this.fixes.push('Added exports field to package.json');
      }

      if (modified) {
        this.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
        this.log('Enhanced package.json for ES modules', 'success');
      } else {
        this.log('package.json already has ES module configuration', 'info');
      }
    } catch (error) {
      this.log(`Error parsing package.json: ${error.message}`, 'error');
    }
  }

  // Create or fix tsconfig.json
  fixTsConfig() {
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    const defaultTsConfig = {
      "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "allowImportingTsExtensions": false,
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "preserve"
      },
      "include": ["src/**/*", "*.ts", "*.js", "**/*.tsx", "**/*.jsx"],
      "exclude": ["node_modules", "dist", "build", ".next"]
    };

    if (!this.fileExists(tsConfigPath)) {
      this.writeFile(tsConfigPath, JSON.stringify(defaultTsConfig, null, 2));
      this.fixes.push('Created tsconfig.json with ES module settings');
      this.log('Created tsconfig.json', 'success');
    } else {
      const tsConfigContent = this.readFile(tsConfigPath);
      if (!tsConfigContent) return;

      try {
        const tsConfig = JSON.parse(tsConfigContent);
        let modified = false;

        if (!tsConfig.compilerOptions) {
          tsConfig.compilerOptions = defaultTsConfig.compilerOptions;
          modified = true;
        } else {
          const requiredOptions = {
            "module": "ESNext",
            "moduleResolution": "bundler",
            "allowSyntheticDefaultImports": true,
            "esModuleInterop": true
          };

          Object.entries(requiredOptions).forEach(([key, value]) => {
            if (tsConfig.compilerOptions[key] !== value) {
              tsConfig.compilerOptions[key] = value;
              modified = true;
            }
          });
        }

        if (modified) {
          this.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
          this.fixes.push('Updated tsconfig.json with proper ES module settings');
          this.log('Fixed tsconfig.json', 'success');
        }
      } catch (error) {
        this.log(`Error parsing tsconfig.json: ${error.message}`, 'error');
      }
    }
  }

  // Fix ESLint config
  fixEslintConfig() {
    const eslintConfigs = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js'];
    let eslintConfigPath = null;

    for (const config of eslintConfigs) {
      if (this.fileExists(path.join(this.projectRoot, config))) {
        eslintConfigPath = path.join(this.projectRoot, config);
        break;
      }
    }

    if (!eslintConfigPath) {
      // Create basic ESLint config for ES modules
      const basicConfig = {
        "env": {
          "browser": true,
          "es2022": true,
          "node": true
        },
        "extends": ["eslint:recommended"],
        "parserOptions": {
          "ecmaVersion": "latest",
          "sourceType": "module"
        },
        "rules": {
          "import/extensions": ["error", "ignorePackages", {
            "js": "always",
            "ts": "never"
          }]
        }
      };

      eslintConfigPath = path.join(this.projectRoot, '.eslintrc.json');
      this.writeFile(eslintConfigPath, JSON.stringify(basicConfig, null, 2));
      this.fixes.push('Created .eslintrc.json with ES module settings');
      this.log('Created ESLint config', 'success');
    }
  }

  // Fix import statements in files
  fixImportStatements(filePath) {
    const content = this.readFile(filePath);
    if (!content) return;

    let modified = false;
    let newContent = content;

    // Don't add extensions to npm package imports or @/ imports
    const importRegex = /import\s+(?:{[^}]*}|[^{}\s]+|\*\s+as\s+\w+)\s+from\s+['"](\.[^'"]*)['"]/g;
    newContent = newContent.replace(importRegex, (match, importPath) => {
      // Skip if already has an extension
      if (importPath.match(/\.\w+$/)) return match;
      
      const basePath = path.resolve(path.dirname(filePath), importPath);
      const possibleFiles = [
        basePath + '.tsx',
        basePath + '.ts', 
        basePath + '.jsx',
        basePath + '.js',
        path.join(basePath, 'index.tsx'),
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.jsx'),
        path.join(basePath, 'index.js')
      ];
      
      for (const possibleFile of possibleFiles) {
        if (this.fileExists(possibleFile)) {
          let extension = '';
          if (possibleFile.endsWith('.tsx')) extension = '.tsx';
          else if (possibleFile.endsWith('.ts')) extension = '.ts';
          else if (possibleFile.endsWith('.jsx')) extension = '.jsx';
          else if (possibleFile.endsWith('.js')) extension = '.js';
          else if (possibleFile.includes('index.tsx')) extension = '/index.tsx';
          else if (possibleFile.includes('index.ts')) extension = '/index.ts';
          else if (possibleFile.includes('index.jsx')) extension = '/index.jsx';
          else if (possibleFile.includes('index.js')) extension = '/index.js';
          
          if (extension) {
            modified = true;
            return match.replace(`"${importPath}"`, `"${importPath}${extension}"`);
          }
        }
      }
      return match;
    });

    // Remove unused React import if JSX is used (React 17+)
    if (newContent.includes('import React') && !newContent.includes('React.') && newContent.includes('<')) {
      // Check if it's React 17+ style (no React import needed for JSX)
      const reactImportRegex = /import\s+React(?:\s*,\s*{[^}]*})?\s+from\s+['"]react['"];?\s*\n?/g;
      const hasNamedImports = /import\s+React\s*,\s*{([^}]*)}/.exec(newContent);
      
      if (hasNamedImports) {
        // Keep named imports but remove React
        newContent = newContent.replace(reactImportRegex, `import { ${hasNamedImports[1]} } from 'react';\n`);
      } else if (!newContent.includes('React.')) {
        // Remove React import entirely if not used
        newContent = newContent.replace(reactImportRegex, '');
      }
      modified = true;
    }

    // Convert require statements to import statements
    const requireRegex = /const\s+({[^}]*}|\w+)\s*=\s*require\(['"]([^'"]*)['"]\)/g;
    newContent = newContent.replace(requireRegex, (match, variable, modulePath) => {
      modified = true;
      if (variable.startsWith('{')) {
        return `import ${variable} from '${modulePath}';`;
      } else {
        return `import ${variable} from '${modulePath}';`;
      }
    });

    // Fix module.exports to export
    if (newContent.includes('module.exports')) {
      newContent = newContent.replace(/module\.exports\s*=\s*/, 'export default ');
      newContent = newContent.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
      modified = true;
    }

    if (modified) {
      this.writeFile(filePath, newContent);
      this.fixes.push(`Fixed import statements in ${path.relative(this.projectRoot, filePath)}`);
    }
  }

  // Scan and fix all JS/TS files
  scanAndFixFiles(dir = this.projectRoot) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and other common directories
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
        this.scanAndFixFiles(fullPath);
      } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name) && !entry.name.includes('.d.ts')) {
        this.fixImportStatements(fullPath);
      }
    }
  }

  // Install missing dependencies
  installDependencies() {
    try {
      this.log('Checking for missing dependencies...', 'info');
      
      // Try to install common import-related packages
      const packagesToCheck = ['@types/node'];
      
      for (const pkg of packagesToCheck) {
        try {
          execSync(`pnpm list ${pkg}`, { stdio: 'ignore' });
        } catch {
          try {
            this.log(`Installing ${pkg}...`, 'info');
            execSync(`pnpm add -D ${pkg}`, { stdio: 'inherit' });
            this.fixes.push(`Installed ${pkg}`);
          } catch (error) {
            this.log(`Failed to install ${pkg}`, 'warning');
          }
        }
      }
    } catch (error) {
      this.log('Error checking dependencies', 'warning');
    }
  }

  // Check for common Next.js issues
  checkNextjsConfig() {
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    if (this.fileExists(nextConfigPath)) {
      const configContent = this.readFile(nextConfigPath);
      if (configContent && !configContent.includes('experimental')) {
        this.log('Consider adding experimental ES modules support to next.config.js', 'info');
      }
    }
  }

  // Main execution function
  async run() {
    this.log('🔧 Starting ES module import fixer...', 'info');
    this.log(`Working directory: ${this.projectRoot}`, 'info');

    // Run all fixes
    this.fixPackageJson();
    this.fixTsConfig();
    this.fixEslintConfig();
    this.scanAndFixFiles();
    this.installDependencies();
    this.checkNextjsConfig();

    // Summary
    this.log('\n📋 Summary:', 'info');
    if (this.fixes.length === 0) {
      this.log('No issues found or all imports are already correct!', 'success');
    } else {
      this.log(`Applied ${this.fixes.length} fixes:`, 'success');
      this.fixes.forEach(fix => this.log(`  ✓ ${fix}`, 'success'));
    }

    this.log('\n🎉 Import fixing complete!', 'success');
    this.log('Remember: ES modules require .js extensions for relative imports!', 'info');
    this.log('You may need to restart your development server/IDE.', 'info');
  }
}

// Run the fixer
const fixer = new ImportFixer();
fixer.run().catch(error => {
  console.error('Error running import fixer:', error);
  process.exit(1);
});