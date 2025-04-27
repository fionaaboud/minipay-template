'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Balance, Expense, Group, Payment, SplitType } from '@/types/netsplit';
import MentoService from '@/services/mentoService';
import AddMemberDialog from '@/components/netsplit/AddMemberDialog';
import AddExpenseDialog from '@/components/netsplit/AddExpenseDialog';
import ViewBalancesDialog from '@/components/netsplit/ViewBalancesDialog';
import TransactionsList from '@/components/netsplit/TransactionsList';
import UniversalPayButton from '@/components/netsplit/UniversalPayButton';
import BalanceDetailDialog from '@/components/netsplit/BalanceDetailDialog';
import CurrencyPreferenceDialog from '@/components/netsplit/CurrencyPreferenceDialog';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const {
    loadGroup,
    currentGroup,
    currentUserEmail,
    calculateBalances
  } = useNetsplit();

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showBalancesDialog, setShowBalancesDialog] = useState(false);
  const [showBalanceDetailDialog, setShowBalanceDetailDialog] = useState(false);
  const [showCurrencyPreferenceDialog, setShowCurrencyPreferenceDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<(Expense | Payment)[]>([]);

  useEffect(() => {
    if (groupId && typeof groupId === 'string') {
      console.log('Loading group with ID:', groupId);
      const group = loadGroup(groupId);

      if (!group) {
        console.log('Group not found in state, checking localStorage directly');

        // Try to load the group directly from localStorage
        try {
          if (typeof window !== 'undefined') {
            const storedGroups = localStorage.getItem('netsplit_groups');
            if (storedGroups) {
              const parsedGroups = JSON.parse(storedGroups);
              console.log('Groups from localStorage:', parsedGroups);

              const foundGroup = parsedGroups.find((g: Group) => g.id === groupId);
              if (foundGroup) {
                console.log('Found group in localStorage:', foundGroup);
                // Force load the group
                loadGroup(groupId);
                return;
              }
            }

            // Check if this was the last created group
            const lastCreatedGroupId = sessionStorage.getItem('lastCreatedGroupId');
            if (lastCreatedGroupId === groupId) {
              console.log('This is the last created group, reloading page to try again');
              sessionStorage.removeItem('lastCreatedGroupId');
              window.location.reload();
              return;
            }
          }
        } catch (error) {
          console.error('Error checking localStorage:', error);
        }

        // Group not found, redirect to main page
        console.log('Group not found, redirecting to main page');
        router.push('/netsplit');
      }
    }
  }, [groupId, loadGroup, router]);

  useEffect(() => {
    if (currentGroup) {
      // Combine expenses and payments and sort by timestamp
      const allTransactions = [
        ...currentGroup.expenses,
        ...currentGroup.payments
      ].sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(allTransactions);
    }
  }, [currentGroup]);

  if (!currentGroup) {
    return <div className="text-center py-8">Loading group...</div>;
  }

  const userBalance = calculateBalances(currentGroup.id)
    .find(balance => balance.email === currentUserEmail);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">{currentGroup.name}</h2>

        <div className="flex space-x-2 mb-6 overflow-x-auto py-2">
          <button
            onClick={() => setShowBalancesDialog(true)}
            className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm whitespace-nowrap"
          >
            <span className="material-icons text-sm mr-1">account_balance_wallet</span>
            Balances
          </button>

          <button
            onClick={() => setShowAddMemberDialog(true)}
            className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm whitespace-nowrap"
          >
            <span className="material-icons text-sm mr-1">person_add</span>
            Add Member
          </button>

          <button
            onClick={() => setShowCurrencyPreferenceDialog(true)}
            className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm whitespace-nowrap"
          >
            <span className="material-icons text-sm mr-1">currency_exchange</span>
            Currency
          </button>

          {/* Share button removed as it was out of frame */}
        </div>

        {userBalance && (
          <div
            className={`p-4 rounded-lg mb-6 ${userBalance.balance >= 0 ? 'bg-green-50' : 'bg-red-50'} cursor-pointer hover:opacity-90 transition`}
            onClick={() => {
              setSelectedBalance(userBalance);
              setShowBalanceDetailDialog(true);
            }}
          >
            <div className="font-medium">Your Balance</div>
            <div className={`text-xl font-bold ${userBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {userBalance.balance >= 0
                ? `You are owed $${userBalance.balance.toFixed(2)}`
                : `You owe $${Math.abs(userBalance.balance).toFixed(2)}`}
            </div>
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <span className="material-icons text-xs mr-1">info</span>
              Click for details
            </div>
          </div>
        )}

        <h3 className="text-xl font-semibold mb-3">Transactions</h3>

        <TransactionsList
          transactions={transactions}
          currentUserEmail={currentUserEmail || ''}
        />

        <div className="mt-6 space-y-3">
          <button
            onClick={() => setShowAddExpenseDialog(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <span className="material-icons mr-2">add_circle</span>
            Add Expense
          </button>

          {userBalance && userBalance.balance < 0 && (
            <UniversalPayButton
              balance={userBalance}
              onPaymentComplete={() => {
                // Refresh the group data after payment
                if (groupId && typeof groupId === 'string') {
                  loadGroup(groupId);
                }
              }}
            />
          )}
        </div>
      </div>

      <AddMemberDialog
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        groupId={currentGroup.id}
      />

      <AddExpenseDialog
        open={showAddExpenseDialog}
        onClose={() => setShowAddExpenseDialog(false)}
        groupId={currentGroup.id}
        members={currentGroup.members}
        currentUserEmail={currentUserEmail || ''}
      />

      <ViewBalancesDialog
        open={showBalancesDialog}
        onClose={() => setShowBalancesDialog(false)}
        groupId={currentGroup.id}
        currentUserEmail={currentUserEmail || ''}
      />

      {selectedBalance && (
        <BalanceDetailDialog
          open={showBalanceDetailDialog}
          onClose={() => setShowBalanceDetailDialog(false)}
          balance={selectedBalance}
          groupId={currentGroup.id}
        />
      )}

      <CurrencyPreferenceDialog
        open={showCurrencyPreferenceDialog}
        onClose={() => setShowCurrencyPreferenceDialog(false)}
        groupId={currentGroup.id}
        currentUserEmail={currentUserEmail || ''}
      />
    </div>
  );
}
