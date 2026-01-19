# Deployment and Verification Instructions

## ✅ What's Been Done

1. **Contract Updated**: Added `getUserTransactions()` function to track all user arbitrage transactions with profit
2. **ABI Updated**: Both `lib/contract-abi.ts` and `lib/contracts.ts` have been updated with the new ABI
3. **API Route Created**: New endpoint at `/api/transactions?address=0x...` to fetch user transactions
4. **Compiled**: Contract has been successfully compiled

## 📋 What You Need to Do

### Step 1: Set Up Environment Variables

Edit the `.env` file in the project root:

```bash
DEPLOYER_PRIVATE_KEY=<YOUR_PRIVATE_KEY_WITH_TESTNET_ETH>
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=<YOUR_BASESCAN_API_KEY>
```

**Get Testnet ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
**Get Basescan API Key**: https://basescan.org/myapikey

### Step 2: Deploy the Contract

Run the deployment script:

```bash
./deploy-simple.sh
```

Or manually:

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

This will output something like:
```
✅ Contract deployed to: 0xYOUR_NEW_CONTRACT_ADDRESS
```

### Step 3: Update Contract Address

Create or update `.env.local` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
```

### Step 4: Verify the Contract

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" "0x4200000000000000000000000000000000000006" "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

Replace `<CONTRACT_ADDRESS>` with your deployed contract address.

## 🎯 New Features

### getUserTransactions Function

The contract now tracks every arbitrage execution with:
- **timestamp**: When the transaction occurred
- **amountIn**: Amount of ETH/tokens used
- **profit**: Profit made from the arbitrage
- **isExecuteArb**: Whether it was executeArb (true) or executeArbitrageFlexible (false)

### API Usage

Fetch user transactions:

```bash
curl "http://localhost:3000/api/transactions?address=0xYourAddress"
```

Response:
```json
{
  "success": true,
  "userAddress": "0x...",
  "transactions": [
    {
      "timestamp": 1234567890,
      "amountIn": "0.1",
      "profit": "0.005",
      "isExecuteArb": true,
      "date": "2024-01-01T12:00:00.000Z"
    }
  ],
  "totalTransactions": 1,
  "totalProfit": "0.005",
  "totalProfitWei": "5000000000000000"
}
```

## 🔍 Contract Details

**Network**: Base Sepolia (Chain ID: 84532)
**Constructor Parameters**:
- SwapRouter: 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4
- WETH: 0x4200000000000000000000000000000000000006
- USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

## ⚠️ Important Notes

1. All integrations remain unchanged - only added new functionality
2. The ABI is already updated in the codebase
3. After deployment, update the CONTRACT_ADDRESS in `.env.local`
4. The transaction history is stored on-chain and can be queried at any time
5. Make sure to use an account with testnet ETH for deployment

## 🧪 Testing

After deployment, you can test the new function:

1. Execute some arbitrage transactions
2. Call the API: `http://localhost:3000/api/transactions?address=YOUR_ADDRESS`
3. Verify the transaction history appears correctly

## 📝 Changes Made to Contract

1. Added `Transaction` struct to store transaction data
2. Added `mapping(address => Transaction[]) private userTransactions`
3. Updated both `executeArb` and `executeArbitrageFlexible` to record transactions
4. Added `getUserTransactions(address user)` view function

**No breaking changes** - all existing functionality works exactly as before!
