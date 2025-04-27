'use client';

import { useState, useEffect } from 'react';
import { useWeb3Context, WalletType } from '@/contexts/useWeb3Context';
import { Balance } from '@/types/netsplit';
import MentoService from '@/services/mentoService';
import { Address } from 'viem'; // Import Address type

interface UniversalPayButtonProps {
  balance: Balance;
  onPaymentComplete: () => void;
}

export default function UniversalPayButton({ balance, onPaymentComplete }: UniversalPayButtonProps) {
  const {
    address,
    isConnected,
    walletType,
    connectWallet,
    sendCUSD,
    sendStablecoin,
    supportedCurrencies
  } = useWeb3Context();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  // Find the person with the highest amount owed
  const highestOwed = balance.owes.reduce((prev, current) =>
    (prev.amount > current.amount) ? prev : current
  );

  const [paymentCurrency, setPaymentCurrency] = useState(highestOwed?.currency || 'cUSD');

  // Only show the button if the user owes money and the person they owe has a wallet address
  if (balance.balance >= 0 || balance.owes.length === 0) {
    return null;
  }

  // Check if we have a wallet address for this person
  if (!highestOwed.walletAddress) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        No wallet address available for payment
      </div>
    );
  }

  const handlePayBalance = async () => {
    // If not connected to a wallet, show wallet options
    if (!isConnected) {
      setShowWalletOptions(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert amount to string with 2 decimal places
      const amountToSend = highestOwed.amount.toFixed(2);

      // Ensure wallet address exists before sending (for TypeScript safety)
      if (!highestOwed.walletAddress) {
        // This case should theoretically not be reachable due to the check before rendering the button
        console.error("Critical Error: handlePayBalance called without wallet address for", highestOwed.email);
        setError("Internal error: Missing wallet address.");
        setIsProcessing(false);
        return;
      }

      // Send the payment using the selected currency
      // Cast walletAddress to Address type as preceding checks ensure it's defined
      const tx = await sendStablecoin(highestOwed.walletAddress as Address, amountToSend, paymentCurrency);

      // Call the callback to update the UI
      onPaymentComplete();

      // Show success message with currency
      alert(`Payment of ${MentoService.formatAmountWithCurrency(parseFloat(amountToSend), paymentCurrency)} to ${highestOwed.name} was successful!`);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const connectWithWallet = async (type: WalletType) => {
    setError(null);

    try {
      const success = await connectWallet(type);
      if (success) {
        setShowWalletOptions(false);
      } else {
        setError(`Failed to connect with ${type}`);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message || `Failed to connect with ${type}`);
    }
  };

  return (
    <div>
      {showWalletOptions ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Connect a wallet to pay</h3>

          <button
            onClick={() => connectWithWallet(WalletType.MINIPAY)}
            className="w-full py-2 px-4 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            <span className="material-icons text-sm mr-1">account_balance_wallet</span>
            Pay with MiniPay
          </button>

          <button
            onClick={() => connectWithWallet(WalletType.METAMASK)}
            className="w-full py-2 px-4 rounded-lg flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white transition"
          >
            <span className="material-icons text-sm mr-1">account_balance_wallet</span>
            Pay with MetaMask
          </button>

          <button
            onClick={() => setShowWalletOptions(false)}
            className="w-full py-2 px-4 rounded-lg flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Pay with:</label>
            <div className="flex space-x-2 mb-2">
              {supportedCurrencies.map(currency => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setPaymentCurrency(currency)}
                  className={`flex-1 py-1 px-2 text-sm rounded-md ${paymentCurrency === currency
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
                >
                  {currency}
                </button>
              ))}
            </div>
            {paymentCurrency !== highestOwed.currency && (
              <div className="text-xs text-gray-500 mb-2">
                You&apos;ll pay {MentoService.formatAmountWithCurrency(highestOwed.amount, paymentCurrency)}
                (equivalent to {MentoService.formatAmountWithCurrency(highestOwed.amount, highestOwed.currency || 'cUSD')})
              </div>
            )}
          </div>

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
                Pay Balance ({MentoService.formatAmountWithCurrency(highestOwed.amount, highestOwed.currency || 'cUSD')})
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
