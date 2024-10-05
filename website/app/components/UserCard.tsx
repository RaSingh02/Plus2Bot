import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface UserCardProps {
  username: string;
  positiveCount: number;
  negativeCount: number;
  lastUpdated: string;
  isDarkMode: boolean;
  onClose: () => void;
  enableTuah: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  username, 
  positiveCount, 
  negativeCount, 
  lastUpdated, 
  isDarkMode, 
  onClose,
  enableTuah,
}) => {
  const cardColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-300';

  const positiveLabel = enableTuah ? '+2/+tuah received:' : '+2 received:';
  const negativeLabel = enableTuah ? '-2/-tuah received:' : '-2 received:';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${cardColor} ${textColor} rounded-lg p-6 shadow-lg w-full max-w-xl mx-auto border ${borderColor} relative mb-4`}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close"
      >
        <FaTimes />
      </button>
      <h3 className="text-2xl font-bold mb-4 text-center">{username}</h3>
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{positiveLabel}</span>
          <span className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {positiveCount}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{negativeLabel}</span>
          <span className={`text-xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {negativeCount}
          </span>
        </div>
      </div>
      <p className={`text-sm ${textColor} text-center`}>
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </p>
    </motion.div>
  );
};

export default UserCard;