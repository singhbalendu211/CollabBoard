import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as roomService from '../services/roomService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const userRooms = await roomService.getUserRooms();
        setRooms(userRooms);
      } catch (err) {
        console.error("Could not fetch rooms for dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const recentRooms = rooms.slice(0, 3);

  return (
    <>
      <h1 className="text-3xl font-semibold text-gray-900">
        Welcome, {user?.email}!
      </h1>
      <p className="mt-2 text-gray-600">Your workspace overview.</p>

      {/* Summary Card */}
      <div className="my-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Rooms</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : rooms.length}</p>
        </div>
      </div>

      {/* Recent Rooms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Rooms</h2>
          <Link to="/rooms" className="text-sm font-medium text-gray-900 hover:underline">
            View All
          </Link>
        </div>
        
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : recentRooms.length > 0 ? (
          <div className="space-y-3">
            {recentRooms.map(room => (
              <Link key={room._id} to={`/room/${room._id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{room.roomName}</p>
                  <span className="text-xs text-gray-600">{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recent rooms yet.</p>
        )}
      </div>
    </>
  );
};

export default Dashboard;