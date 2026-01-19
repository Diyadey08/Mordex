'use client';

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect based on connection status
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    } else {
      router.push('/landing');
    }
  }, [isConnected, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    </div>
  );
}
