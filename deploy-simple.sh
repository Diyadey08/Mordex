#!/bin/bash

# Check if .env file exists and has DEPLOYER_PRIVATE_KEY
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with:"
    echo "DEPLOYER_PRIVATE_KEY=your_private_key_here"
    echo "BASESCAN_API_KEY=your_api_key_here"
    exit 1
fi

# Load .env
source .env

if [ -z "$DEPLOYER_PRIVATE_KEY" ] || [ "$DEPLOYER_PRIVATE_KEY" = "YOUR_PRIVATE_KEY_HERE" ]; then
    echo "❌ Please set DEPLOYER_PRIVATE_KEY in .env file"
    echo "Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
    exit 1
fi

echo "🚀 Deploying to Base Sepolia..."
npx hardhat run scripts/deploy.ts --network baseSepolia

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Please update .env.local with the new contract address"
    echo "Then run verification with:"
    echo "npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> \"0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4\" \"0x4200000000000000000000000000000000000006\" \"0x036CbD53842c5426634e7929541eC2318f3dCF7e\""
fi
