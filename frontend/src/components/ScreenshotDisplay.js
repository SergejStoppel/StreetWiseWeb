import React, { useState } from 'react';
import styled from 'styled-components';
import { FaDesktop, FaMobile, FaTimes, FaExpand } from 'react-icons/fa';

const ScreenshotContainer = styled.div`
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }
`;

const ScreenshotFrame = styled.div`
  position: relative;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: var(--color-surface-primary);
  border: 2px solid var(--color-border-primary);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    
    .expand-icon {
      opacity: 1;
    }
  }
  
  &::before {
    content: '${props => props.label}';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 2;
  }
`;

const DesktopFrame = styled(ScreenshotFrame)`
  width: 320px;
  height: 200px;
  
  @media (max-width: 768px) {
    width: 280px;
    height: 175px;
  }
  
  @media (max-width: 480px) {
    width: 240px;
    height: 150px;
  }
`;

const MobileFrame = styled(ScreenshotFrame)`
  width: 120px;
  height: 240px;
  
  @media (max-width: 768px) {
    width: 100px;
    height: 200px;
  }
  
  @media (max-width: 480px) {
    width: 80px;
    height: 160px;
  }
`;

const ScreenshotImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin-top: 2rem;
`;

const ScreenshotPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-tertiary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-top: 2rem;
  text-align: center;
  padding: var(--spacing-md);
`;

const ExpandIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 3;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ScreenshotModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
`;

const ModalContent = styled.div`
  max-width: 90vw;
  max-height: 90vh;
  position: relative;
  background: var(--color-surface-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border-primary);
`;

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-surface-tertiary);
    color: var(--color-text-primary);
  }
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: calc(90vh - 80px);
  object-fit: contain;
  display: block;
`;

const ScreenshotDisplay = ({ screenshots, className }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    const baseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://iywlcimloohmgjhjptoj.supabase.co';
    return `${baseUrl}/storage/v1/object/public/${screenshot.storage_bucket}/${screenshot.storage_path}`;
  };

  const openScreenshotModal = (screenshot) => {
    setSelectedScreenshot(screenshot);
  };

  const closeScreenshotModal = () => {
    setSelectedScreenshot(null);
  };

  const getScreenshotTypeIcon = (type) => {
    switch (type) {
      case 'desktop': return <FaDesktop />;
      case 'mobile': return <FaMobile />;
      default: return <FaDesktop />;
    }
  };

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const desktopScreenshot = screenshots.find(s => s.type === 'desktop');
  const mobileScreenshot = screenshots.find(s => s.type === 'mobile');

  return (
    <>
      <ScreenshotContainer className={className}>
        {desktopScreenshot && (
          <DesktopFrame 
            label="Desktop" 
            onClick={() => openScreenshotModal(desktopScreenshot)}
          >
            <ScreenshotImage
              src={getScreenshotUrl(desktopScreenshot)}
              alt="Desktop screenshot"
              loading="lazy"
            />
            <ExpandIcon className="expand-icon">
              <FaExpand />
            </ExpandIcon>
          </DesktopFrame>
        )}
        
        {mobileScreenshot && (
          <MobileFrame 
            label="Mobile" 
            onClick={() => openScreenshotModal(mobileScreenshot)}
          >
            <ScreenshotImage
              src={getScreenshotUrl(mobileScreenshot)}
              alt="Mobile screenshot"
              loading="lazy"
            />
            <ExpandIcon className="expand-icon">
              <FaExpand />
            </ExpandIcon>
          </MobileFrame>
        )}
        
        {!desktopScreenshot && !mobileScreenshot && screenshots.length > 0 && (
          <DesktopFrame 
            label="Screenshot" 
            onClick={() => openScreenshotModal(screenshots[0])}
          >
            <ScreenshotImage
              src={getScreenshotUrl(screenshots[0])}
              alt="Website screenshot"
              loading="lazy"
            />
            <ExpandIcon className="expand-icon">
              <FaExpand />
            </ExpandIcon>
          </DesktopFrame>
        )}
      </ScreenshotContainer>

      {selectedScreenshot && (
        <ScreenshotModal onClick={closeScreenshotModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {getScreenshotTypeIcon(selectedScreenshot.type)}
                {selectedScreenshot.type.charAt(0).toUpperCase() + selectedScreenshot.type.slice(1)} Screenshot
              </ModalTitle>
              <ModalClose onClick={closeScreenshotModal}>
                <FaTimes />
              </ModalClose>
            </ModalHeader>
            <ModalImage
              src={getScreenshotUrl(selectedScreenshot)}
              alt={`${selectedScreenshot.type} screenshot`}
            />
          </ModalContent>
        </ScreenshotModal>
      )}
    </>
  );
};

export default ScreenshotDisplay; 