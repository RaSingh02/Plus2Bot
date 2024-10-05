import React from 'react';
import Pagination from './Pagination';

interface LeaderboardTableProps {
  data: Array<[string, number] | { username: string; count: number }>;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isDarkMode: boolean;
  onUsernameClick: (username: string) => void;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  data, 
  currentPage, 
  pageSize, 
  totalItems,
  onPageChange,
  onPageSizeChange,
  isDarkMode,
  onUsernameClick // Add this prop
}) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-800 dark:text-gray-200">
          <thead className="text-xs uppercase bg-gray-200 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 w-1/6">Rank</th>
              <th scope="col" className="px-4 py-3 w-3/6">Username</th>
              <th scope="col" className="px-4 py-3 w-2/6">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => {
              const [username, count] = Array.isArray(entry) ? entry : [entry.username, entry.count];
              const rank = (currentPage - 1) * pageSize + index + 1;

              return (
                <tr key={username} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-4 py-3 font-medium">{rank}</td>
                  <td className="px-4 py-3">
                    {onUsernameClick ? (
                      <button
                        onClick={() => onUsernameClick(username)}
                        className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                      >
                        {username}
                      </button>
                    ) : (
                      <span>{username}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{count}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <td colSpan={3} className="px-4 py-3">
                <div className="flex justify-between items-center">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={onPageChange}
                    isDarkMode={isDarkMode}
                  />
                  <div>
                    <label htmlFor="pageSize" className="mr-2 text-sm">Items per page:</label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => onPageSizeChange(Number(e.target.value))}
                      className="border rounded p-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;