import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface UserCardProps {
  username: string;
  positiveCount: number;
  negativeCount: number;
  lastUpdated: string;
  onClose: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  username, 
  positiveCount, 
  negativeCount, 
  lastUpdated, 
  onClose,
}) => {
  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-semibold text-[#9147ff]">{username}</div>
          <div className="text-gray-300 text-sm">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-[#9147ff]"
        >
          <FaTimes size={20} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-[#2d2d2d] p-4 rounded">
          <div className="text-sm text-gray-300">Positive Count</div>
          <div className="text-2xl font-bold text-green-400">{positiveCount}</div>
        </div>
        <div className="bg-[#2d2d2d] p-4 rounded">
          <div className="text-sm text-gray-300">Negative Count</div>
          <div className="text-2xl font-bold text-red-400">{negativeCount}</div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;