import React, { useState } from 'react';
import styled from 'styled-components';
import { FaDesktop, FaMobile, FaTimes, FaExpand } from 'react-icons/fa';

const ScreenshotCardContainer = styled.div`
  margin-top: var(--spacing-xs);
`;

const ScreenshotGrid = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  justify-content: flex-start;
  flex-shrink: 0;
`;

const ScreenshotItem = styled.div`
  position: relative;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
    
    .expand-icon {
      opacity: 1;
    }
  }
`;

const DesktopScreenshot = styled(ScreenshotItem)`
  width: 15vw;
  height: 9.375vw;
  min-width: 180px;
  min-height: 112px;
  max-width: 280px;
  max-height: 175px;
`;

const MobileScreenshot = styled(ScreenshotItem)`
  width: 5.625vw;
  height: 11.25vw;
  min-width: 72px;
  min-height: 144px;
  max-width: 100px;
  max-height: 200px;
`;

const ScreenshotImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ScreenshotOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  opacity: 0.4;
`;

const ExpandIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 2;
  
  svg {
    width: 4px;
    height: 4px;
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
  font-size: var(--font-size-sm);
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
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

const ScreenshotCard = ({ screenshots, className }) => {
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
      <ScreenshotCardContainer className={className}>
        <ScreenshotGrid>
          {desktopScreenshot && (
            <DesktopScreenshot onClick={() => openScreenshotModal(desktopScreenshot)}>
              <ScreenshotImage
                src={getScreenshotUrl(desktopScreenshot)}
                alt="Desktop screenshot"
                loading="lazy"
              />
              <ScreenshotOverlay>
                <FaDesktop />
                Desktop
              </ScreenshotOverlay>
              <ExpandIcon className="expand-icon">
                <FaExpand />
              </ExpandIcon>
            </DesktopScreenshot>
          )}
          
          {mobileScreenshot && (
            <MobileScreenshot onClick={() => openScreenshotModal(mobileScreenshot)}>
              <ScreenshotImage
                src={getScreenshotUrl(mobileScreenshot)}
                alt="Mobile screenshot"
                loading="lazy"
              />
              <ScreenshotOverlay>
                <FaMobile />
                Mobile
              </ScreenshotOverlay>
              <ExpandIcon className="expand-icon">
                <FaExpand />
              </ExpandIcon>
            </MobileScreenshot>
          )}
          
          {!desktopScreenshot && !mobileScreenshot && screenshots.length > 0 && (
            <DesktopScreenshot onClick={() => openScreenshotModal(screenshots[0])}>
              <ScreenshotImage
                src={getScreenshotUrl(screenshots[0])}
                alt="Website screenshot"
                loading="lazy"
              />
              <ScreenshotOverlay>
                <FaDesktop />
                Screenshot
              </ScreenshotOverlay>
              <ExpandIcon className="expand-icon">
                <FaExpand />
              </ExpandIcon>
            </DesktopScreenshot>
          )}
        </ScreenshotGrid>
      </ScreenshotCardContainer>

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

export default ScreenshotCard; 