import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UsersIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const RoomHeader = ({ room, toggleChat, onRenameRoom, onLeaveRoom, onDeleteRoom }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(room?.roomName || '');
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Sync room name on prop change
  useEffect(() => {
    setRoomNameInput(room?.roomName || '');
  }, [room]);

  const handleRename = () => {
    if (roomNameInput.trim() && roomNameInput !== room.roomName) {
      onRenameRoom(roomNameInput);
    }
    setIsEditingName(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-white border-b border-slate-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Navigation & Room Name */}
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Back to Dashboard">
            <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="text-lg font-semibold text-slate-800 bg-slate-100 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button onClick={handleRename} className="p-2 rounded-md hover:bg-slate-100">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h1 className="text-lg font-semibold text-slate-800">{room?.roomName || 'Untitled Room'}</h1>
              <PencilIcon className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Collaboration Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Participant Avatars */}
          <div className="flex -space-x-2">
            {room?.participants?.slice(0, 3).map((p, index) => (
              <img
                key={index}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                src={`https://i.pravatar.cc/32?u=${p.email}`}
                alt={p.email}
                title={p.email}
              />
            ))}
            {room?.participants?.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-xs font-semibold">
                +{room.participants.length - 3}
              </div>
            )}
          </div>

          <button onClick={handleCopyToClipboard} className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-all">
            <ShareIcon className="h-4 w-4" />
            <span>Share</span>
          </button>

          <button onClick={toggleChat} className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Toggle Chat">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-600" />
          </button>

          {/* Menu */}
         <div className="relative">
          <button onClick={() => setMoreMenuOpen(!isMoreMenuOpen)} className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="More options">
            <EllipsisVerticalIcon className="h-5 w-5 text-slate-600" />
          </button>
          {isMoreMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
              <button onClick={onLeaveRoom} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Leave Room</button>
              <button onClick={onDeleteRoom} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete Room</button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
};

export default RoomHeader;