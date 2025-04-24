'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useWeb3Context } from '@/contexts/useWeb3Context';
import { useState, useEffect } from 'react';
import MentoService from '@/services/mentoService';

interface CurrencyPreferenceDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  currentUserEmail: string;
}

export default function CurrencyPreferenceDialog({
  open,
  onClose,
  groupId,
  currentUserEmail
}: CurrencyPreferenceDialogProps) {
  const { currentGroup, saveGroup } = useNetsplit();
  const { supportedCurrencies } = useWeb3Context();

  // Find the current user
  const currentUser = currentGroup?.members.find(m => m.email === currentUserEmail);

  // Get the current preferred currency
  const [preferredCurrency, setPreferredCurrency] = useState('cUSD');

  // Update preferred currency when currentUser changes
  useEffect(() => {
    if (currentUser?.preferredCurrency) {
      setPreferredCurrency(currentUser.preferredCurrency);
    }
  }, [currentUser]);

  if (!open || !currentGroup) return null;

  const handleSave = () => {
    if (!currentUser) return;

    // Update the user's preferred currency
    const updatedMembers = currentGroup.members.map(member =>
      member.email === currentUserEmail
        ? { ...member, preferredCurrency }
        : member
    );

    // Save the updated group
    saveGroup({
      ...currentGroup,
      members: updatedMembers
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Currency Preference</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select your preferred currency for displaying balances and payments.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Currency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {supportedCurrencies.map(currency => (
              <button
                key={currency}
                type="button"
                onClick={() => setPreferredCurrency(currency)}
                className={`py-2 px-3 rounded-md flex items-center justify-center ${
                  preferredCurrency === currency
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                <span className="mr-1">{MentoService.getCurrencySymbol(currency)}</span>
                {currency}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
