import React, { useState, useRef, useEffect } from 'react';
import { FaCog, FaUser } from 'react-icons/fa';
import ColorModeToggle from './ColorModeToggle';
import UpdateUsernameModal from './UpdateUsernameModal';

interface SettingsProps {
  isDarkMode: boolean;
  toggleColorMode: () => void;
  onUpdateUsername: (newUsername: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ isDarkMode, toggleColorMode, onUpdateUsername }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpdateUsernameModal, setShowUpdateUsernameModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const toggleSettings = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={settingsRef}>
      <button
        onClick={toggleSettings}
        className="p-2 rounded-full bg-primary-light dark:bg-primary-dark text-white hover:opacity-80 transition-opacity duration-200"
        aria-label="Settings"
      >
        <FaCog size={20} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
              <ColorModeToggle isDarkMode={isDarkMode} toggleColorMode={toggleColorMode} />
            </div>
            <button
              onClick={() => {
                setShowUpdateUsernameModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <FaUser className="mr-2" />
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
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default Settings;