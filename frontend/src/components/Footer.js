import React from 'react';
import styled from 'styled-components';
import { useBranding } from '../hooks/useBranding';
const { branding } = require('../shared/branding');

const FooterContainer = styled.footer`
  background-color: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  padding: var(--spacing-4xl) 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  text-align: center;
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-xl);
  }
`;

const FooterText = styled.p`
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Footer = () => {
  const branding = useBranding();

  return (
    <FooterContainer>
      <FooterContent>
        <FooterText>
          &copy; 2025 {branding.company.name}. All rights reserved.
        </FooterText>
        <FooterText>
          {branding.company.tagline}
        </FooterText>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;