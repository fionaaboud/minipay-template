'use client';

import { useNetsplit } from '@/contexts/useNetsplit';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Group } from '@/types/netsplit';
import CreateGroupDialog from '@/components/netsplit/CreateGroupDialog';

export default function NetsplitPage() {
  const { groups, isMiniPay, currentUserEmail } = useNetsplit();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [recentGroups, setRecentGroups] = useState<Group[]>([]);
  
  useEffect(() => {
    // Filter groups to show only those the current user is a member of
    if (currentUserEmail) {
      const userGroups = groups.filter(group => 
        group.members.some(member => member.email === currentUserEmail)
      );
      setRecentGroups(userGroups);
    }
  }, [groups, currentUserEmail]);
  
  return (
    <div className="max-w-md mx-auto">
      {isMiniPay && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-6 text-center">
          ✅ Running inside MiniPay wallet
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
        
        {recentGroups.length > 0 ? (
          <ul className="space-y-3">
            {recentGroups.map(group => (
              <li key={group.id}>
                <Link href={`/netsplit/group/${group.id}`} className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition">
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {group.members.length} members • {group.expenses.length} expenses
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 py-4">
            You don&apos;t have any groups yet
          </div>
        )}
        
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Group
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Split bills easily with friends and family</p>
        <p>All transactions are processed through MiniPay</p>
      </div>
      
      <CreateGroupDialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
      />
    </div>
  );
}
