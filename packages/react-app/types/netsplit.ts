export interface Member {
  name: string;
  email: string;
  walletAddress?: string;
  avatarUrl?: string;
  preferredCurrency?: string; // Default is 'cUSD'
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string; // "cUSD", "cEUR", "cREAL"
  paidBy: string; // Member email
  paidByName: string; // Member name
  timestamp: number;
  splitWith: SplitDetail[];
}

export interface SplitDetail {
  email: string;
  name: string;
  amount: number;
  currency?: string; // Currency of the split, defaults to expense currency if not specified
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
  currency: string; // "cUSD", "cEUR", "cREAL"
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
  preferredCurrency: string; // Default currency for this user
  owes: { email: string; name: string; amount: number; currency: string; walletAddress?: string }[];
  isOwed: { email: string; name: string; amount: number; currency: string; walletAddress?: string }[];
}

export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  CUSTOM = 'custom'
}
