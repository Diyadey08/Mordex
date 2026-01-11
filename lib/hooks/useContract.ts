'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ARBITRAGE_EXECUTOR_ABI, CONTRACT_ADDRESS, CHAIN_ID } from '@/lib/contract-abi';

/**
 * Custom hooks for ArbitrageExecutor contract interaction
 * Uses wagmi for wallet-based transaction signing
 */

// ============ Read Hooks ============

/**
 * Get user's deposited balance in the contract
 * Uses per-user balance tracking via userBalances mapping
 */
export function useUserBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARBITRAGE_EXECUTOR_ABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });
  
  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatEther(data as bigint) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Get total contract balance
 */
export function useContractBalance() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARBITRAGE_EXECUTOR_ABI,
    functionName: 'contractBalance',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });
  
  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatEther(data as bigint) : '0',
    isLoading,
    refetch,
  };
}

// ============ Write Hooks ============

/**
 * Deposit ETH into the contract
 */
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const writeDeposit = (amountEth: string | { value: bigint }) => {
    if (!CONTRACT_ADDRESS) throw new Error('Contract not deployed');
    
    // Handle both string and object formats
    const value = typeof amountEth === 'string' 
      ? parseEther(amountEth) 
      : amountEth.value;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARBITRAGE_EXECUTOR_ABI,
      functionName: 'deposit',
      value,
    });
  };
  
  return {
    writeDeposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Withdraw ETH from the contract
 */
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const writeWithdraw = ({ args }: { args: [bigint] }) => {
    if (!CONTRACT_ADDRESS) throw new Error('Contract not deployed');
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARBITRAGE_EXECUTOR_ABI,
      functionName: 'withdraw',
      args,
    });
  };
  
  return {
    writeWithdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Execute arbitrage trade
 */
export function useExecuteArb() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const writeExecuteArb = ({ args }: { args: [bigint, bigint] }) => {
    if (!CONTRACT_ADDRESS) throw new Error('Contract not deployed');
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ARBITRAGE_EXECUTOR_ABI,
      functionName: 'executeArb',
      args,
    });
  };
  
  return {
    writeExecuteArb,
    hash,
    data: hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Utility Hooks ============

/**
 * Check if connected to correct network
 */
export function useCorrectNetwork() {
  const { chain } = useAccount();
  
  return {
    isCorrectNetwork: chain?.id === CHAIN_ID,
    expectedChainId: CHAIN_ID,
    currentChainId: chain?.id,
    chainName: 'Base Sepolia',
  };
}

/**
 * Check if contract is configured
 */
export function useContractConfigured() {
  return {
    isConfigured: !!CONTRACT_ADDRESS,
    address: CONTRACT_ADDRESS,
  };
}
