import React, { useState } from 'react';
import Pagination from './Pagination';
import UserCardTooltip from './UserCardTooltip';

interface LeaderboardTableProps {
  data: [string, number][];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onUsernameClick?: (username: string) => void;
  onUserHover?: (username: string) => Promise<{
    positiveCount: number;
    negativeCount: number;
    lastUpdated: string;
  }>;
}

const getBackgroundStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0) 100%)';
    case 2:
      return 'linear-gradient(90deg, rgba(192, 192, 192, 0.2) 0%, rgba(192, 192, 192, 0) 100%)';
    case 3:
      return 'linear-gradient(90deg, rgba(205, 127, 50, 0.2) 0%, rgba(205, 127, 50, 0) 100%)';
    default:
      return 'rgba(45, 45, 45, 0.4)';
  }
};

const getUsernameColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'text-[#FFD700] hover:text-[#B29700]'; // Gold
    case 2:
      return 'text-[#C0C0C0] hover:text-[#868686]'; // Silver
    case 3:
      return 'text-[#CD7F32] hover:text-[#8B5522]'; // Bronze
    default:
      return 'text-[#9147ff] hover:text-[#a970ff]';
  }
};

const getBoxShadowStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return '0 4px 6px -1px rgba(255, 215, 0, 0.2), 0 2px 4px -1px rgba(255, 215, 0, 0.1)';
    case 2:
      return '0 4px 6px -1px rgba(192, 192, 192, 0.2), 0 2px 4px -1px rgba(192, 192, 192, 0.1)';
    case 3:
      return '0 4px 6px -1px rgba(205, 127, 50, 0.2), 0 2px 4px -1px rgba(205, 127, 50, 0.1)';
    default:
      return '0 2px 4px -1px rgba(145, 71, 255, 0.1), 0 1px 2px -1px rgba(145, 71, 255, 0.05)';
  }
};

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  data,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onUsernameClick,
  onUserHover
}) => {
  const [tooltipData, setTooltipData] = useState<{
    username: string;
    data: { positiveCount: number; negativeCount: number; lastUpdated: string };
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-gray-300 text-center">No data available</div>;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-2">
        {data.map((entry, index) => {
          const [username, count] = Array.isArray(entry) ? entry : [entry.username as username, entry.count];
          const rank = (currentPage - 1) * pageSize + index + 1;

          return (
            <div 
              key={username}
              className={`p-4 rounded-lg bg-opacity-10 transition-all duration-200 transform hover:-translate-y-0.5 ${
                rank <= 3 
                  ? 'hover:shadow-lg border border-opacity-20' 
                  : 'hover:shadow-md border border-opacity-10'
              }`}
              style={{
                background: getBackgroundStyle(rank),
                boxShadow: getBoxShadowStyle(rank),
                borderColor: rank <= 3 
                  ? rank === 1 
                    ? '#FFD700'
                    : rank === 2 
                      ? '#C0C0C0' 
                      : '#CD7F32'
                  : '#9147ff'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-bold text-white w-8">{rank}</span>
                  <button
                    onClick={() => onUsernameClick?.(username)}
                    onMouseEnter={async (e) => {
                      if (onUserHover) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const data = await onUserHover(username);
                        setTooltipData({ username, data });
                        setTooltipPosition({
                          x: rect.left + (rect.width / 2),
                          y: rect.top + window.scrollY
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipData(null);
                      setTooltipPosition(null);
                    }}
                    className={`${getUsernameColor(rank)} text-lg font-medium hover:underline focus:outline-none`}
                  >
                    {username}
                  </button>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-white">Score: {Math.abs(count)}</span>
                  <span className="text-sm text-[#9147ff]">Time Spent: {/* Add time spent logic here */}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tooltipData && tooltipPosition && (
        <UserCardTooltip
          username={tooltipData.username}
          positiveCount={tooltipData.data.positiveCount}
          negativeCount={tooltipData.data.negativeCount}
          lastUpdated={tooltipData.data.lastUpdated}
          position={tooltipPosition}
        />
      )}

      <div className="mt-4 flex justify-between items-center w-full max-w-4xl">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-gray-800 text-gray-300 border border-gray-600 rounded p-2"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default LeaderboardTable;