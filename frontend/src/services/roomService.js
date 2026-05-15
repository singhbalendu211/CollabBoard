import api from './api';

/**
 * Fetches all rooms the current user is a part of.
 */
export const getUserRooms = async () => {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};


/**
 * Creates a new room with the given name.
 * @param {string} roomName - The name for the new room.
 */
export const createRoom = async (roomName) => {
  try {
    const response = await api.post('/rooms', { roomName });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create room');
  }
};


/**
 * Adds the current user to an existing room.
 * @param {string} roomId - The ID of the room to join.
 */
export const joinRoom = async (roomId) => {
  try {
    const response = await api.put(`/rooms/${roomId}/join`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to join room');
  }
};



export const renameRoom = async (roomId, newRoomName) => {
  try {
    const response = await api.put(`/rooms/${roomId}`, { newRoomName });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to rename room');
  }
};


export const deleteRoom = async (roomId) => {
  try {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete room');
  }
};

export const leaveRoom = async (roomId) => {
  try {
    const response = await api.put(`/rooms/${roomId}/leave`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to leave room');
  }
};

/**
 * Gets the list of users in a room with their roles
 * @param {string} roomId - The ID of the room
 */
export const getRoomUsers = async (roomId) => {
  try {
    const response = await api.get(`/rooms/${roomId}/users`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch room users');
  }
};