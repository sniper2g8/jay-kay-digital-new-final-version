@echo off
REM Script to migrate from old Supabase API key names to new ones

echo 🔄 Migrating to New Supabase API Keys Format

REM Backup original files
echo Creating backup...
if exist .env.local (
    copy .env.local .env.local.backup
    echo Backup created: .env.local.backup
) else (
    echo No .env.local file to backup
)

REM Update environment variable names in .env.local
echo Updating .env.local...
if exist .env.local (
    powershell -Command "(gc .env.local) -replace 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | Out-File -encoding ASCII .env.local"
    powershell -Command "(gc .env.local) -replace 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY' | Out-File -encoding ASCII .env.local"
    echo .env.local updated
) else (
    echo No .env.local file found
)

REM Update JavaScript/TypeScript files
echo Updating JavaScript/TypeScript files...

REM Update the specific file we found
if exist check-rls-supabase-client.js (
    powershell -Command "(gc check-rls-supabase-client.js) -replace 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | Out-File -encoding ASCII check-rls-supabase-client.js"
    powershell -Command "(gc check-rls-supabase-client.js) -replace 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY' | Out-File -encoding ASCII check-rls-supabase-client.js"
    echo check-rls-supabase-client.js updated
) else (
    echo check-rls-supabase-client.js not found
)

echo ✅ Migration complete!
echo.
echo Next steps:
echo 1. Update your .env.local file with actual sb_publishable_... and sb_secret_... keys
echo 2. Restart your development server
echo 3. Test your application, especially the statement periods functionality
echo 4. Verify that the "Error fetching statement periods: {}" is resolved
echo.
echo If you need to rollback, restore from the backup:
echo copy .env.local.backup .env.local