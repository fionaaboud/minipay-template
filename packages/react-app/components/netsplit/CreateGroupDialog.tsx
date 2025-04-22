'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
  const { createGroup } = useNetsplit();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!open) return null;

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      console.log('Creating group with name:', groupName);
      const newGroup = createGroup(groupName);
      console.log('Group created successfully:', newGroup);

      // Use a small delay before navigation to ensure state is updated
      setTimeout(() => {
        const groupPath = `/netsplit/group/${newGroup.id}`;
        console.log('Navigating to group page:', groupPath);

        // Try to use window.location for more reliable navigation in ngrok environment
        if (typeof window !== 'undefined') {
          // Store the new group ID in sessionStorage for retrieval after navigation
          sessionStorage.setItem('lastCreatedGroupId', newGroup.id);

          // Use window.location for navigation
          window.location.href = groupPath;
        } else {
          // Fallback to Next.js router if window is not available
          router.push(groupPath);
        }

        setGroupName('');
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Trip to Paris, Roommates, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md transition ${
              !groupName.trim() || isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
