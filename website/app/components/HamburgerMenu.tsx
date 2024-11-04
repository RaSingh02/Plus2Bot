import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaTimes, FaUser, FaUserEdit } from 'react-icons/fa';
import UpdateUsernameModal from './UpdateUsernameModal';

interface HamburgerMenuProps {
  onUpdateUsername: (newUsername: string) => void;
  onProfileClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onUpdateUsername,
  onProfileClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpdateUsernameModal, setShowUpdateUsernameModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-full bg-[#9147ff] text-white hover:opacity-80 transition-opacity duration-200"
        aria-label="Menu"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-md shadow-lg z-10">
          <div className="p-2">
            <button
              onClick={onProfileClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d2d2d] flex items-center"
            >
              <FaUser className="mr-2" />
              Profile
            </button>
            <button
              onClick={() => {
                setShowUpdateUsernameModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d2d2d] flex items-center"
            >
              <FaUserEdit className="mr-2" />
              Update Username
            </button>
          </div>
        </div>
      )}
      {showUpdateUsernameModal && (
        <UpdateUsernameModal
          onClose={() => setShowUpdateUsernameModal(false)}
          onUpdateUsername={(newUsername) => {
            onUpdateUsername(newUsername);
            setShowUpdateUsernameModal(false);
          }}
        />
      )}
    </div>
  );
};

export default HamburgerMenu;