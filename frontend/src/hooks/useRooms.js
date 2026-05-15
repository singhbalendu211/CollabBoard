import { useState, useEffect } from 'react';
import * as roomService from '../services/roomService';
import { useNavigate } from 'react-router-dom';

export const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const userRooms = await roomService.getUserRooms();
        setRooms(userRooms);
      } catch (err) {
        setError('Could not fetch rooms.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const createRoom = async (roomName) => {
    try {
      const newRoom = await roomService.createRoom(roomName);
      setRooms(prev => [newRoom, ...prev]);
      navigate(`/room/${newRoom._id}`);
    } catch (err) {
      alert(err.message); // Or handle with a proper notification
    }
  };
  
  const deleteRoom = async (roomId) => {
    try {
      await roomService.deleteRoom(roomId);
      setRooms(prev => prev.filter(r => r._id !== roomId));
    } catch(err) {
      alert(err.message);
    }
  };

  // Add renameRoom, joinRoom logic here as well...

  return { rooms, loading, error, createRoom, deleteRoom };
};