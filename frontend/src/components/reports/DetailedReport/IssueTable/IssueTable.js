import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
import IssueRow from './IssueRow';
import IssueFilters from './IssueFilters';
import TablePagination from './TablePagination';

const TableContainer = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border-primary);
`;

const TableTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
  margin: 0;
`;

const TableControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const SearchInput = styled.input`
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const FilterToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-interactive-secondary);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    background: var(--color-interactive-secondary-hover);
  }
  
  &.active {
    background: var(--color-interactive-primary);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family-secondary);
`;

const TableHead = styled.thead`
  background: var(--color-surface-tertiary);
  border-bottom: 2px solid var(--color-border-primary);
`;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-secondary);
  }
`;

const TableHeaderCell = styled.th`
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background: var(--color-surface-tertiary);
  cursor: ${props => props.$sortable ? 'pointer' : 'default'};
  user-select: none;
  transition: var(--transition-fast);
  
  &:hover {
    background: ${props => props.$sortable ? 'var(--color-surface-secondary)' : 'var(--color-surface-tertiary)'};
  }
  
  &.sortable {
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      right: var(--spacing-md);
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      opacity: 0.5;
    }
  }
`;

const SortIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
`;

const TableBody = styled.tbody``;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  color: var(--color-text-secondary);
  
  h4 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-md);
    color: var(--color-text-primary);
  }
  
  p {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
  }
`;

const IssueTable = ({ issues, onIssueToggle, expandedIssues }) => {
  const [sortField, setSortField] = useState('severity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    severity: [],
    category: [],
    wcagLevel: [],
    disabilityGroup: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting logic
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for different field types
      if (sortField === 'severity') {
        const severityOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
        aValue = severityOrder[a.severity] || 0;
        bValue = severityOrder[b.severity] || 0;
      } else if (sortField === 'elementCount') {
        aValue = a.elements.length;
        bValue = b.elements.length;
      } else if (sortField === 'wcagLevel') {
        const levelOrder = { 'AAA': 3, 'AA': 2, 'A': 1 };
        aValue = levelOrder[a.wcagLevel] || 0;
        bValue = levelOrder[b.wcagLevel] || 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [issues, sortField, sortDirection]);

  // Filtering logic
  const filteredIssues = useMemo(() => {
    return sortedIssues.filter(issue => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          issue.title.toLowerCase().includes(searchLower) ||
          issue.description.toLowerCase().includes(searchLower) ||
          issue.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(issue.severity)) {
        return false;
      }
      
      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(issue.category)) {
        return false;
      }
      
      // WCAG Level filter
      if (filters.wcagLevel.length > 0 && !filters.wcagLevel.includes(issue.wcagLevel)) {
        return false;
      }
      
      // Disability Group filter
      if (filters.disabilityGroup.length > 0) {
        const hasMatchingGroup = filters.disabilityGroup.some(group => 
          issue.disabilityGroups.includes(group)
        );
        if (!hasMatchingGroup) return false;
      }
      
      return true;
    });
  }, [sortedIssues, searchTerm, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (issues.length === 0) {
    return (
      <TableContainer>
        <EmptyState>
          <h4>No Issues Found</h4>
          <p>Great news! No accessibility issues were detected in your analysis.</p>
        </EmptyState>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>
          Accessibility Issues ({filteredIssues.length} of {issues.length})
        </TableTitle>
        <TableControls>
          <SearchInput
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <FilterToggle 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'active' : ''}
          >
            <FaFilter />
            Filters
          </FilterToggle>
        </TableControls>
      </TableHeader>
      
      {showFilters && (
        <IssueFilters 
          issues={issues}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell 
              $sortable 
              onClick={() => handleSort('title')}
            >
              Issue
              <SortIcon>{getSortIcon('title')}</SortIcon>
            </TableHeaderCell>
            <TableHeaderCell 
              $sortable 
              onClick={() => handleSort('severity')}
            >
              Severity
              <SortIcon>{getSortIcon('severity')}</SortIcon>
            </TableHeaderCell>
            <TableHeaderCell 
              $sortable 
              onClick={() => handleSort('elementCount')}
            >
              Elements
              <SortIcon>{getSortIcon('elementCount')}</SortIcon>
            </TableHeaderCell>
            <TableHeaderCell 
              $sortable 
              onClick={() => handleSort('wcagLevel')}
            >
              WCAG Level
              <SortIcon>{getSortIcon('wcagLevel')}</SortIcon>
            </TableHeaderCell>
            <TableHeaderCell>
              Disability Groups
            </TableHeaderCell>
            <TableHeaderCell>
              Actions
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedIssues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              isExpanded={expandedIssues.includes(issue.id)}
              onToggle={() => onIssueToggle(issue.id)}
            />
          ))}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredIssues.length}
        />
      )}
    </TableContainer>
  );
};

export default IssueTable;