import React from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-surface-secondary);
  border-top: 1px solid var(--color-border-primary);
`;

const PaginationInfo = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-primary);
  background: var(--color-surface-primary);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: var(--font-size-sm);
  
  &:hover:not(:disabled) {
    background: var(--color-interactive-primary);
    color: var(--color-text-on-brand);
    border-color: var(--color-interactive-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.active {
    background: var(--color-interactive-primary);
    color: var(--color-text-on-brand);
    border-color: var(--color-interactive-primary);
  }
`;

const PageNumbers = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
`;

const Ellipsis = styled.span`
  padding: 0 var(--spacing-sm);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
`;

const TablePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  totalItems 
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis if there's a gap
      if (start > 2) {
        pages.push('...');
      }
      
      // Add pages around current page
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      // Add ellipsis if there's a gap
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <PaginationContainer>
      <PaginationInfo>
        Showing {startItem} to {endItem} of {totalItems} results
      </PaginationInfo>
      
      <PaginationControls>
        <PaginationButton
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <FaAngleDoubleLeft />
        </PaginationButton>
        
        <PaginationButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <FaChevronLeft />
        </PaginationButton>
        
        <PageNumbers>
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <Ellipsis key={index}>...</Ellipsis>
            ) : (
              <PaginationButton
                key={page}
                onClick={() => handlePageChange(page)}
                className={page === currentPage ? 'active' : ''}
              >
                {page}
              </PaginationButton>
            )
          ))}
        </PageNumbers>
        
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <FaChevronRight />
        </PaginationButton>
        
        <PaginationButton
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <FaAngleDoubleRight />
        </PaginationButton>
      </PaginationControls>
    </PaginationContainer>
  );
};

export default TablePagination;