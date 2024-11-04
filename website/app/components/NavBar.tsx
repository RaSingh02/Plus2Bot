import React from 'react';
import AnimatedSearchBar from './AnimatedSearchBar';
import HamburgerMenu from './HamburgerMenu';
import { FaUser } from 'react-icons/fa';

interface NavBarProps {
  onUpdateUsername: (username: string) => void;
  onProfileClick: () => void;
  onSearch: (username: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({
  onUpdateUsername,
  onProfileClick,
  onSearch,
}) => {
  return (
    <nav className="bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14">
          {/* Logo Section */}
          <div className="flex items-center">
            <span className="text-[#9147ff] font-bold text-xl">Squeex</span>
            <span className="text-white font-bold text-xl">Plus2</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex items-center ml-8 space-x-1">
            <NavLink isActive>Home</NavLink>
            <NavLink>About</NavLink>
          </div>

          {/* Right Section - Search & Controls */}
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden sm:block w-64">
              <AnimatedSearchBar onSearch={onSearch} alwaysShow={true} />
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={onProfileClick}
                className="p-2 hover:bg-[#2d2d2d] rounded"
              >
                <FaUser size={20} />
              </button>
            </div>
            
            {/* Mobile Menu */}
            <div className="sm:hidden">
              <HamburgerMenu
                onUpdateUsername={onUpdateUsername}
                onProfileClick={onProfileClick}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Helper component for nav links
const NavLink: React.FC<{ children: React.ReactNode; isActive?: boolean }> = ({ children, isActive }) => (
  <button
    className={`px-4 py-2 rounded ${
      isActive 
        ? 'bg-[#9147ff] text-white' 
        : 'text-gray-300 hover:bg-[#2d2d2d]'
    }`}
  >
    {children}
  </button>
);

export default NavBar;