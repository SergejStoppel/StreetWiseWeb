import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const FiltersContainer = styled.div`
  background: var(--color-surface-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
  padding: var(--spacing-lg) var(--spacing-xl);
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const FilterLabel = styled.label`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
`;

const FilterSelect = styled.select`
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 150px;
  overflow-y: auto;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  
  &:hover {
    background: var(--color-surface-secondary);
  }
  
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
`;

const CategoryItem = styled(CheckboxItem)`
  background: ${props => props.categoryColor || 'transparent'};
  border-left: 3px solid ${props => props.borderColor || 'transparent'};
  
  &:hover {
    background: ${props => props.categoryColor ? `${props.categoryColor}CC` : 'var(--color-surface-secondary)'};
  }
`;

const CategoryIcon = styled.span`
  font-size: var(--font-size-lg);
  margin-right: var(--spacing-xs);
`;

const CategoryLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
`;

const CategoryName = styled.span`
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

const CategoryDescription = styled.span`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1.3;
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
`;

const ActiveFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
`;

const ActiveFilterTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
`;

const RemoveFilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-on-brand);
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-xs);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ClearAllButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-interactive-secondary);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    background: var(--color-interactive-secondary-hover);
  }
`;

const IssueFilters = ({ issues, filters, onFilterChange }) => {
  // Extract unique values for filter options
  const severityOptions = [...new Set(issues.map(issue => issue.severity))];
  const categoryOptions = [...new Set(issues.map(issue => issue.category))];
  const wcagLevelOptions = [...new Set(issues.map(issue => issue.wcagLevel || 'Unknown'))];
  const disabilityGroupOptions = [...new Set(
    issues.flatMap(issue => issue.disabilityGroups || [])
  )];

  const handleFilterChange = (filterType, value, checked) => {
    const newFilters = { ...filters };
    
    if (checked) {
      newFilters[filterType] = [...newFilters[filterType], value];
    } else {
      newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
    }
    
    onFilterChange(newFilters);
  };

  const removeFilter = (filterType, value) => {
    const newFilters = { ...filters };
    newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({
      severity: [],
      category: [],
      wcagLevel: [],
      disabilityGroup: []
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).reduce((count, filterArray) => count + filterArray.length, 0);
  };

  const getActiveFilterTags = () => {
    const tags = [];
    
    Object.entries(filters).forEach(([filterType, values]) => {
      values.forEach(value => {
        tags.push({
          type: filterType,
          value: value,
          label: `${filterType}: ${value}`
        });
      });
    });
    
    return tags;
  };

  return (
    <FiltersContainer>
      <FiltersGrid>
        <FilterGroup>
          <FilterLabel>Severity</FilterLabel>
          <CheckboxGroup>
            {severityOptions.map(severity => (
              <CheckboxItem key={severity}>
                <input
                  type="checkbox"
                  checked={filters.severity && filters.severity.includes(severity)}
                  onChange={(e) => handleFilterChange('severity', severity, e.target.checked)}
                />
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Category</FilterLabel>
          <CheckboxGroup>
            {categoryOptions.map(category => {
              const categoryInfo = getCategoryByKey(category);
              return (
                <CategoryItem 
                  key={category}
                  categoryColor={categoryInfo.color}
                  borderColor={categoryInfo.borderColor}
                >
                  <input
                    type="checkbox"
                    checked={filters.category && filters.category.includes(category)}
                    onChange={(e) => handleFilterChange('category', category, e.target.checked)}
                  />
                  <CategoryIcon>{categoryInfo.icon}</CategoryIcon>
                  <CategoryLabel>
                    <CategoryName>{categoryInfo.label}</CategoryName>
                    <CategoryDescription>{categoryInfo.description}</CategoryDescription>
                  </CategoryLabel>
                </CategoryItem>
              );
            })}
          </CheckboxGroup>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>WCAG Level</FilterLabel>
          <CheckboxGroup>
            {wcagLevelOptions.map(level => (
              <CheckboxItem key={level}>
                <input
                  type="checkbox"
                  checked={filters.wcagLevel && filters.wcagLevel.includes(level)}
                  onChange={(e) => handleFilterChange('wcagLevel', level, e.target.checked)}
                />
                Level {level}
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Disability Groups</FilterLabel>
          <CheckboxGroup>
            {disabilityGroupOptions.map(group => (
              <CheckboxItem key={group}>
                <input
                  type="checkbox"
                  checked={filters.disabilityGroup && filters.disabilityGroup.includes(group)}
                  onChange={(e) => handleFilterChange('disabilityGroup', group, e.target.checked)}
                />
                {group}
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </FilterGroup>
      </FiltersGrid>
      
      <FilterActions>
        <ActiveFilters>
          {getActiveFiltersCount() > 0 && (
            <>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Active filters:
              </span>
              {getActiveFilterTags().map((tag, index) => (
                <ActiveFilterTag key={index}>
                  {tag.label}
                  <RemoveFilterButton onClick={() => removeFilter(tag.type, tag.value)}>
                    <FaTimes />
                  </RemoveFilterButton>
                </ActiveFilterTag>
              ))}
            </>
          )}
        </ActiveFilters>
        
        {getActiveFiltersCount() > 0 && (
          <ClearAllButton onClick={clearAllFilters}>
            Clear All Filters
          </ClearAllButton>
        )}
      </FilterActions>
    </FiltersContainer>
  );
};

export default IssueFilters;