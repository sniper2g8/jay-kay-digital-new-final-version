const fs = require('fs');
const path = require('path');
const glob = require('glob');

function cleanConsoleLogsForProduction() {
  console.log('🧹 Cleaning console logs for production deployment...');
  
  // Find all TypeScript and JavaScript files in src
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { 
    cwd: process.cwd(),
    absolute: true 
  });
  
  let totalFilesProcessed = 0;
  let totalLogsRemoved = 0;
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let logsRemovedInFile = 0;
      
      // Remove console.log statements (but keep console.error/warn for debugging)
      const logRegex = /console\.log\([^)]*\);?\s*$/gm;
      const infoRegex = /console\.info\([^)]*\);?\s*$/gm;
      
      // Count matches before removing
      const logMatches = content.match(logRegex) || [];
      const infoMatches = content.match(infoRegex) || [];
      logsRemovedInFile = logMatches.length + infoMatches.length;
      
      // Remove console.log and console.info
      newContent = newContent.replace(logRegex, '');
      newContent = newContent.replace(infoRegex, '');
      
      // Clean up specific development console.logs (like "Generated job number", etc.)
      const devLogPatterns = [
        /console\.log\(\s*['"`]Generated job number:['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Submitting job data:['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Cache invalidated after job submission['"`]\s*\);?\s*$/gm,
        /console\.log\(\s*['"`]Real-time[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Email sent successfully[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]SMS sent successfully[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Job submission notifications sent[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Job status change notifications sent[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Payment notifications sent[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]Invoice notifications sent[^'"`]*['"`][^)]*\);?\s*$/gm,
        /console\.log\(\s*['"`]No session in fetchUserRole[^'"`]*['"`][^)]*\);?\s*$/gm
      ];
      
      devLogPatterns.forEach(pattern => {
        const matches = newContent.match(pattern) || [];
        logsRemovedInFile += matches.length;
        newContent = newContent.replace(pattern, '');
      });
      
      // Clean up onAfterPrint console.log
      newContent = newContent.replace(
        /onAfterPrint:\s*\(\)\s*=>\s*console\.log\([^)]*\),?/g,
        'onAfterPrint: () => {}'
      );
      
      // Clean up empty lines that may be left after removing console statements
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        totalFilesProcessed++;
        totalLogsRemoved += logsRemovedInFile;
        
        if (logsRemovedInFile > 0) {
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(`✅ ${relativePath}: removed ${logsRemovedInFile} console logs`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\n🎉 Console log cleanup completed!`);
  console.log(`📊 Files processed: ${totalFilesProcessed}`);
  console.log(`📊 Console logs removed: ${totalLogsRemoved}`);
  console.log(`\n✅ Kept console.error and console.warn for production debugging`);
  console.log(`✅ Production build ready!`);
}

// Run the cleanup
cleanConsoleLogsForProduction();