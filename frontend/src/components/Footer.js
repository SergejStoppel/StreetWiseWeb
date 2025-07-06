import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #1f2937;
  color: #e5e7eb;
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
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterText>
          &copy; 2024 SiteCraft. All rights reserved.
        </FooterText>
        <FooterText>
          Empowering businesses with accessible and optimized websites.
        </FooterText>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;