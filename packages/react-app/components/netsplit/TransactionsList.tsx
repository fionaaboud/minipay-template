'use client';

import { Expense, Payment } from '@/types/netsplit';
import { useState } from 'react';
import ExpenseDetailDialog from './ExpenseDetailDialog';

interface TransactionsListProps {
  transactions: (Expense | Payment)[];
  currentUserEmail: string;
}

export default function TransactionsList({
  transactions,
  currentUserEmail
}: TransactionsListProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to check if a transaction is an expense
  const isExpense = (transaction: Expense | Payment): transaction is Expense => {
    return 'title' in transaction;
  };

  // Helper function to check if a transaction is a payment
  const isPayment = (transaction: Expense | Payment): transaction is Payment => {
    return 'from' in transaction;
  };

  // Convert any currency to cUSD
  const convertToCUSD = (amount: number, currency: string = 'cUSD'): number => {
    if (currency === 'cUSD') return amount;

    // Use the mock conversion rates for now
    if (currency === 'cEUR') {
      return amount * 1.08; // 1 EUR = 1.08 USD
    } else if (currency === 'cREAL') {
      return amount * 0.2; // 1 REAL = 0.2 USD
    }

    return amount; // Default fallback
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map(transaction => {
        if (isExpense(transaction)) {
          // Render expense
          const isCurrentUserPayer = transaction.paidBy === currentUserEmail;

          return (
            <div key={transaction.id}>
              <div
                className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                onClick={() => {
                  setSelectedExpense(transaction);
                  setShowExpenseDetail(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{transaction.title}</div>
                    <div className="text-sm text-gray-500">
                      {isCurrentUserPayer ? 'You paid' : `${transaction.paidByName} paid`} • {formatDate(transaction.timestamp)}
                    </div>
                  </div>
                  <div className="text-lg font-semibold">
                  {transaction.currency === 'cUSD'
                    ? `$${transaction.amount.toFixed(2)}`
                    : `${transaction.currency} ${transaction.amount.toFixed(2)} (≈ $${convertToCUSD(transaction.amount, transaction.currency).toFixed(2)})`}
                </div>
                </div>

                {transaction.splitWith.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Split with:</div>
                    <div className="space-y-1">
                      {transaction.splitWith.map(split => (
                        <div key={split.email} className="flex justify-between text-sm">
                          <div>
                            {split.email === currentUserEmail ? 'You' : split.name}
                            {split.isPaid && <span className="ml-1 text-green-600">(Paid)</span>}
                          </div>
                          <div>${split.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-blue-600 flex items-center">
                  <span className="material-icons text-xs mr-1">info</span>
                  Click for details
                </div>
              </div>
            </div>
          );
        } else if (isPayment(transaction)) {
          // Render payment
          const isCurrentUserPayer = transaction.fromEmail === currentUserEmail;
          const isCurrentUserReceiver = transaction.toEmail === currentUserEmail;

          return (
            <div key={transaction.id} className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {isCurrentUserPayer
                      ? `You paid ${transaction.toName}`
                      : isCurrentUserReceiver
                        ? `${transaction.fromName} paid you`
                        : `${transaction.fromName} paid ${transaction.toName}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Payment • {formatDate(transaction.timestamp)}
                  </div>
                </div>
                <div className="text-lg font-semibold">
                  {transaction.currency === 'cUSD'
                    ? `$${parseFloat(transaction.amount).toFixed(2)}`
                    : `${transaction.currency} ${parseFloat(transaction.amount).toFixed(2)} (≈ $${convertToCUSD(parseFloat(transaction.amount), transaction.currency).toFixed(2)})`}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Expense Detail Dialog */}
      {selectedExpense && (
        <ExpenseDetailDialog
          open={showExpenseDetail}
          onClose={() => setShowExpenseDetail(false)}
          expense={selectedExpense}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
}
