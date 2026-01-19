#!/bin/bash

# Test script for transaction API endpoint
# Usage: ./test-api.sh <wallet_address>

if [ -z "$1" ]; then
    echo "Usage: ./test-api.sh <wallet_address>"
    echo "Example: ./test-api.sh 0x603AB1b3E019F9b80eD0144D5AbE68ebb1Dc158A"
    exit 1
fi

ADDRESS=$1
API_URL="http://localhost:3000/api/transactions?address=$ADDRESS"

echo "🔍 Testing Transaction API"
echo "=========================="
echo "Address: $ADDRESS"
echo "URL: $API_URL"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server not running!"
    echo "Please start it first: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Make API request
echo "📡 Fetching transactions..."
RESPONSE=$(curl -s "$API_URL")

# Pretty print JSON response
echo "$RESPONSE" | jq '.' 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API call successful!"
    
    # Extract and display summary
    TOTAL_TXS=$(echo "$RESPONSE" | jq -r '.totalTransactions' 2>/dev/null)
    TOTAL_PROFIT=$(echo "$RESPONSE" | jq -r '.totalProfit' 2>/dev/null)
    
    if [ "$TOTAL_TXS" != "null" ]; then
        echo ""
        echo "📊 Summary:"
        echo "   Total Transactions: $TOTAL_TXS"
        echo "   Total Profit: $TOTAL_PROFIT ETH"
    fi
else
    echo ""
    echo "Response:"
    echo "$RESPONSE"
fi
