import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isDarkMode: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  isDarkMode,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const buttonClass = `px-3 py-1 rounded ${isDarkMode 
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={buttonClass}
      >
        Previous
      </button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={buttonClass}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;