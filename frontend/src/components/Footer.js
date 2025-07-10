import React from 'react';
import styled from 'styled-components';
import { useBranding } from '../hooks/useBranding';
const { branding } = require('../shared/branding');

const FooterContainer = styled.footer`
  background-color: ${branding.colors.neutral[800]};
  color: ${branding.colors.neutral[200]};
  padding: 2rem 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  
  @media (min-width: 768px) {
    padding: 0 2rem;
  }
`;

const FooterText = styled.p`
  font-size: ${branding.typography.scales.sm};
  margin-bottom: 0.5rem;
  font-family: "${branding.typography.fonts.primary.name}", ${branding.typography.fonts.primary.fallback};
  
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
          &copy; 2024 {branding.company.name}. All rights reserved.
        </FooterText>
        <FooterText>
          {branding.company.tagline}
        </FooterText>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;