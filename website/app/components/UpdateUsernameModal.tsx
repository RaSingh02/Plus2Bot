import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface UpdateUsernameModalProps {
  onClose: () => void;
  onUpdateUsername: (newUsername: string) => void;
  isDarkMode: boolean;
}

const UpdateUsernameModal: React.FC<UpdateUsernameModalProps> = ({ onClose, onUpdateUsername, isDarkMode }) => {
  const [newUsername, setNewUsername] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      onUpdateUsername(newUsername.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-0"
    >
      <motion.div
        ref={modalRef}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-lg p-6 w-full max-w-md mx-2 sm:mx-0`}
      >
        <h2 className="text-2xl font-bold mb-4">Update Twitch Username</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            className={`w-full px-3 py-2 border rounded-md ${
              isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
            } mb-4`}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Update
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateUsernameModal;