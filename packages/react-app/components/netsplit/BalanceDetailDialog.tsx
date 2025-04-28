'use client';

import { Balance } from '@/types/netsplit';
import { useState } from 'react';
import { useWeb3Context } from '@/contexts/useWeb3Context';
import { useNetsplit } from '@/contexts/useNetsplit';

interface BalanceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  balance: Balance;
  groupId: string;
}

export default function BalanceDetailDialog({
  open,
  onClose,
  balance,
  groupId
}: BalanceDetailDialogProps) {
  const { settleDebt } = useNetsplit();
  const { isConnected, connectWallet } = useWeb3Context();

  const [isSettling, setIsSettling] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleToEmail, setSettleToEmail] = useState('');
  const [showSettleForm, setShowSettleForm] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSettleDebt = async () => {
    if (!settleToEmail || !settleAmount) {
      setError('Please select a person and enter an amount');
      return;
    }

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if wallet is connected
    if (!isConnected) {
      try {
        // Try to connect to wallet first
        const connected = await connectWallet();
        if (!connected) {
          setError('Please connect your wallet to settle debt');
          return;
        }
      } catch (error: any) {
        setError(error.message || 'Failed to connect wallet');
        return;
      }
    }

    setError('');
    setIsSettling(true);

    try {
      await settleDebt(groupId, settleToEmail, settleAmount);
      setSettleAmount('');
      setSettleToEmail('');
      setShowSettleForm(false);
      onClose(); // Close the dialog after successful payment
    } catch (error: any) {
      console.error('Settlement error:', error);
      setError(error.message || 'Failed to settle debt');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Consolidated Balance Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          These balances show the net amount owed between members after canceling out mutual expenses across all transactions.
          For example, if you owe someone $50 and they owe you $30, you&apos;ll only see that you owe them $20.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
          <strong>New!</strong> We&apos;ve improved the balance calculation to combine all expenses.
          If you owe someone $100 and they owe you $100, your balance will be $0.
        </div>

        <div className={`p-4 rounded-lg mb-6 ${balance.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="font-medium">
            {balance.name}&apos;s Balance
          </div>
          <div className={`text-xl font-bold ${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance.balance >= 0
              ? `+$${balance.balance.toFixed(2)}`
              : `-$${Math.abs(balance.balance).toFixed(2)}`}
          </div>
        </div>

        {balance.balance < 0 && balance.owes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Owes Money To</h3>
            <div className="space-y-3">
              {balance.owes.map(owe => (
                <div key={owe.email} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{owe.name}</div>
                    <div className="text-xs text-gray-500">{owe.email}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-600 font-medium mr-3">${owe.amount.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        setSettleToEmail(owe.email);
                        setSettleAmount(owe.amount.toString());
                        setShowSettleForm(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {balance.balance > 0 && balance.isOwed.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Is Owed Money By</h3>
            <div className="space-y-3">
              {balance.isOwed.map(owed => (
                <div key={owed.email} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{owed.name}</div>
                    <div className="text-xs text-gray-500">{owed.email}</div>
                  </div>
                  <div className="text-green-600 font-medium">${owed.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettleForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Settle Debt</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <select
                value={settleToEmail}
                onChange={(e) => setSettleToEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSettling}
              >
                <option value="">Select a person</option>
                {balance.owes.map(owe => (
                  <option key={owe.email} value={owe.email}>
                    {owe.name} (${owe.amount.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSettling}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSettleForm(false)}
                className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md"
                disabled={isSettling}
              >
                Cancel
              </button>
              <button
                onClick={handleSettleDebt}
                disabled={!settleToEmail || !settleAmount || isSettling}
                className={`px-3 py-1 bg-blue-600 text-white rounded-md ${
                  !settleToEmail || !settleAmount || isSettling ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isSettling ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
