import React from 'react';

interface UserCardTooltipProps {
  username: string;
  positiveCount: number;
  negativeCount: number;
  lastUpdated: string;
  position: { x: number; y: number };
}

const UserCardTooltip: React.FC<UserCardTooltipProps> = ({
  username,
  positiveCount,
  negativeCount,
  lastUpdated,
  position,
}) => {
  return (
    <div 
      className="fixed z-50 w-64 bg-[#1a1a1a] rounded-lg shadow-lg p-4"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, ${position.y < 200 ? '20px' : '-120%'})`
      }}
    >
      <div className="text-lg font-semibold text-[#9147ff] mb-2">{username}</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-[#2d2d2d] p-2 rounded">
          <div className="text-xs text-gray-400">Positive</div>
          <div className="text-lg font-bold text-green-400">{positiveCount}</div>
        </div>
        <div className="bg-[#2d2d2d] p-2 rounded">
          <div className="text-xs text-gray-400">Negative</div>
          <div className="text-lg font-bold text-red-400">{negativeCount}</div>
        </div>
      </div>
      <div className="text-xs text-gray-400">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </div>
      <div 
        className="absolute w-3 h-3 bg-[#1a1a1a] transform rotate-45"
        style={{
          left: '50%',
          [position.y < 200 ? 'top' : 'bottom']: '-6px',
          transform: `translateX(-50%) ${position.y < 200 ? '' : 'rotate(225deg)'}`
        }}
      />
    </div>
  );
};

export default UserCardTooltip;