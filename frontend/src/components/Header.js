import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const HeaderContainer = styled.header`
  background-color: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
  
  &:hover {
    text-decoration: none;
    color: #1d4ed8;
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
  color: #4b5563;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    color: #2563eb;
    border-bottom-color: #2563eb;
    text-decoration: none;
  }
`;

const Header = () => {
  const { t } = useTranslation('navigation');

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <LogoIcon aria-hidden="true" />
          SiteCraft
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