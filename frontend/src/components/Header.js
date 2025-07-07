import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { useBranding } from '../hooks/useBranding';
const { branding } = require('../shared/branding');

const HeaderContainer = styled.header`
  background-color: ${branding.colors.neutral[0]};
  box-shadow: ${branding.design.shadows.md};
  position: sticky;
  top: 0;
  z-index: 50;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (min-width: 768px) {
    padding: 1rem 2rem;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-size: ${branding.typography.scales.xl};
  font-weight: 700;
  color: ${branding.colors.primary[500]};
  text-decoration: none;
  font-family: "${branding.typography.fonts.primary.name}", ${branding.typography.fonts.primary.fallback};
  
  &:hover {
    text-decoration: none;
    color: ${branding.colors.primary[700]};
  }
`;

const LogoIcon = styled(FaAccessibleIcon)`
  margin-right: 0.5rem;
  font-size: 1.75rem;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const NavLink = styled(Link)`
  color: ${branding.colors.neutral[600]};
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  font-family: "${branding.typography.fonts.primary.name}", ${branding.typography.fonts.primary.fallback};
  
  &:hover {
    color: ${branding.colors.primary[500]};
    border-bottom-color: ${branding.colors.primary[500]};
    text-decoration: none;
  }
`;

const Header = () => {
  const { t } = useTranslation('navigation');
  const branding = useBranding();

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <LogoIcon aria-hidden="true" />
          {branding.company.name}
        </Logo>
        <Navigation>
          <NavLink to="/">{t('home')}</NavLink>
          <NavLink to="/results">{t('results')}</NavLink>
          <LanguageSelector />
        </Navigation>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;