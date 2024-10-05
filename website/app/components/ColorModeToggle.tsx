import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ColorModeToggleProps {
  isDarkMode: boolean;
  toggleColorMode: () => void;
}

const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ isDarkMode, toggleColorMode }) => {
  return (
    <button
      onClick={toggleColorMode}
      className={`w-14 h-7 flex items-center rounded-full px-1 relative transition-all duration-300 ease-in-out ${
        isDarkMode ? 'bg-blue-600' : 'bg-blue-400'
      } hover:bg-opacity-80 hover:scale-105`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div
        className={`flex items-center justify-center w-5 h-5 z-10 transition-transform duration-300 ${
          isDarkMode ? 'transform translate-x-0' : 'transform translate-x-7'
        }`}
      >
        {isDarkMode ? (
          <FaMoon className="text-white" size={12} />
        ) : (
          <FaSun className="text-white" size={12} />
        )}
      </div>
      <div
        className={`absolute bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
          isDarkMode ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export default ColorModeToggle;