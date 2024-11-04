import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface AnimatedSearchBarProps {
  onSearch: (username: string) => void;
  alwaysShow?: boolean;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({ onSearch, alwaysShow = false }) => {
  const [isOpen, setIsOpen] = useState(alwaysShow);
  const [searchUsername, setSearchUsername] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alwaysShow) {
      setIsOpen(true);
    }
  }, [alwaysShow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      onSearch(searchUsername.trim());
      setSearchUsername('');
      if (!alwaysShow) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={searchBarRef} className="relative flex items-center w-full">
      <form onSubmit={handleSubmit} className="w-full flex">
        <input
          ref={inputRef}
          type="text"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder="Enter Twitch username"
          className="w-full h-10 bg-[#1a1a1a] text-gray-300 px-4 py-2 focus:outline-none rounded-l border border-gray-700 focus:border-[#9147ff]"
        />
        <button
          type="submit"
          className="bg-[#9147ff] text-white px-4 rounded-r hover:opacity-90 transition-all duration-300"
          aria-label="Search"
        >
          <FaSearch size={16} />
        </button>
      </form>
    </div>
  );
};

export default AnimatedSearchBar;