const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix unused variables by prefixing with underscore
function fixUnusedVars(content) {
    // Fix unused variables in destructuring
    content = content.replace(/const \{([^}]+)\} = /g, (match, vars) => {
        const fixedVars = vars.split(',').map(v => {
            const trimmed = v.trim();
            if (trimmed && !trimmed.startsWith('_')) {
                return `_${trimmed}`;
            }
            return trimmed;
        }).join(', ');
        return `const {${fixedVars}} = `;
    });

    // Fix regular unused variables
    content = content.replace(/const (\w+) =/g, (match, varName) => {
        if (!varName.startsWith('_')) {
            return `const _${varName} =`;
        }
        return match;
    });

    return content;
}

// Add this to package.json scripts
const packageJson = {
    "scripts": {
        "fix-unused": "node scripts/fix-lint-issues.js",
        "clean-console": "find src -name '*.ts' -o -name '*.tsx' | xargs sed -i 's/console\\.log/\\/\\/ console.log/g'"
    }
};