'use client';

import { NetsplitProvider } from '@/contexts/useNetsplit';
import { ReactNode } from 'react';

export default function NetsplitLayout({ children }: { children: ReactNode }) {
  return (
    <NetsplitProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Netsplit</h1>
        {children}
      </div>
    </NetsplitProvider>
  );
}
