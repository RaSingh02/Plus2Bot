import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface AnimatedSearchBarProps {
  onSearch: (username: string) => void;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      onSearch(searchUsername.trim());
      setSearchUsername('');
      setIsOpen(false);
    }
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={searchBarRef} className="relative flex items-center">
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="mr-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter Twitch username"
              className="w-full h-10 bg-white text-gray-800 px-4 py-2 focus:outline-none rounded-full border border-gray-300 focus:border-blue-500"
            />
          </motion.form>
        )}
      </AnimatePresence>
      <button
        onClick={handleButtonClick}
        className="bg-secondary-light dark:bg-secondary-dark text-text-dark dark:text-text-light p-3 rounded-full focus:outline-none hover:opacity-80 transition-all duration-300"
        aria-label={isOpen ? "Close search" : "Open search"}
      >
        {isOpen ? <FaTimes size={16} /> : <FaSearch size={16} />}
      </button>
    </div>
  );
};

export default AnimatedSearchBar;