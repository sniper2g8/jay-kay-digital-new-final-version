# Production Environment Setup Script
# Run this on your production server to verify environment variables

echo "=== Jay Kay Digital Press - Production Environment Check ==="
echo ""

# Check required environment variables
echo "1. Checking Supabase URL..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
else
    echo "✅ NEXT_PUBLIC_SUPABASE_URL is set: $NEXT_PUBLIC_SUPABASE_URL"
fi

echo ""
echo "2. Checking Supabase Publishable Key..."
if [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set"
    exit 1
else
    echo "✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is set (length: ${#NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY})"
fi

echo ""
echo "3. Checking Supabase Service Role Key..."
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY is set (length: ${#SUPABASE_SERVICE_ROLE_KEY})"
fi

echo ""
echo "4. Checking Node Environment..."
echo "NODE_ENV: ${NODE_ENV:-'not set'}"

echo ""
echo "5. Testing Supabase Connection..."
# This would require a Node.js test script to actually test the connection
echo "⚠️  Manual connection test required - check /api/debug-invoice endpoint"

echo ""
echo "=== Production Environment Check Complete ==="
echo ""
echo "If all checks pass, your environment should be properly configured."
echo "If invoices still don't load, check:"
echo "1. Server logs for detailed error messages"
echo "2. Browser console for client-side errors"
echo "3. Network tab for failed API requests"
echo "4. Database connectivity and permissions"