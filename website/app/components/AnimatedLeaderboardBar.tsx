import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface AnimatedLeaderboardBarProps {
  username: string;
  count: number;
  maxCount: number;
  index: number;
}

const AnimatedLeaderboardBar: React.FC<AnimatedLeaderboardBarProps> = ({ username, count, maxCount, index }) => {
  const controls = useAnimation();

  useEffect(() => {
    const percentage = Math.abs(count) / maxCount * 100;
    controls.start({ width: `${percentage}%` });
  }, [count, maxCount, controls]);

  const barColor = 'bg-blue-500 dark:bg-blue-600';
  const textColor = 'text-gray-800 dark:text-gray-200';

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className={`text-sm font-medium ${textColor}`}>{username}</span>
        <span className={`text-sm font-medium ${textColor}`}>{count}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <motion.div 
          className={`h-2.5 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={controls}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      </div>
    </div>
  );
};

export default AnimatedLeaderboardBar;