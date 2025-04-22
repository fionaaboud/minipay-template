'use client';

import { Expense } from '@/types/netsplit';
import { useState } from 'react';

interface ExpenseDetailDialogProps {
  open: boolean;
  onClose: () => void;
  expense: Expense;
  currentUserEmail: string;
}

export default function ExpenseDetailDialog({
  open,
  onClose,
  expense,
  currentUserEmail
}: ExpenseDetailDialogProps) {
  if (!open) return null;

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total amount owed by others
  const totalOwed = expense.splitWith.reduce((sum, split) => sum + split.amount, 0);

  // Check if current user is the payer
  const isCurrentUserPayer = expense.paidBy === currentUserEmail;

  // Check if current user owes money for this expense
  const currentUserSplit = expense.splitWith.find(split => split.email === currentUserEmail);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">{expense.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          This shows the individual expense details. In the balance view, these amounts may be
          consolidated with other expenses to show the net amount owed between members.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">Total amount</div>
            <div className="text-xl font-bold">${expense.amount.toFixed(2)}</div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(expense.timestamp)}
          </div>
        </div>

        <div className="mb-4">
          <div className="font-medium mb-2">Paid by</div>
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
              <span className="material-icons text-blue-500">person</span>
            </div>
            <div>
              <div className="font-medium">
                {isCurrentUserPayer ? 'You' : expense.paidByName}
              </div>
              <div className="text-sm text-gray-500">{expense.paidBy}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-2">Split with</div>
          <div className="space-y-2">
            {expense.splitWith.map(split => (
              <div
                key={split.email}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  split.email === currentUserEmail ? 'bg-yellow-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-2 ${
                    split.email === currentUserEmail ? 'bg-yellow-100' : 'bg-gray-200'
                  }`}>
                    <span className="material-icons text-sm">
                      {split.email === currentUserEmail ? 'person' : 'person_outline'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {split.email === currentUserEmail ? 'You' : split.name}
                    </div>
                    <div className="text-xs text-gray-500">{split.email}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="font-medium mr-2">${split.amount.toFixed(2)}</div>
                  {split.isPaid ? (
                    <span className="text-green-500 text-xs bg-green-100 px-2 py-1 rounded-full">Paid</span>
                  ) : (
                    <span className="text-red-500 text-xs bg-red-100 px-2 py-1 rounded-full">Unpaid</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isCurrentUserPayer && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="font-medium text-green-800">You are owed</div>
            <div className="text-xl font-bold text-green-700">${totalOwed.toFixed(2)}</div>
            <div className="text-sm text-green-600 mt-1">
              {expense.splitWith.filter(s => !s.isPaid).length} people still need to pay
            </div>
          </div>
        )}

        {currentUserSplit && !currentUserSplit.isPaid && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <div className="font-medium text-red-800">You owe</div>
            <div className="text-xl font-bold text-red-700">${currentUserSplit.amount.toFixed(2)}</div>
            <div className="text-sm text-red-600 mt-1">
              to {expense.paidByName}
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
