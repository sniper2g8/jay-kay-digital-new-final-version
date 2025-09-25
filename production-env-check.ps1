# Production Environment Setup Script for Windows
# Run this on your production server to verify environment variables

Write-Host "=== Jay Kay Digital Press - Production Environment Check ===" -ForegroundColor Blue
Write-Host ""

# Check required environment variables
Write-Host "1. Checking Supabase URL..." -ForegroundColor Yellow
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
if (-not $supabaseUrl) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL is set: $supabaseUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Checking Supabase Publishable Key..." -ForegroundColor Yellow
$publishableKey = $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
if (-not $publishableKey) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is set (length: $($publishableKey.Length))" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Checking Supabase Service Role Key..." -ForegroundColor Yellow
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $serviceKey) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY is not set" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY is set (length: $($serviceKey.Length))" -ForegroundColor Green
}

Write-Host ""
Write-Host "4. Checking Node Environment..." -ForegroundColor Yellow
$nodeEnv = $env:NODE_ENV
if ($nodeEnv) {
    Write-Host "NODE_ENV: $nodeEnv" -ForegroundColor Green
} else {
    Write-Host "NODE_ENV: not set" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5. Testing Environment File Loading..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Write-Host "✅ .env.production file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.production file not found" -ForegroundColor Yellow
}

if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "6. Checking for duplicate environment variables..." -ForegroundColor Yellow
$publishableKeyAlt = $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if ($publishableKeyAlt) {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is also set (backup)" -ForegroundColor Green
} else {
    Write-Host "⚠️  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set (this is okay)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Production Environment Check Complete ===" -ForegroundColor Blue
Write-Host ""
Write-Host "If all checks pass, your environment should be properly configured." -ForegroundColor Green
Write-Host "If invoices still don't load, check:" -ForegroundColor Yellow
Write-Host "1. Server logs for detailed error messages"
Write-Host "2. Browser console for client-side errors"
Write-Host "3. Network tab for failed API requests"
Write-Host "4. Database connectivity and permissions"
Write-Host "5. Test the debug endpoints: /api/debug-invoice and /api/test-invoice-data"