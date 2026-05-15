import React from 'react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRoomImage } from '../hooks/useRoomImage';

/**
 * RoomCard Component
 * Displays a room as a square grid card with dynamic image
 */
const RoomCard = ({ 
  room, 
  onRename, 
  onDelete 
}) => {
  const { imageUrl, isLoading } = useRoomImage(room._id, room.roomName);

  const handleRenameClick = (e) => {
    e.preventDefault();
    onRename(room);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    onDelete(room);
  };

  return (
    <Link
      to={`/room/${room._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200"
    >
      {/* Image Container - Square aspect ratio */}
      <div className="relative w-full bg-gray-100 pt-[100%] overflow-hidden">
        <img
          src={imageUrl}
          alt={room.roomName}
          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
            <div className="animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-300"></div>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <p className="truncate font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
          {room.roomName}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {room.participants?.length || 0} members
          </p>
          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={handleRenameClick}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
              title="Rename room"
              aria-label="Rename room"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              title="Delete room"
              aria-label="Delete room"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
