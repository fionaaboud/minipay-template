'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWeb3Context } from './useWeb3Context';
import { Balance, Expense, Group, Member, Payment, SplitDetail, SplitType } from '@/types/netsplit';
import { Address } from 'viem'; // Import Address type
// Import only what we need

interface NetsplitContextType {
  currentGroup: Group | null;
  groups: Group[];
  isMiniPay: boolean;
  currentUserEmail: string | null;

  // Group management
  createGroup: (name: string) => Group;
  loadGroup: (groupId: string) => Group | null;
  saveGroup: (group: Group) => void;

  // Member management
  addMember: (groupId: string, name: string, email: string) => void;

  // Expense management
  addExpense: (
    groupId: string,
    title: string,
    amount: number,
    currency: string,
    paidByEmail: string,
    splitType: SplitType,
    splitDetails?: SplitDetail[]
  ) => void;

  // Payment management
  settleDebt: (groupId: string, toEmail: string, amount: string, currency?: string) => Promise<any>;

  // Balance calculation
  calculateBalances: (groupId: string) => Balance[];
}

const NetsplitContext = createContext<NetsplitContextType | undefined>(undefined);

export const NetsplitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, sendCUSD, walletType } = useWeb3Context();

  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Initialize with a default email for development purposes
  useEffect(() => {
    // Set a default user email regardless of MiniPay detection
    // This ensures we always have a user email available
    setCurrentUserEmail('current.user@example.com');

    // Check if we're in MiniPay environment based on wallet type
    if (walletType === 'minipay') {
      setIsMiniPay(true);

      // In a real app, you would get the user's email from MiniPay
      // For now, we're using the default email set above
    }

    // Load groups from localStorage
    if (typeof window !== 'undefined') {
      const savedGroups = localStorage.getItem('netsplit_groups');
      if (savedGroups) {
        try {
          setGroups(JSON.parse(savedGroups));
        } catch (error) {
          console.error('Error parsing saved groups:', error);
          // If there's an error parsing, initialize with empty array
          setGroups([]);
        }
      }
    }
  }, [walletType]);

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        console.log('Saving groups to localStorage:', groups);
        localStorage.setItem('netsplit_groups', JSON.stringify(groups));
      } catch (error) {
        console.error('Error saving groups to localStorage:', error);
      }
    }
  }, [groups]);

  // Group management functions
  const createGroup = (name: string): Group => {
    console.log('Creating group with name:', name);

    // Use the current email or a default if not available
    const userEmail = currentUserEmail || 'current.user@example.com';
    console.log('Using email:', userEmail);

    const newGroup: Group = {
      id: uuidv4(),
      name,
      createdBy: userEmail,
      createdAt: Date.now(),
      members: [
        {
          name: 'You',
          email: userEmail,
          walletAddress: address || undefined
        }
      ],
      expenses: [],
      payments: []
    };

    console.log('New group created:', newGroup);

    // Update state with the new group
    const updatedGroups = [...groups, newGroup];
    console.log('Updated groups:', updatedGroups);

    setGroups(updatedGroups);
    setCurrentGroup(newGroup);

    // Force save to localStorage immediately
    try {
      localStorage.setItem('netsplit_groups', JSON.stringify(updatedGroups));
      console.log('Groups saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    return newGroup;
  };

  const loadGroup = (groupId: string): Group | null => {
    console.log('Loading group with ID:', groupId, 'from groups:', groups);

    // First try to find the group in the current state
    let group = groups.find(g => g.id === groupId) || null;

    // If not found in state, try to load from localStorage
    if (!group && typeof window !== 'undefined') {
      try {
        console.log('Group not found in state, checking localStorage');
        const storedGroups = localStorage.getItem('netsplit_groups');

        if (storedGroups) {
          const parsedGroups = JSON.parse(storedGroups);
          console.log('Groups from localStorage:', parsedGroups);

          const foundGroup = parsedGroups.find((g: Group) => g.id === groupId);
          if (foundGroup) {
            console.log('Found group in localStorage:', foundGroup);
            group = foundGroup;

            // Update the groups state with all groups from localStorage
            setGroups(parsedGroups);
          }
        }
      } catch (error) {
        console.error('Error loading group from localStorage:', error);
      }
    }

    if (group) {
      console.log('Setting current group:', group);
      setCurrentGroup(group);
    } else {
      console.log('Group not found');
    }

    return group;
  };

  const saveGroup = (group: Group): void => {
    const updatedGroups = groups.map(g => g.id === group.id ? group : g);
    setGroups(updatedGroups);
    setCurrentGroup(group);
  };

  // Member management functions
  const addMember = (groupId: string, name: string, email: string): void => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Check if member already exists
    if (group.members.some(m => m.email === email)) {
      throw new Error('Member with this email already exists');
    }

    const newMember: Member = {
      name,
      email,
      // In a real app, you would get the wallet address from MiniPay
      // For now, we'll leave it undefined
      walletAddress: undefined
    };

    const updatedGroup = {
      ...group,
      members: [...group.members, newMember]
    };

    saveGroup(updatedGroup);
  };

  // Expense management functions
  const addExpense = (
    groupId: string,
    title: string,
    amount: number,
    currency: string = 'cUSD',
    paidByEmail: string,
    splitType: SplitType,
    customSplitDetails?: SplitDetail[]
  ): void => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const paidByMember = group.members.find(m => m.email === paidByEmail);
    if (!paidByMember) {
      throw new Error('Paying member not found');
    }

    let splitWith: SplitDetail[] = [];

    // Calculate split based on type
    if (splitType === SplitType.EQUAL) {
      // Convert the total amount to cUSD if needed
      let amountInUSD = amount;
      if (currency !== 'cUSD') {
        // Use the mock conversion rates for now
        if (currency === 'cEUR') {
          amountInUSD = amount * 1.08; // 1 EUR = 1.08 USD
        } else if (currency === 'cREAL') {
          amountInUSD = amount * 0.2; // 1 REAL = 0.2 USD
        }
      }

      const splitAmount = amountInUSD / group.members.length;

      splitWith = group.members
        .filter(m => m.email !== paidByEmail) // Exclude the payer
        .map(m => ({
          email: m.email,
          name: m.name,
          amount: splitAmount,
          currency: 'cUSD', // Always use cUSD for all splits
          isPaid: false
        }));
    } else if ((splitType === SplitType.CUSTOM || splitType === SplitType.PERCENTAGE) && customSplitDetails) {
      // Both custom and percentage splits use the same format for storage
      // For percentage splits, the amounts have already been calculated in the UI
      splitWith = customSplitDetails;
    }

    const newExpense: Expense = {
      id: uuidv4(),
      title,
      amount,
      currency,
      paidBy: paidByEmail,
      paidByName: paidByMember.name,
      timestamp: Date.now(),
      splitWith
    };

    const updatedGroup = {
      ...group,
      expenses: [...group.expenses, newExpense]
    };

    saveGroup(updatedGroup);
  };

  // Payment management functions
  const settleDebt = async (groupId: string, toEmail: string, amount: string, currency: string = 'cUSD'): Promise<any> => {
    console.log(`Settling debt: ${amount} ${currency} to ${toEmail} in group ${groupId}`);
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');

    const toMember = group.members.find(m => m.email === toEmail);
    if (!toMember) throw new Error('Member not found');
    if (!toMember.walletAddress) throw new Error('Member wallet address not found');

    // Use the current email or a default if not available
    const userEmail = currentUserEmail || 'current.user@example.com';
    const fromMember = group.members.find(m => m.email === userEmail);
    if (!fromMember) throw new Error('Current user not found in group');

    try {
      // Send payment using wallet
      console.log(`Sending ${amount} ${currency} to ${toMember.walletAddress}`);
      // Cast walletAddress to Address type as preceding checks ensure it's defined
      const tx = await sendCUSD(toMember.walletAddress as Address, amount);
      console.log('Transaction successful:', tx);

      // Record the payment
      const newPayment: Payment = {
        id: uuidv4(),
        from: address || '',
        fromEmail: userEmail,
        fromName: fromMember.name,
        to: toMember.walletAddress,
        toEmail: toEmail,
        toName: toMember.name,
        amount,
        currency,
        timestamp: Date.now()
      };

      console.log('Recording payment:', newPayment);

      // Calculate how much is still owed after this payment
      const paymentAmount = parseFloat(amount);
      let remainingAmount = paymentAmount;

      // Create a copy of the group to update
      const updatedGroup = {
        ...group,
        payments: [...group.payments, newPayment],
        expenses: [...group.expenses] // Create a copy of expenses to modify
      };

      // Mark expenses as paid based on the payment amount
      // Sort expenses by date (oldest first) to pay them in chronological order
      const sortedExpenses = [...updatedGroup.expenses]
        .filter(expense =>
          expense.paidBy === toEmail &&
          expense.splitWith.some(s => s.email === userEmail && !s.isPaid)
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      console.log(`Found ${sortedExpenses.length} expenses to potentially mark as paid`);

      // Mark expenses as paid until the payment amount is used up
      for (const expense of sortedExpenses) {
        if (remainingAmount <= 0) break;

        const userSplit = expense.splitWith.find(s => s.email === userEmail && !s.isPaid);
        if (userSplit) {
          if (remainingAmount >= userSplit.amount) {
            // Can pay this expense completely
            console.log(`Marking expense ${expense.title} as paid ($${userSplit.amount})`);
            remainingAmount -= userSplit.amount;

            // Update the expense in the updatedGroup
            const expenseIndex = updatedGroup.expenses.findIndex(e => e.id === expense.id);
            if (expenseIndex !== -1) {
              updatedGroup.expenses[expenseIndex] = {
                ...expense,
                splitWith: expense.splitWith.map(split =>
                  split.email === userEmail
                    ? { ...split, isPaid: true }
                    : split
                )
              };
            }
          } else {
            // Can only partially pay this expense (we don't support this yet)
            // In a real app, you might want to support partial payments
            console.log(`Cannot fully pay expense ${expense.title} with remaining $${remainingAmount}`);
          }
        }
      }

      console.log('Saving updated group');
      saveGroup(updatedGroup);
      return tx;
    } catch (error) {
      console.error('Error settling debt:', error);
      throw error;
    }
  };

  // Balance calculation
  const calculateBalances = (groupId: string): Balance[] => {
    console.log('Calculating balances for group:', groupId);
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    // We'll use cUSD for all balance calculations for consistency

    // Initialize balances for all members
    const balances: Record<string, Balance> = {};
    group.members.forEach(member => {
      balances[member.email] = {
        email: member.email,
        name: member.name,
        balance: 0,
        preferredCurrency: 'cUSD', // Default to cUSD
        owes: [],
        isOwed: []
      };
    });

    // Create a simplified debt matrix to track who owes whom
    const netDebtMatrix: Record<string, Record<string, number>> = {};

    // Initialize the debt matrix with zeros
    group.members.forEach(member1 => {
      netDebtMatrix[member1.email] = {};
      group.members.forEach(member2 => {
        netDebtMatrix[member1.email][member2.email] = 0;
      });
    });

    console.log('Processing expenses...');
    // Process all expenses to build the debt matrix
    group.expenses.forEach(expense => {
      const payer = expense.paidBy;

      expense.splitWith.forEach(split => {
        if (!split.isPaid && split.email !== payer) {
          // The person who split the expense owes the payer
          netDebtMatrix[split.email][payer] += split.amount;
          console.log(`${split.email} owes ${payer} $${split.amount} for expense ${expense.title}`);
        }
      });
    });

    console.log('Processing payments...');
    // Process all payments
    group.payments.forEach(payment => {
      const fromEmail = payment.fromEmail;
      const toEmail = payment.toEmail;
      const amount = parseFloat(payment.amount);

      // Reduce the debt in the matrix
      netDebtMatrix[fromEmail][toEmail] -= amount;
      console.log(`${fromEmail} paid ${toEmail} $${amount}`);
    });

    console.log('Initial debt matrix:', JSON.stringify(netDebtMatrix, null, 2));

    // Simplify the debt matrix by canceling out mutual debts
    group.members.forEach(member1 => {
      group.members.forEach(member2 => {
        if (member1.email !== member2.email) {
          const debt1to2 = netDebtMatrix[member1.email][member2.email];
          const debt2to1 = netDebtMatrix[member2.email][member1.email];

          if (debt1to2 > 0 && debt2to1 > 0) {
            // Both members owe each other, so cancel out the smaller debt
            if (debt1to2 >= debt2to1) {
              netDebtMatrix[member1.email][member2.email] -= debt2to1;
              netDebtMatrix[member2.email][member1.email] = 0;
              console.log(`Canceled out ${debt2to1} that ${member2.name} owed ${member1.name}`);
            } else {
              netDebtMatrix[member2.email][member1.email] -= debt1to2;
              netDebtMatrix[member1.email][member2.email] = 0;
              console.log(`Canceled out ${debt1to2} that ${member1.name} owed ${member2.name}`);
            }
          }
        }
      });
    });

    console.log('Simplified debt matrix:', JSON.stringify(netDebtMatrix, null, 2));

    // Calculate the total balance for each member
    group.members.forEach(member => {
      let totalOwed = 0;
      let totalOwes = 0;
      // For the main balance calculation, always use cUSD
      // For individual expenses, use the member's preferred currency when displaying

      // Calculate how much this member owes others
      group.members.forEach(otherMember => {
        if (member.email !== otherMember.email) {
          const owesAmount = netDebtMatrix[member.email][otherMember.email];
          if (owesAmount > 0) {
            // For the total balance, keep everything in cUSD
            totalOwes += owesAmount;
          }

          // Calculate how much others owe this member
          const isOwedAmount = netDebtMatrix[otherMember.email][member.email];
          if (isOwedAmount > 0) {
            // For the total balance, keep everything in cUSD
            totalOwed += isOwedAmount;
          }
        }
      });

      // Always set the overall balance in cUSD for consistency
      balances[member.email].balance = totalOwed - totalOwes;
      balances[member.email].preferredCurrency = 'cUSD'; // Force cUSD for the main balance
    });

    // Build the owes and isOwed arrays based on the simplified debt matrix
    group.members.forEach(debtor => {
      group.members.forEach(creditor => {
        if (debtor.email !== creditor.email) {
          const debtAmount = netDebtMatrix[debtor.email][creditor.email];

          if (debtAmount > 0) {
            // Round to 2 decimal places for display
            const roundedAmount = Math.round(debtAmount * 100) / 100;

            // For display purposes, we'll show the amount in cUSD
            // This ensures consistency with the main balance

            // Add to owes list in cUSD
            balances[debtor.email].owes.push({
              email: creditor.email,
              name: creditor.name,
              amount: roundedAmount,
              currency: 'cUSD', // Always use cUSD for consistency
              walletAddress: creditor.walletAddress
            });

            // Add to isOwed list in cUSD
            balances[creditor.email].isOwed.push({
              email: debtor.email,
              name: debtor.name,
              amount: roundedAmount,
              currency: 'cUSD', // Always use cUSD for consistency
              walletAddress: debtor.walletAddress
            });

            console.log(`${debtor.name} owes ${creditor.name} $${roundedAmount} (net)`);
          }
        }
      });
    });

    const result = Object.values(balances);
    console.log('Final balances:', result);
    return result;
  };

  const value = {
    currentGroup,
    groups,
    isMiniPay,
    currentUserEmail,
    createGroup,
    loadGroup,
    saveGroup,
    addMember,
    addExpense,
    settleDebt,
    calculateBalances
  };

  return (
    <NetsplitContext.Provider value={value}>
      {children}
    </NetsplitContext.Provider>
  );
};

export const useNetsplit = (): NetsplitContextType => {
  const context = useContext(NetsplitContext);
  if (context === undefined) {
    throw new Error('useNetsplit must be used within a NetsplitProvider');
  }
  return context;
};
