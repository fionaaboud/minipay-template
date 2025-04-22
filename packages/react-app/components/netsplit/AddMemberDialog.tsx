'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useState } from 'react';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

export default function AddMemberDialog({ open, onClose, groupId }: AddMemberDialogProps) {
  const { addMember } = useNetsplit();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  
  if (!open) return null;
  
  const handleAddMember = () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }
    
    // Simple email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setIsAdding(true);
    
    try {
      addMember(groupId, name, email);
      setName('');
      setEmail('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Member</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter member's name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter member's email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            The email should be associated with their MiniPay account
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMember}
            disabled={!name.trim() || !email.trim() || isAdding}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md transition ${
              !name.trim() || !email.trim() || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isAdding ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
