import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  if (!pagination) return null;

  const { currentPage, totalPages, totalRecords, limit } = pagination;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pg-pagination-wrapper">
      <div className="pg-pagination-info">
        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} entries
      </div>
      
      <div className="pg-pagination-controls">
        <select 
          className="pg-select pg-pagination-limit"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>

        <div className="pg-pagination-buttons">
          <button 
            className="pg-btn pg-btn-secondary pg-btn-sm" 
            onClick={handlePrev} 
            disabled={currentPage === 1 || totalPages === 0}
          >
            <FiChevronLeft /> Prev
          </button>
          
          <span className="pg-pagination-current">
            Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
          </span>
          
          <button 
            className="pg-btn pg-btn-secondary pg-btn-sm" 
            onClick={handleNext} 
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
