#!/bin/bash

echo "🚀 Starting Arbfarm Test Suite"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Test the contract
echo "🧪 Testing Smart Contract..."
node scripts/test-simulation.js
echo ""

# Start the frontend
echo "🎨 Starting Frontend..."
echo "   Opening http://localhost:3000"
echo ""
echo "📋 What to do:"
echo "   1. Connect MetaMask to Base Sepolia"
echo "   2. Go to http://localhost:3000/test-arb"
echo "   3. Deposit and execute arbitrage"
echo "   4. Check http://localhost:3000/profile for history"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
