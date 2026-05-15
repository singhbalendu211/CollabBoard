import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as roomService from "../services/roomService";
import RoomCard from "../components/RoomCard";
import {
  PlusIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// A simple, reusable Modal component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // State for modals
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  // State for Rename and Delete actions
  const [isRenameModalOpen, setRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const userRooms = await roomService.getUserRooms();
        setRooms(userRooms);
      } catch (err) {
        setError("Could not fetch your rooms.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const newRoom = await roomService.createRoom(newRoomName);
      navigate(`/room/${newRoom._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    try {
      await roomService.joinRoom(joinRoomId);
      navigate(`/room/${joinRoomId}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const openRenameModal = (room) => {
    setSelectedRoom(room);
    setRenameValue(room.roomName);
    setRenameModalOpen(true);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !renameValue.trim()) return;
    try {
      const updatedRoom = await roomService.renameRoom(
        selectedRoom._id,
        renameValue
      );
      setRooms(
        rooms.map((r) => (r._id === selectedRoom._id ? updatedRoom : r))
      );
      setRenameModalOpen(false);
      setSelectedRoom(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openDeleteModal = (room) => {
    setSelectedRoom(room);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRoom) return;
    try {
      await roomService.deleteRoom(selectedRoom._id);
      setRooms(rooms.filter((r) => r._id !== selectedRoom._id));
      setDeleteModalOpen(false);
      setSelectedRoom(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.roomName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [rooms, searchTerm]
  );

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Rooms</h1>
          <p className="mt-2 text-gray-600">
            Create or join rooms to collaborate in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" /> Create
          </button>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            <UserPlusIcon className="h-4 w-4" /> Join
          </button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-600">Loading...</p>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onRename={openRenameModal}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-600">No rooms found.</p>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create a new room"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="roomName"
              className="block text-sm font-medium text-gray-900"
            >
              Room name
            </label>
            <input
              id="roomName"
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g., Q4 Planning"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Join an Existing Room"
      >
        <form onSubmit={handleJoinSubmit}>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700"
          >
            Room ID
          </label>
          <input
            id="roomId"
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Paste Room ID here"
            className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-slate-200 rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Join Room
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Room"
      >
        <form onSubmit={handleRenameSubmit}>
          <label
            htmlFor="renameRoomName"
            className="block text-sm font-medium text-gray-700"
          >
            New Room Name
          </label>
          <input
            id="renameRoomName"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="mt-1 w-full rounded-lg border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRenameModalOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-slate-200 rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <p>
          Are you sure you want to delete the room "
          <strong>{selectedRoom?.roomName}</strong>"? This action cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 text-sm font-medium bg-slate-200 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete Room
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Rooms;
