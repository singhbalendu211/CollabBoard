import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { ToolProvider } from '../context/ToolContext';
import * as roomService from '../services/roomService';
import { throttle } from '../utils/whiteboardTools';

import RoomHeader from '../components/whiteboard/RoomHeader'
import ToolsPanel from '../components/whiteboard/ToolsPanel';
import CanvasBoard from '../components/whiteboard/CanvasBoard';
import ChatBox from '../components/whiteboard/ChatBox';
import LiveCursors from '../components/whiteboard/LiveCursors';
import UsersButton from '../components/whiteboard/UsersButton';

const WhiteboardContent = () => {

 const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const navigate = useNavigate(); 

  const { roomId } = useParams();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [userRole, setUserRole] = useState(null); // owner, editor, viewer
  const [roleLoading, setRoleLoading] = useState(true);
  
  // State
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const objects = history[historyIndex];
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [cursors, setCursors] = useState({});
  const [isClearModalOpen, setClearModalOpen] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const throttledCursorEmitterRef = useRef(null);  


  const handleLeaveRoom = async () => {
    try {
      await roomService.leaveRoom(roomId);
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await roomService.deleteRoom(roomId);
      emitEvent('room:deleted');
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  // Fetch user's role in the room
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setRoleLoading(true);
        const users = await roomService.getRoomUsers(roomId);
        const currentUserData = users.find(u => u.email === user?.email);
        if (currentUserData) {
          setUserRole(currentUserData.role);
          setUserCount(users.length);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    if (user && roomId) {
      fetchUserRole();
    }
  }, [user, roomId]);
  
  // Socket setup
  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    setSocket(s);

    throttledCursorEmitterRef.current = throttle((x, y) => {
      s.emit('cursor:move', { roomId, x, y, email: user?.email });
    }, 50);

    const handleConnect = () => {
      console.log('✅ Socket connected:', s.id);
      if (user) s.emit('joinRoom', { roomId, user });
    };

    const handleRoomLoad = (initialObjects) => {
      console.log('📥 Loading room state');
      setHistory([initialObjects || []]);
      setHistoryIndex(0);
    };

    const handleObjectAdd = (newObject) => {
      setHistory(prevHistory => [...prevHistory, [...prevHistory[prevHistory.length - 1], newObject]]);
      setHistoryIndex(prevIndex => prevIndex + 1);
    };

    const handleObjectUpdate = (updatedObject) => {
      setHistory(prevHistory => {
        const lastState = prevHistory[prevHistory.length - 1];
        const newObjects = lastState.map(obj => obj.id === updatedObject.id ? updatedObject : obj);
        return [...prevHistory, newObjects];
      });
      setHistoryIndex(prevIndex => prevIndex + 1);
    };

    const handleObjectDelete = (objectId) => {
      setHistory(prevHistory => {
        const lastState = prevHistory[prevHistory.length - 1];
        const newObjects = lastState.filter(obj => obj.id !== objectId);
        return [...prevHistory, newObjects];
      });
      setHistoryIndex(prevIndex => prevIndex + 1);
    };

    const handleCanvasClear = () => {
      setHistory(prevHistory => [...prevHistory, []]);
      setHistoryIndex(prevHistory => prevHistory + 1);
    };

    const handleCursorsUpdate = (roomCursors) => {
      setCursors(roomCursors);
    };

    const handleRoomDeleted = () => {
      alert('This room has been deleted by the owner.');
      navigate('/dashboard');
    };

    const handleRoomUsersUpdated = (data) => {
      // Update user count when participants change
      if (data.count) {
        setUserCount(data.count);
      }
    };

    // Register socket listeners
    s.on('connect', handleConnect);
    s.on('room:load', handleRoomLoad);
    s.on('object:add', handleObjectAdd);
    s.on('object:update', handleObjectUpdate);
    s.on('object:delete', handleObjectDelete);
    s.on('canvas:clear', handleCanvasClear);
    s.on('cursors:update', handleCursorsUpdate);
    s.on('room:deleted', handleRoomDeleted);
    s.on('room-users-updated', handleRoomUsersUpdated);

    // Save before leaving
    const handleBeforeUnload = (e) => {
      if (objects.length > 0) {
        if (navigator.sendBeacon && import.meta.env.VITE_BACKEND_URL) {
          const data = JSON.stringify({ roomId, objects });
          navigator.sendBeacon(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/${roomId}/save`, data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup listeners
      s.off('connect', handleConnect);
      s.off('room:load', handleRoomLoad);
      s.off('object:add', handleObjectAdd);
      s.off('object:update', handleObjectUpdate);
      s.off('object:delete', handleObjectDelete);
      s.off('canvas:clear', handleCanvasClear);
      s.off('cursors:update', handleCursorsUpdate);
      s.off('room:deleted', handleRoomDeleted);
      s.off('room-users-updated', handleRoomUsersUpdated);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      s.disconnect();
    };
  }, [roomId, user]);


  
  const emitEvent = useCallback((eventName, data) => {
    console.log(`🎨 Emitting: ${eventName}`, data);
    if (socket) socket.emit(eventName, { roomId, data });
  }, [socket, roomId]);

  const updateHistory = (newObjects) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newObjects]);
    setHistoryIndex(newHistory.length);
  };

  const handleUpdateObject = (updatedObject) => {
    const newObjects = objects.map(obj => (obj.id === updatedObject.id ? updatedObject : obj));
    updateHistory(newObjects);
    emitEvent('object:update', updatedObject);
  };

  const deleteSelectedObject = () => {
    if (!selectedObjectId) return;
    const newObjects = objects.filter(obj => obj.id !== selectedObjectId);
    updateHistory(newObjects);
    emitEvent('object:delete', selectedObjectId);
    setSelectedObjectId(null);
  };

  const handleClearCanvas = () => {
    setClearModalOpen(true);
  };

  const handleClearConfirm = () => {
    updateHistory([]);
    emitEvent('canvas:clear', {});
    setClearModalOpen(false);
  };

  // Throttled cursor emit
  const handleMouseMove = (event) => {
    if (throttledCursorEmitterRef.current && user) {
      const { clientX, clientY } = event;
      throttledCursorEmitterRef.current(clientX, clientY);
    }
  };

  const handleAddObject = (newObject) => {
    const objectWithId = {
      ...newObject,
      userId: user?._id || 'anonymous',
      timestamp: Date.now()
    };
    const newObjects = [...objects, objectWithId];
    updateHistory(newObjects);
    emitEvent('object:add', objectWithId);
  };

  const handleDeleteObject = (idsToDelete) => {
    let newObjects;
    if (Array.isArray(idsToDelete)) {
      newObjects = objects.filter(obj => !idsToDelete.includes(obj.id));
    } else {
      newObjects = objects.filter(obj => obj.id !== idsToDelete);
    }
    updateHistory(newObjects);
    emitEvent('object:delete', idsToDelete);
  };

  const handleLeaveRoomConfirm = async () => {
    try {
      await roomService.leaveRoom(roomId);
      navigate('/dashboard');
      setLeaveModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteRoomConfirm = async () => {
    try {
      await roomService.deleteRoom(roomId);
      emitEvent('room:deleted');
      navigate('/dashboard');
      setDeleteModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      socket.emit('undo', { roomId });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      socket.emit('redo', { roomId });
    }
  };

  // Auto-save drawings
  const handleAutoSave = useCallback((currentObjects) => {
    if (socket) {
      console.log('💾 Auto-saving drawings');
      socket.emit('canvas:save', { roomId, objects: currentObjects });
    }
  }, [socket, roomId]);

  // Save on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📌 Page hidden - saving');
        handleAutoSave(objects);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [objects, handleAutoSave]);

  return (
    <ToolProvider>
      <div className="h-screen w-screen overflow-hidden bg-slate-100" onMouseMove={handleMouseMove}>
      <RoomHeader room={{ roomName: `Room ${roomId.substring(0,6)}` }}
       toggleChat={() => setIsChatVisible(!isChatVisible)}
       
        onLeaveRoom={() => setLeaveModalOpen(true)}   
        onDeleteRoom={() => setDeleteModalOpen(true)}
       />
      <div className="h-full w-full flex">
        <main className="flex-1 relative pt-16">
          {/* Only show toolbar and allow drawing for owner and editor */}
          {userRole !== 'viewer' && (
            <ToolsPanel 
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClearCanvas={() => setClearModalOpen(true)}
            />
          )}
          {/* Show viewer-only notice if viewer */}
          {userRole === 'viewer' && (
            <div className="absolute top-20 left-4 z-10 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              👁️ View-only mode: Chat only
            </div>
          )}
          <CanvasBoard
            objects={objects}
            onAddObject={handleAddObject}
            onUpdateObject={handleUpdateObject}
            selectedObjectId={selectedObjectId}
            setSelectedObjectId={setSelectedObjectId}
            onDeleteObject={handleDeleteObject}
            onAutoSave={handleAutoSave}
            userRole={userRole}
          />
          <LiveCursors cursors={cursors} selfId={socket?.id} />
        </main>
        <ChatBox   socket={socket} roomId={roomId} isChatVisible={isChatVisible} />
         {isClearModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900">Clear Canvas</h3>
        <p className="text-slate-600 mt-2">Are you sure you want to clear the entire whiteboard for everyone? This action can be undone.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => setClearModalOpen(false)} className="px-4 py-2 font-medium bg-slate-200 rounded-lg hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleClearConfirm} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  )}
      </div>

          {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold">Leave Room</h3>
            <p className="text-slate-600 mt-2">Are you sure you want to leave this room?</p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={() => setLeaveModalOpen(false)} className="px-4 py-2 font-medium bg-slate-200 rounded-lg">Cancel</button>
              <button onClick={handleLeaveRoomConfirm} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg">Leave</button>
            </div>
          </div>
        </div>
      )}

     {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            <p className="text-slate-600 mt-2">
              Are you sure you want to permanently delete this room? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 font-medium bg-slate-200 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoomConfirm}
                className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
    {/* Users Button */}
    <UsersButton roomId={roomId} userCount={userCount} onUserCountChange={setUserCount} />
    </ToolProvider>
  );
};

export default WhiteboardContent;