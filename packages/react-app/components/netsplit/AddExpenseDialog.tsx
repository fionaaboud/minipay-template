'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useWeb3Context } from '@/contexts/useWeb3Context';
import { Member, SplitDetail, SplitType } from '@/types/netsplit';
import { useState, useEffect } from 'react';
import MentoService from '@/services/mentoService';

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
  currentUserEmail: string;
}

export default function AddExpenseDialog({
  open,
  onClose,
  groupId,
  members,
  currentUserEmail
}: AddExpenseDialogProps) {
  const { addExpense } = useNetsplit();
  const { supportedCurrencies } = useWeb3Context();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('cUSD');
  const [paidByEmail, setPaidByEmail] = useState(currentUserEmail);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [customSplits, setCustomSplits] = useState<SplitDetail[]>([]);
  const [percentageSplits, setPercentageSplits] = useState<{email: string, percentage: number}[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Initialize custom and percentage splits when members change or split type changes
  useEffect(() => {
    if (members.length > 0) {
      const eligibleMembers = members.filter(m => m.email !== paidByEmail);

      if (eligibleMembers.length === 0) return;

      if (splitType === SplitType.CUSTOM) {
        // For custom splits, initialize with equal amounts
        const totalAmount = parseFloat(amount) || 0;

        // Convert the total amount to cUSD if needed
        let totalAmountInUSD = totalAmount;
        if (currency !== 'cUSD') {
          // Use the mock conversion rates for now
          if (currency === 'cEUR') {
            totalAmountInUSD = totalAmount * 1.08; // 1 EUR = 1.08 USD
          } else if (currency === 'cREAL') {
            totalAmountInUSD = totalAmount * 0.2; // 1 REAL = 0.2 USD
          }
        }

        const equalAmount = totalAmountInUSD / eligibleMembers.length;

        const memberSplits = eligibleMembers.map(m => ({
          email: m.email,
          name: m.name,
          amount: equalAmount,
          currency: 'cUSD', // Always use cUSD for all splits
          isPaid: false
        }));
        setCustomSplits(memberSplits);
      } else if (splitType === SplitType.PERCENTAGE) {
        // Initialize with equal percentages
        const equalPercentage = 100 / eligibleMembers.length;
        const memberPercentages = eligibleMembers.map(m => ({
          email: m.email,
          percentage: equalPercentage
        }));
        setPercentageSplits(memberPercentages);
      }
    }
  }, [members, paidByEmail, splitType, amount, currency]);

  if (!open) return null;

  const handleAddExpense = () => {
    if (!title.trim() || !amount || !paidByEmail) {
      setError('Title, amount, and payer are required');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setIsAdding(true);

    try {
      // Prepare the split details based on the split type
      let splitDetails;
      if (splitType === SplitType.CUSTOM) {
        splitDetails = customSplits;
      } else if (splitType === SplitType.PERCENTAGE) {
        // Check if percentages add up to 100%
        if (Math.abs(totalPercentage - 100) > 0.01) {
          setError(`Percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
          return;
        }
        splitDetails = getPercentageSplitsAsCustom();
      }

      addExpense(
        groupId,
        title,
        amountValue,
        currency,
        paidByEmail,
        splitType,
        splitDetails
      );

      // Reset form
      setTitle('');
      setAmount('');
      setPaidByEmail(currentUserEmail);
      setSplitType(SplitType.EQUAL);

      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to add expense');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCustomSplitChange = (email: string, newAmount: number) => {
    setCustomSplits(prev =>
      prev.map(split =>
        split.email === email
          ? { ...split, amount: newAmount }
          : split
      )
    );
  };

  const handlePercentageSplitChange = (email: string, newPercentage: number) => {
    setPercentageSplits(prev =>
      prev.map(split =>
        split.email === email
          ? { ...split, percentage: newPercentage }
          : split
      )
    );
  };

  // Convert percentage splits to custom splits for the expense
  const getPercentageSplitsAsCustom = () => {
    if (!amount) return [];

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) return [];

    // Convert the total amount to cUSD if needed
    let totalAmountInUSD = totalAmount;
    if (currency !== 'cUSD') {
      // Use the mock conversion rates for now
      if (currency === 'cEUR') {
        totalAmountInUSD = totalAmount * 1.08; // 1 EUR = 1.08 USD
      } else if (currency === 'cREAL') {
        totalAmountInUSD = totalAmount * 0.2; // 1 REAL = 0.2 USD
      }
    }

    return percentageSplits.map(split => {
      const member = members.find(m => m.email === split.email);
      const splitAmount = (split.percentage / 100) * totalAmountInUSD;

      return {
        email: split.email,
        name: member?.name || split.email,
        amount: splitAmount,
        currency: 'cUSD', // Always use cUSD for all splits
        isPaid: false
      };
    });
  };

  // Calculate the total percentage to ensure it adds up to 100%
  const totalPercentage = percentageSplits.reduce((sum, split) => sum + split.percentage, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add Expense</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was this expense for?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedCurrencies.map(curr => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {amount && currency !== 'cUSD' && (
              <div className="flex justify-between">
                <span>Approximate value:</span>
                <span>${(parseFloat(amount) * (currency === 'cEUR' ? 1.08 : currency === 'cREAL' ? 0.2 : 1)).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paid By
          </label>
          <select
            value={paidByEmail}
            onChange={(e) => setPaidByEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {members.map(member => (
              <option key={member.email} value={member.email}>
                {member.name} {member.email === currentUserEmail ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Split Type
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setSplitType(SplitType.EQUAL)}
              className={`flex-1 py-2 px-3 rounded-md ${
                splitType === SplitType.EQUAL
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => setSplitType(SplitType.PERCENTAGE)}
              className={`flex-1 py-2 px-3 rounded-md ${
                splitType === SplitType.PERCENTAGE
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              Percentage
            </button>
            <button
              type="button"
              onClick={() => setSplitType(SplitType.CUSTOM)}
              className={`flex-1 py-2 px-3 rounded-md ${
                splitType === SplitType.CUSTOM
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {splitType === SplitType.PERCENTAGE && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Percentage Split
            </label>
            <div className="bg-blue-50 p-3 rounded-lg mb-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Total: {totalPercentage.toFixed(1)}%</span>
                <span className={totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}>
                  {totalPercentage === 100 ? '✓ Valid' : `${(100 - totalPercentage).toFixed(1)}% remaining`}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {members
                .filter(member => member.email !== paidByEmail)
                .map(member => {
                  const split = percentageSplits.find(s => s.email === member.email);
                  const percentage = split?.percentage || 0;
                  const calculatedAmount = percentage / 100 * (parseFloat(amount) || 0);

                  return (
                    <div key={member.email} className="flex items-center">
                      <div className="flex-1">
                        {member.name} {member.email === currentUserEmail ? '(You)' : ''}
                      </div>
                      <div className="w-24 flex items-center">
                        <input
                          type="number"
                          value={percentage}
                          onChange={(e) => handlePercentageSplitChange(
                            member.email,
                            parseFloat(e.target.value) || 0
                          )}
                          placeholder="0"
                          step="1"
                          min="0"
                          max="100"
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-right"
                        />
                        <span className="ml-1">%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
            {amount && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Preview Amounts</div>
                <div className="space-y-2">
                  {members
                    .filter(member => member.email !== paidByEmail)
                    .map(member => {
                      const split = percentageSplits.find(s => s.email === member.email);
                      const percentage = split?.percentage || 0;
                      const calculatedAmount = (percentage / 100) * (parseFloat(amount) || 0);

                      return (
                        <div key={`amount-${member.email}`} className="flex justify-between text-sm">
                          <div>{member.name}</div>
                          <div>${calculatedAmount.toFixed(2)} ({percentage}%)</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {splitType === SplitType.CUSTOM && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Split
            </label>
            <div className="space-y-3">
              {members
                .filter(member => member.email !== paidByEmail)
                .map(member => {
                  const split = customSplits.find(s => s.email === member.email);
                  const splitAmount = split?.amount || 0;

                  return (
                    <div key={member.email} className="flex items-center">
                      <div className="flex-1">
                        {member.name} {member.email === currentUserEmail ? '(You)' : ''}
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={splitAmount}
                          onChange={(e) => handleCustomSplitChange(
                            member.email,
                            parseFloat(e.target.value) || 0
                          )}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddExpense}
            disabled={!title.trim() || !amount || isAdding}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md transition ${
              !title.trim() || !amount || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isAdding ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
