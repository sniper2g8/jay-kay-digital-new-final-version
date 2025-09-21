#!/bin/bash

# Script to migrate from old Supabase API key names to new ones
echo "🔄 Migrating to New Supabase API Keys Format"

# Backup original files
echo "Creating backup..."
cp .env.local .env.local.backup 2>/dev/null || echo "No .env.local file to backup"

# Update environment variable names in .env.local
echo "Updating .env.local..."
sed -i 's/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/g' .env.local 2>/dev/null || echo "No NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY found in .env.local"
sed -i 's/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/g' .env.local 2>/dev/null || echo "No SUPABASE_SERVICE_ROLE_KEY found in .env.local"

# Update JavaScript/TypeScript files
echo "Updating JavaScript/TypeScript files..."

# Find and update all relevant files
find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.cjs" \) -exec sed -i 's/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/g' {} \; 2>/dev/null || echo "No NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY found in src/"
find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.cjs" \) -exec sed -i 's/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/g' {} \; 2>/dev/null || echo "No SUPABASE_SERVICE_ROLE_KEY found in src/"

# Update the specific file we found
sed -i 's/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/g' check-rls-supabase-client.js 2>/dev/null || echo "No NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY found in check-rls-supabase-client.js"
sed -i 's/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/g' check-rls-supabase-client.js 2>/dev/null || echo "No SUPABASE_SERVICE_ROLE_KEY found in check-rls-supabase-client.js"

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env.local file with actual sb_publishable_... and sb_secret_... keys"
echo "2. Restart your development server"
echo "3. Test your application, especially the statement periods functionality"
echo "4. Verify that the 'Error fetching statement periods: {}' is resolved"
echo ""
echo "If you need to rollback, restore from the backup:"
echo "cp .env.local.backup .env.local"