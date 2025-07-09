import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon, FaBars, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const HeaderContainer = styled.header`
  background-color: var(--color-white);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
`;

const HeaderContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-sm) var(--container-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (min-width: 640px) {
    padding: var(--spacing-sm) var(--spacing-md);
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-decoration: none;
  font-family: var(--font-primary);
  
  &:hover {
    text-decoration: none;
    color: var(--color-primary-hover);
  }
`;

const LogoIcon = styled(FaAccessibleIcon)`
  margin-right: var(--spacing-xs);
  font-size: 1.75rem;
`;

const DesktopNavigation = styled.nav`
  display: none;
  align-items: center;
  gap: var(--spacing-md);
  
  @media (min-width: 768px) {
    display: flex;
  }
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-fast);
  
  &:hover {
    background-color: var(--color-bg-secondary);
  }
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileNavigation = styled.nav`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-white);
  box-shadow: var(--shadow-lg);
  border-top: 1px solid var(--color-gray-border);
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-100%)'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all var(--transition-normal);
  z-index: var(--z-dropdown);
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileNavContent = styled.div`
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
`;

const NavLink = styled(Link)`
  color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  padding: var(--spacing-xs) 0;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
  font-family: var(--font-primary);
  position: relative;
  
  &:hover {
    color: var(--color-primary);
    text-decoration: none;
  }
  
  ${props => props.isActive && `
    border-bottom-color: var(--color-primary);
  `}
`;

const MobileNavLink = styled(Link)`
  color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-primary)'};
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-primary);
  
  &:hover {
    color: var(--color-primary);
    background-color: var(--color-bg-secondary);
    text-decoration: none;
  }
  
  ${props => props.isActive && `
    background-color: var(--color-primary);
    color: var(--color-white);
    
    &:hover {
      background-color: var(--color-primary-hover);
      color: var(--color-white);
    }
  `}
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownTrigger = styled.button`
  background: none;
  border: none;
  color: ${props => props.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-xs) 0;
  cursor: pointer;
  font-family: var(--font-primary);
  font-size: var(--font-size-body);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: color var(--transition-fast);
  
  &:hover {
    color: var(--color-primary);
  }
  
  &::after {
    content: '▼';
    font-size: 0.75rem;
    transition: transform var(--transition-fast);
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--color-white);
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xs);
  min-width: 200px;
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all var(--transition-fast);
  z-index: var(--z-dropdown);
`;

const DropdownLink = styled(Link)`
  display: block;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
    text-decoration: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const CTAButton = styled(Link)`
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-white);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const Header = () => {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isServicesActive = () => location.pathname.startsWith('/services');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleServicesDropdown = () => {
    setIsServicesDropdownOpen(!isServicesDropdownOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/" onClick={closeMobileMenu}>
          <LogoIcon aria-hidden="true" />
          SiteCraft
        </Logo>
        
        <DesktopNavigation>
          <NavLink to="/" isActive={isActive('/')}>
            {t('home', 'Home')}
          </NavLink>
          
          <DropdownContainer 
            onMouseEnter={() => setIsServicesDropdownOpen(true)}
            onMouseLeave={() => setIsServicesDropdownOpen(false)}
          >
            <DropdownTrigger 
              isActive={isServicesActive()} 
              isOpen={isServicesDropdownOpen}
              onClick={toggleServicesDropdown}
            >
              {t('services', 'Services')}
            </DropdownTrigger>
            <DropdownMenu isOpen={isServicesDropdownOpen}>
              <DropdownLink to="/services">{t('allServices', 'All Services')}</DropdownLink>
              <DropdownLink to="/services/accessibility">{t('accessibility', 'Accessibility')}</DropdownLink>
              <DropdownLink to="/services/seo-content">{t('seoContent', 'SEO & Content')}</DropdownLink>
              <DropdownLink to="/services/website-overhaul">{t('websiteOverhaul', 'Website Overhaul')}</DropdownLink>
            </DropdownMenu>
          </DropdownContainer>
          
          <NavLink to="/pricing" isActive={isActive('/pricing')}>
            {t('pricing', 'Pricing')}
          </NavLink>
          
          <NavLink to="/about" isActive={isActive('/about')}>
            {t('about', 'About')}
          </NavLink>
          
          <NavLink to="/blog" isActive={isActive('/blog')}>
            {t('blog', 'Blog')}
          </NavLink>
          
          <NavLink to="/contact" isActive={isActive('/contact')}>
            {t('contact', 'Contact')}
          </NavLink>
          
          <LanguageSelector />
          
          <CTAButton to="/free-audit">
            {t('freeAudit', 'Free Audit')}
          </CTAButton>
        </DesktopNavigation>
        
        <MobileMenuButton onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      </HeaderContent>
      
      <MobileNavigation isOpen={isMobileMenuOpen}>
        <MobileNavContent>
          <MobileNavLink to="/" isActive={isActive('/')} onClick={closeMobileMenu}>
            {t('home', 'Home')}
          </MobileNavLink>
          <MobileNavLink to="/services" isActive={isActive('/services')} onClick={closeMobileMenu}>
            {t('services', 'Services')}
          </MobileNavLink>
          <MobileNavLink to="/services/accessibility" isActive={isActive('/services/accessibility')} onClick={closeMobileMenu}>
            {t('accessibility', 'Accessibility')}
          </MobileNavLink>
          <MobileNavLink to="/services/seo-content" isActive={isActive('/services/seo-content')} onClick={closeMobileMenu}>
            {t('seoContent', 'SEO & Content')}
          </MobileNavLink>
          <MobileNavLink to="/services/website-overhaul" isActive={isActive('/services/website-overhaul')} onClick={closeMobileMenu}>
            {t('websiteOverhaul', 'Website Overhaul')}
          </MobileNavLink>
          <MobileNavLink to="/pricing" isActive={isActive('/pricing')} onClick={closeMobileMenu}>
            {t('pricing', 'Pricing')}
          </MobileNavLink>
          <MobileNavLink to="/about" isActive={isActive('/about')} onClick={closeMobileMenu}>
            {t('about', 'About')}
          </MobileNavLink>
          <MobileNavLink to="/blog" isActive={isActive('/blog')} onClick={closeMobileMenu}>
            {t('blog', 'Blog')}
          </MobileNavLink>
          <MobileNavLink to="/contact" isActive={isActive('/contact')} onClick={closeMobileMenu}>
            {t('contact', 'Contact')}
          </MobileNavLink>
          <LanguageSelector />
          <CTAButton to="/free-audit" onClick={closeMobileMenu}>
            {t('freeAudit', 'Free Audit')}
          </CTAButton>
        </MobileNavContent>
      </MobileNavigation>
    </HeaderContainer>
  );
};

export default Header;