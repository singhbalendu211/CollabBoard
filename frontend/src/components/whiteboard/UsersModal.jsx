import React, { useState, useEffect } from 'react';
import { X, ChevronDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function UsersModal({ roomId, isOpen, onClose, onUserCountChange = null }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleDropdown, setRoleDropdown] = useState(null);
  const [isChanging, setIsChanging] = useState(false);

  // Fetch room users on modal open
  useEffect(() => {
    if (isOpen) {
      fetchRoomUsers();
    }
  }, [isOpen, roomId]);

  const fetchRoomUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/rooms/${roomId}/users`);
      setUsers(response.data);
      
      // Update parent with user count
      if (onUserCountChange && response.data.length > 0) {
        onUserCountChange(response.data.length);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch room users');
      console.error('Error fetching room users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      setIsChanging(true);
      setError(null);

      await api.patch(`/rooms/${roomId}/role`, {
        targetUserId,
        newRole,
      });

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.userId === targetUserId ? { ...u, role: newRole } : u
        )
      );

      // Close dropdown
      setRoleDropdown(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change user role');
      console.error('Error changing user role:', err);
    } finally {
      setIsChanging(false);
    }
  };

  // Check if current user is owner
  const isCurrentUserOwner = users.some(
    (u) => u.userId === currentUser._id && u.role === 'owner'
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-24 right-8 bg-white rounded-lg shadow-2xl z-50 w-80 max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Room Users ({users.length})</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users in room</div>
          )}

          {!loading && users.length > 0 && (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.userId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {u.email || 'Unknown User'}
                    </p>
                  </div>

                  {/* Role Display/Dropdown */}
                  <div className="ml-2 flex-shrink-0">
                    {isCurrentUserOwner && u.role !== 'owner' ? (
                      // Owner can change role - show dropdown
                      <div className="relative">
                        <button
                          onClick={() =>
                            setRoleDropdown(
                              roleDropdown === u.userId ? null : u.userId
                            )
                          }
                          disabled={isChanging}
                          className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {u.role}
                          <ChevronDown size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {roleDropdown === u.userId && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-300 rounded shadow-lg z-10">
                            {['editor', 'viewer'].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(u.userId, role)}
                                disabled={isChanging}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 ${
                                  u.role === role ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                }`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Not owner or is owner - show role as text
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          u.role === 'owner'
                            ? 'bg-yellow-100 text-yellow-800'
                            : u.role === 'editor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {isCurrentUserOwner && users.length > 1 && (
          <div className="px-4 py-2 border-t bg-blue-50 text-blue-700 text-xs">
            You can manage user roles above
          </div>
        )}
      </div>
    </>
  );
}
