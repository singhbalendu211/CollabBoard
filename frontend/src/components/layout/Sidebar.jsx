import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bars3Icon,
  HomeIcon,
  RectangleStackIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';


const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const navLinkClasses = ({ isActive }) =>
    `flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300'
    }`;

  return (
    <aside
      className={`bg-slate-800 text-slate-100 flex flex-col fixed inset-y-0 left-0 z-40
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        ${!isSidebarOpen && '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="flex items-center h-16 border-b border-slate-700 flex-shrink-0 px-4">
        <button
          onClick={toggleSidebar}
          className="text-slate-300 hover:text-white p-2 rounded-md"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <span
          className={`ml-2 text-lg font-bold whitespace-nowrap transition-opacity duration-300 ${
            !isSidebarOpen && 'opacity-0'
          }`}
        >
         SLATE.IO
        </span>
      </div>

       <nav className={`flex-1 px-2 py-4 space-y-2 overflow-y-auto ${!isSidebarOpen && 'overflow-hidden'}`}>
        <NavLink to="/dashboard" className={navLinkClasses}>
          <HomeIcon className="h-6 w-6 shrink-0" />
          <span className={`ml-4 whitespace-nowrap ${!isSidebarOpen && 'opacity-0'}`}>Home</span>
        </NavLink>
        <NavLink to="/rooms" className={navLinkClasses}>
          <RectangleStackIcon className="h-6 w-6 shrink-0" />
          <span className={`ml-4 whitespace-nowrap ${!isSidebarOpen && 'opacity-0'}`}>Rooms</span>
        </NavLink>

        {/* <NavLink to="/whiteboards" className={navLinkClasses}>
          <PencilSquareIcon className="h-6 w-6 shrink-0" />
          <span className={`ml-4 whitespace-nowrap ${!isSidebarOpen && 'opacity-0'}`}>Whiteboards</span>
        </NavLink> */}
        
        <NavLink to="/chat" className={navLinkClasses}>
          <ChatBubbleLeftRightIcon className="h-6 w-6 shrink-0" />
          <span className={`ml-4 whitespace-nowrap ${!isSidebarOpen && 'opacity-0'}`}>Chat</span>
        </NavLink>
        <NavLink to="/settings" className={navLinkClasses}>
          <Cog6ToothIcon className="h-6 w-6 shrink-0" />
          <span className={`ml-4 whitespace-nowrap ${!isSidebarOpen && 'opacity-0'}`}>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;