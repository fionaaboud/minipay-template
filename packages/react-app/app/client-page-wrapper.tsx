'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues
const ClientWrapper = dynamic(() => import('./client-wrapper'), { ssr: false });

export default function ClientPageWrapper() {
  return <ClientWrapper />;
}
