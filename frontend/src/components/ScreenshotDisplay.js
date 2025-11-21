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
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-secondary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    
    .expand-icon {
      opacity: 1;
    }
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
  object-fit: contain;
  display: block;
  margin: 0;
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
  margin: 0;
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

    // Use signed URL from backend (required for private bucket access)
    if (!screenshot.signed_url) {
      console.error('Screenshot missing signed_url from backend');
      return null;
    }

    return screenshot.signed_url;
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

  // Get URLs upfront - only show screenshots with valid signed URLs
  const desktopUrl = desktopScreenshot ? getScreenshotUrl(desktopScreenshot) : null;
  const mobileUrl = mobileScreenshot ? getScreenshotUrl(mobileScreenshot) : null;
  const fallbackScreenshot = !desktopScreenshot && !mobileScreenshot && screenshots.length > 0 ? screenshots[0] : null;
  const fallbackUrl = fallbackScreenshot ? getScreenshotUrl(fallbackScreenshot) : null;

  // If no valid URLs available, don't render anything
  if (!desktopUrl && !mobileUrl && !fallbackUrl) {
    return null;
  }

  return (
    <>
      <ScreenshotContainer className={className}>
        {desktopUrl && (
          <DesktopFrame
            label="Desktop"
            onClick={() => openScreenshotModal(desktopScreenshot)}
          >
            <ScreenshotImage
              src={desktopUrl}
              alt="Desktop screenshot"
              loading="lazy"
            />
            <ExpandIcon className="expand-icon">
              <FaExpand />
            </ExpandIcon>
          </DesktopFrame>
        )}

        {mobileUrl && (
          <MobileFrame
            label="Mobile"
            onClick={() => openScreenshotModal(mobileScreenshot)}
          >
            <ScreenshotImage
              src={mobileUrl}
              alt="Mobile screenshot"
              loading="lazy"
            />
            <ExpandIcon className="expand-icon">
              <FaExpand />
            </ExpandIcon>
          </MobileFrame>
        )}

        {fallbackUrl && (
          <DesktopFrame
            label="Screenshot"
            onClick={() => openScreenshotModal(fallbackScreenshot)}
          >
            <ScreenshotImage
              src={fallbackUrl}
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
                Screenshot
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