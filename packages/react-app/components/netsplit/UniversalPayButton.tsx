'use client';

import { useState, useEffect } from 'react';
import { useWeb3Context, WalletType } from '@/contexts/useWeb3Context';
import { Balance } from '@/types/netsplit';

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
    sendCUSD 
  } = useWeb3Context();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  
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
      
      // Send the payment
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
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
