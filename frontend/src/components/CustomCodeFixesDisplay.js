import React, { useState } from 'react';
import styled from 'styled-components';

const FixesContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const FixesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const HeaderTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 8px;
  width: fit-content;
`;

const FilterTab = styled.button`
  background: ${props => props.active ? 'white' : 'transparent'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.active ? '#1f2937' : '#6b7280'};
  transition: all 0.2s ease;
  
  &:hover {
    color: #1f2937;
  }
`;

const FixesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FixCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FixHeader = styled.div`
  padding: 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FixIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.background || '#6366f1'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FixTitleSection = styled.div`
  flex: 1;
`;

const FixTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const FixDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

const FrameworkBadge = styled.div`
  background: ${props => props.background || '#6366f1'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
`;

const FixContent = styled.div`
  padding: 1.5rem;
`;

const CodeBlock = styled.div`
  background: #1f2937;
  color: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  position: relative;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #374151;
`;

const CodeLanguage = styled.span`
  background: #374151;
  color: #d1d5db;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const CopyButton = styled.button`
  background: #374151;
  color: #d1d5db;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #4b5563;
    color: white;
  }
`;

const CodeContent = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const FixMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  color: #9ca3af;
`;

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const ReactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
    <path d="M12 1v6m0 6v6"></path>
    <path d="m15.5 3.5-3 3-3-3"></path>
    <path d="m15.5 20.5-3-3-3 3"></path>
    <path d="M1 12h6m6 0h6"></path>
    <path d="m3.5 8.5 3 3-3 3"></path>
  </svg>
);

const HtmlIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l1.09 3.26L16 3.27l-1.27 3.73L18 9.27l-4 1.73L18 14.73l-3.27-1.27L13.09 17L12 14.73L10.91 17l1.36-3.54L9 14.73l4-1.73L9 9.27l3.27-1.27L10.91 3.26L12 2z"></path>
  </svg>
);

const CssIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3h18l-1.5 17L12 22.5 4.5 20L3 3z"></path>
    <path d="M8 8h8v2H8z"></path>
    <path d="M8 12h8v2H8z"></path>
    <path d="M8 16h8v2H8z"></path>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CustomCodeFixesDisplay = ({ customCodeFixes }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  if (!customCodeFixes || customCodeFixes.length === 0) {
    return (
      <FixesContainer>
        <FixesHeader>
          <HeaderIcon>
            <CodeIcon />
          </HeaderIcon>
          <div>
            <HeaderTitle>Custom Code Fixes</HeaderTitle>
            <HeaderSubtitle>Framework-specific solutions and code examples</HeaderSubtitle>
          </div>
        </FixesHeader>
        
        <EmptyState>
          <EmptyStateIcon>
            <CodeIcon />
          </EmptyStateIcon>
          <h3>No Custom Code Fixes Available</h3>
          <p>Custom code fixes will appear here based on your website's detected technology stack.</p>
        </EmptyState>
      </FixesContainer>
    );
  }

  const getFrameworkIcon = (framework) => {
    switch (framework) {
      case 'react': return <ReactIcon />;
      case 'html': return <HtmlIcon />;
      case 'css': return <CssIcon />;
      default: return <CodeIcon />;
    }
  };

  const getFrameworkColor = (framework) => {
    switch (framework) {
      case 'react': return '#61dafb';
      case 'vue': return '#4fc08d';
      case 'angular': return '#dd0031';
      case 'wordpress': return '#21759b';
      case 'html': return '#e34c26';
      case 'css': return '#1572b6';
      case 'javascript': return '#f7df1e';
      case 'php': return '#777bb4';
      default: return '#6366f1';
    }
  };

  const frameworks = [...new Set(customCodeFixes.map(fix => fix.framework))];
  const filters = ['all', ...frameworks];

  const filteredFixes = activeFilter === 'all' 
    ? customCodeFixes 
    : customCodeFixes.filter(fix => fix.framework === activeFilter);

  const copyToClipboard = async (code, fixId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(fixId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <FixesContainer>
      <FixesHeader>
        <HeaderIcon>
          <CodeIcon />
        </HeaderIcon>
        <div>
          <HeaderTitle>Custom Code Fixes</HeaderTitle>
          <HeaderSubtitle>Framework-specific solutions tailored to your tech stack</HeaderSubtitle>
        </div>
      </FixesHeader>

      <FilterTabs>
        {filters.map(filter => (
          <FilterTab 
            key={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </FilterTab>
        ))}
      </FilterTabs>

      <FixesList>
        {filteredFixes.map((fix, index) => (
          <FixCard key={index}>
            <FixHeader>
              <FixIcon background={getFrameworkColor(fix.framework)}>
                {getFrameworkIcon(fix.framework)}
              </FixIcon>
              
              <FixTitleSection>
                <FixTitle>{fix.title}</FixTitle>
                <FixDescription>{fix.description}</FixDescription>
              </FixTitleSection>
              
              <FrameworkBadge background={getFrameworkColor(fix.framework)}>
                {fix.framework}
              </FrameworkBadge>
            </FixHeader>

            <FixContent>
              <CodeBlock>
                <CodeHeader>
                  <CodeLanguage>{fix.language}</CodeLanguage>
                  <CopyButton 
                    onClick={() => copyToClipboard(fix.code, fix.id)}
                  >
                    <CopyIcon />
                    {copiedCode === fix.id ? 'Copied!' : 'Copy'}
                  </CopyButton>
                </CodeHeader>
                
                <CodeContent>{fix.code}</CodeContent>
              </CodeBlock>
              
              <FixMeta>
                <MetaItem>
                  <strong>Framework:</strong> {fix.framework}
                </MetaItem>
                <MetaItem>
                  <strong>Language:</strong> {fix.language}
                </MetaItem>
                <MetaItem>
                  <strong>Type:</strong> {fix.type || 'Component'}
                </MetaItem>
              </FixMeta>
            </FixContent>
          </FixCard>
        ))}
      </FixesList>
    </FixesContainer>
  );
};

export default CustomCodeFixesDisplay;