export interface Member {
  name: string;
  email: string;
  walletAddress?: string;
  avatarUrl?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // Member email
  paidByName: string; // Member name
  timestamp: number;
  splitWith: SplitDetail[];
}

export interface SplitDetail {
  email: string;
  name: string;
  amount: number;
  isPaid: boolean;
}

export interface Payment {
  id: string;
  from: string; // Wallet address
  fromEmail: string;
  fromName: string;
  to: string; // Wallet address
  toEmail: string;
  toName: string;
  amount: string;
  timestamp: number;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string; // Email of creator
  createdAt: number;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  notes?: string;
}

export interface Balance {
  email: string;
  name: string;
  balance: number; // Positive means they are owed money, negative means they owe money
  owes: { email: string; name: string; amount: number; walletAddress?: string }[];
  isOwed: { email: string; name: string; amount: number; walletAddress?: string }[];
}

export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  CUSTOM = 'custom'
}
