const fs = require("fs");

// Read the SQL file
const sql = fs.readFileSync("check-table-case.sql", "utf8");

console.log("🔍 SQL to run in Supabase SQL Editor:");
console.log("=====================================");
console.log(sql);
console.log("=====================================");
console.log("\n📋 Instructions:");
console.log("1. Copy the SQL above");
console.log("2. Go to your Supabase project dashboard");
console.log("3. Navigate to SQL Editor");
console.log("4. Paste and run the SQL");
console.log("5. Check the results to see if both table variations exist");
