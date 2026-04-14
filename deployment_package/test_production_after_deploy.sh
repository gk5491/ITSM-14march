# Production Test Script
# Run this after uploading wrapper files to verify they work

echo "Testing production API endpoints..."
echo ""

echo "1. Testing tickets endpoint:"
curl -s "https://cybaemtech.in/itsm_app/php/tickets" | head -100
echo ""

echo "2. Testing specific ticket 111:"
curl -s "https://cybaemtech.in/itsm_app/php/tickets/111" | head -100  
echo ""

echo "3. Testing users endpoint:"
curl -s "https://cybaemtech.in/itsm_app/php/users" | head -100
echo ""

echo "4. Testing categories endpoint:"
curl -s "https://cybaemtech.in/itsm_app/php/categories" | head -100
echo ""

echo "If all endpoints return JSON data (not HTML 404 pages), the fix is successful!"