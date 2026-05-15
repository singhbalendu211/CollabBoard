import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const ChatBox = ({ socket, roomId, isChatVisible }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef(null);

  // Effect to handle incoming messages from the server
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    };

    socket.on('chat:message', handleNewMessage);

    // Cleanup listener on component unmount
    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket]);

  // Effect to auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && user) {
      const messageData = {
        id: Date.now().toString(), // Simple unique ID
        text: newMessage,
        user: { email: user.email, id: socket.id },
        timestamp: new Date(),
      };
      // Emit the message to the server
      socket.emit('chat:message', { roomId, messageData });
      setNewMessage('');
    }
  };

  return (
    <aside
      className={`transition-all duration-300 ease-in-out bg-white border-l border-slate-200 flex flex-col
        ${isChatVisible ? 'w-80' : 'w-0 opacity-0'}`}
    >
       <div className="flex items-center gap-3 flex-shrink-0 p-4 border-b">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-500" />
        <h3 className="font-semibold text-slate-800">Room Chat</h3>
      </div>
      
      {/* Message History */}
     <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          // Display this placeholder if there are no messages
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <ChatBubbleOvalLeftEllipsisIcon className="h-12 w-12 mb-2" />
            <h4 className="font-semibold text-slate-700">Start the Conversation</h4>
            <p className="text-sm">Messages you send will appear here.</p>
          </div>
        ) : (
          // Display the messages if the array is not empty
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.user?.id === socket.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg py-2 px-3 max-w-xs ${
                    msg.user?.id === socket.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-xs font-bold opacity-80">{msg.user?.id === socket.id ? 'You' : msg.user.email}</p>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>
      
      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-slate-50">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-full border-slate-300 pl-4 pr-12 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </aside>
  );
};

export default ChatBox;