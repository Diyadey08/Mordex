'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  // Always redirect to landing page (user can navigate from there)
  useEffect(() => {
    router.push('/landing');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    </div>
  );
}
