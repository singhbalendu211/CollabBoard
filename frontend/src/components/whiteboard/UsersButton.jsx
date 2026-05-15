import React, { useState } from 'react';
import { Users } from 'lucide-react';
import UsersModal from './UsersModal';

export default function UsersButton({ roomId, userCount = 0, onUserCountChange = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(userCount);

  const handleUserCountUpdate = (count) => {
    setDisplayCount(count);
    if (onUserCountChange) {
      onUserCountChange(count);
    }
  };

  return (
    <>
      {/* Users Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        title="View users in room"
      >
        <Users size={20} />
        <span>Users ({displayCount})</span>
      </button>

      {/* Users Modal */}
      {isModalOpen && (
        <UsersModal
          roomId={roomId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUserCountChange={handleUserCountUpdate}
        />
      )}
    </>
  );
}
