import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface UpdateUsernameModalProps {
  onClose: () => void;
  onUpdateUsername: (newUsername: string) => void;
}

const UpdateUsernameModal: React.FC<UpdateUsernameModalProps> = ({ onClose, onUpdateUsername }) => {
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
        className="bg-[#1a1a1a] text-gray-300 rounded-lg p-6 w-full max-w-md mx-2 sm:mx-0"
      >
        <h2 className="text-2xl font-bold mb-4">Update Twitch Username</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            className="w-full px-3 py-2 border rounded-md bg-[#2d2d2d] text-gray-300 border-gray-700 mb-4 focus:border-[#9147ff] focus:outline-none"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2d2d2d] text-gray-300 rounded-md hover:bg-[#3d3d3d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#9147ff] text-white rounded-md hover:opacity-90"
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