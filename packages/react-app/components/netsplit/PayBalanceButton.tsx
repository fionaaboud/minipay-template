'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/useWeb3';
import { Balance } from '@/types/netsplit';

interface PayBalanceButtonProps {
  balance: Balance;
  onPaymentComplete: () => void;
}

export default function PayBalanceButton({ balance, onPaymentComplete }: PayBalanceButtonProps) {
  const { sendCUSD } = useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show the button if the user owes money and the person they owe has a wallet address
  if (balance.balance >= 0 || balance.owes.length === 0) {
    return null;
  }

  // Find the person with the highest amount owed
  const highestOwed = balance.owes.reduce((prev, current) =>
    (prev.amount > current.amount) ? prev : current
  );

  // Check if we have a wallet address for this person
  if (!highestOwed.walletAddress) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        No wallet address available for payment
      </div>
    );
  }

  const handlePayBalance = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Convert amount to string with 2 decimal places
      const amountToSend = highestOwed.amount.toFixed(2);

      // Send the payment using MiniPay
      const tx = await sendCUSD(highestOwed.walletAddress, amountToSend);

      // Call the callback to update the UI
      onPaymentComplete();

      // Show success message
      alert(`Payment of $${amountToSend} to ${highestOwed.name} was successful!`);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayBalance}
        disabled={isProcessing}
        className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
          isProcessing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        } text-white transition`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <span className="material-icons text-sm mr-1">payments</span>
            Pay Balance (${Math.abs(balance.balance).toFixed(2)})
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
