import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import { Bars3Icon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout(); 
      setUser(null);              
      navigate('/');              
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white h-16 flex-shrink-0">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100"
            aria-label="User menu"
          >
            <img
              src={`https://i.pravatar.cc/40?u=${user?.email}`}
              alt="User avatar"
              className="h-8 w-8 rounded-full"
            />
            <span className="hidden sm:inline text-sm font-medium text-gray-900">
              {user?.email}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-md">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(false)}
              >
                <UserCircleIcon className="mr-2 h-5 w-5" />
                <span>Profile</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex w-full items-center text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-t border-gray-200"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;