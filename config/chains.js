import { Token } from '@uniswap/sdk-core';

// Chain IDs
export const CHAIN_IDS = {
  BASE: 8453,
  ARBITRUM: 42161
};

// Uniswap V3 Factory addresses
export const FACTORY_ADDRESSES = {
  BASE: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  ARBITRUM: '0x1F98431c8aD98523631AE4a59f267346ea31F984'
};

// Uniswap V3 Quoter V2 addresses
export const QUOTER_ADDRESSES = {
  BASE: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  ARBITRUM: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'
};

// Token definitions
export const TOKENS = {
  BASE: {
    WETH: new Token(
      CHAIN_IDS.BASE,
      '0x4200000000000000000000000000000000000006',
      18,
      'WETH',
      'Wrapped Ether'
    ),
    USDbC: new Token(
      CHAIN_IDS.BASE,
      '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      6,
      'USDbC',
      'USD Base Coin'
    ),
    USDC: new Token(
      CHAIN_IDS.BASE,
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      6,
      'USDC',
      'USD Coin'
    )
  },
  ARBITRUM: {
    WETH: new Token(
      CHAIN_IDS.ARBITRUM,
      '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      18,
      'WETH',
      'Wrapped Ether'
    ),
    USDC: new Token(
      CHAIN_IDS.ARBITRUM,
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      6,
      'USDC',
      'USD Coin'
    ),
    USDT: new Token(
      CHAIN_IDS.ARBITRUM,
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      6,
      'USDT',
      'Tether USD'
    )
  }
};

// Common fee tiers (in hundredths of basis points)
export const FEE_TIERS = {
  LOWEST: 100,    // 0.01%
  LOW: 500,       // 0.05%
  MEDIUM: 3000,   // 0.3%
  HIGH: 10000     // 1%
};

export const getChainConfig = (chain) => {
  const chainUpper = chain.toUpperCase();
  return {
    chainId: CHAIN_IDS[chainUpper],
    factory: FACTORY_ADDRESSES[chainUpper],
    quoter: QUOTER_ADDRESSES[chainUpper],
    tokens: TOKENS[chainUpper]
  };
};
