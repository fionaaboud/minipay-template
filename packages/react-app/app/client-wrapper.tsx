'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const WalletExample = dynamic(() => import('@/components/WalletExample'), { ssr: false });
const ClientPage = dynamic(() => import('./client-page'), { ssr: false });

export default function ClientWrapper() {
  return (
    <div className="flex flex-col justify-center items-center">
      <ClientPage />
      <WalletExample />

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">MiniPay Apps</h2>
        <div className="space-y-4">
          <Link href="/netsplit" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
            <div className="flex items-center">
              <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Netsplit</h3>
                <p className="text-gray-600">Split bills with friends using MiniPay</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
