import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon, FaBars, FaTimes, FaUser, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { SimpleThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const HeaderContainer = styled.header`
  background-color: var(--color-surface-elevated);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  border-bottom: 1px solid var(--color-border-primary);
`;

const HeaderContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-md) var(--container-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (min-width: 640px) {
    padding: var(--spacing-md) var(--spacing-xl);
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-interactive-primary);
  text-decoration: none;
  font-family: var(--font-family-primary);
  transition: color var(--transition-fast);
  
  &:hover {
    text-decoration: none;
    color: var(--color-interactive-primary-hover);
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
  font-size: var(--font-size-xl);
  cursor: pointer;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-interactive-primary);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
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
  background-color: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  border-top: 1px solid var(--color-border-primary);
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-100%)'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all var(--transition-normal);
  z-index: var(--z-index-dropdown);
  
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
  color: ${props => props.$isActive ? 'var(--color-interactive-primary)' : 'var(--color-text-secondary)'};
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  padding: var(--spacing-sm) 0;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  position: relative;
  
  &:hover {
    color: var(--color-interactive-primary);
    text-decoration: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
    border-radius: var(--border-radius-sm);
  }
  
  ${props => props.$isActive && `
    border-bottom-color: var(--color-interactive-primary);
  `}
`;

const MobileNavLink = styled(Link)`
  color: ${props => props.$isActive ? 'var(--color-interactive-primary)' : 'var(--color-text-primary)'};
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  
  &:hover {
    color: var(--color-interactive-primary);
    background-color: var(--color-surface-secondary);
    text-decoration: none;
  }
  
  ${props => props.$isActive && `
    background-color: var(--color-interactive-primary);
    color: var(--color-text-inverse);
    
    &:hover {
      background-color: var(--color-interactive-primary-hover);
      color: var(--color-text-inverse);
    }
  `}
`;

const DropdownContainer = styled.div`
  position: relative;
  
  &:hover {
    z-index: var(--z-index-dropdown);
  }
`;

const DropdownTrigger = styled.button`
  background: none;
  border: none;
  color: ${props => props.$isActive ? 'var(--color-interactive-primary)' : 'var(--color-text-secondary)'};
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-sm) 0;
  cursor: pointer;
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
  position: relative;
  
  &:hover {
    color: var(--color-interactive-primary);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
    border-radius: var(--border-radius-sm);
  }
  
  ${props => props.$isActive && `
    border-bottom-color: var(--color-interactive-primary);
  `}
  
  &::after {
    content: '▼';
    font-size: 0.75rem;
    transition: transform var(--transition-fast);
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background-color: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  padding: var(--spacing-sm);
  min-width: 200px;
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all var(--transition-fast);
  z-index: var(--z-index-dropdown);
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 0;
    right: 0;
    height: 8px;
    background: transparent;
  }
`;

const DropdownLink = styled(Link)`
  display: block;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-interactive-primary);
    text-decoration: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const CTAButton = styled(Link)`
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-interactive-primary-hover);
    color: var(--color-text-inverse);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const UserDropdown = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: none;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    border-color: var(--color-interactive-primary);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const UserEmail = styled.span`
  font-size: var(--font-size-sm);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background-color: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  padding: var(--spacing-sm);
  min-width: 200px;
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all var(--transition-fast);
  z-index: var(--z-index-dropdown);
`;

const UserDropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-interactive-primary);
    text-decoration: none;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const UserDropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  background: none;
  border: none;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-interactive-primary);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const LoginButton = styled(Link)`
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  
  &:hover {
    color: var(--color-interactive-primary);
    background-color: var(--color-surface-secondary);
    text-decoration: none;
  }
`;

const Header = () => {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

  const toggleUserDropdown = () => {
    console.log('👤 User dropdown toggled, current auth state:', {
      user: !!user,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleSignOut = async () => {
    console.log('🚪 Logout button clicked, attempting sign out...');
    try {
      await signOut();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.log('ℹ️ Sign out completed with timeout, but user is logged out');
    } finally {
      setIsUserDropdownOpen(false);
    }
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/" onClick={closeMobileMenu}>
          <LogoIcon aria-hidden="true" />
          StreetWiseWeb
        </Logo>
        
        <DesktopNavigation>
          <NavLink to="/" $isActive={isActive('/')}>
            {t('home', 'Home')}
          </NavLink>
          
          <DropdownContainer 
            onMouseEnter={() => setIsServicesDropdownOpen(true)}
            onMouseLeave={() => setIsServicesDropdownOpen(false)}
          >
            <DropdownTrigger 
              $isActive={isServicesActive()} 
              $isOpen={isServicesDropdownOpen}
              onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
            >
              {t('services', 'Services')}
            </DropdownTrigger>
            <DropdownMenu $isOpen={isServicesDropdownOpen}>
              <DropdownLink to="/services">{t('allServices', 'All Services')}</DropdownLink>
              <DropdownLink to="/services/accessibility">{t('accessibility', 'Accessibility')}</DropdownLink>
              <DropdownLink to="/services/seo-content">{t('seoContent', 'SEO & Content')}</DropdownLink>
              <DropdownLink to="/services/website-overhaul">{t('websiteOverhaul', 'Website Overhaul')}</DropdownLink>
            </DropdownMenu>
          </DropdownContainer>
          
          <NavLink to="/pricing" $isActive={isActive('/pricing')}>
            {t('pricing', 'Pricing')}
          </NavLink>
          
          <NavLink to="/about" $isActive={isActive('/about')}>
            {t('about', 'About')}
          </NavLink>
          
          {/* <NavLink to="/blog" $isActive={isActive('/blog')}>
            {t('blog', 'Blog')}
          </NavLink> */}
          
          <NavLink to="/contact" $isActive={isActive('/contact')}>
            {t('contact', 'Contact')}
          </NavLink>
          
          <LanguageSelector />
          
          <SimpleThemeToggle />
          
          {user ? (
            <UserSection>
              <CTAButton to="/free-audit">
                {t('freeAudit', 'Free Audit')}
              </CTAButton>
              
              <UserDropdown>
                <UserButton onClick={toggleUserDropdown}>
                  <FaUser />
                </UserButton>
                <UserDropdownMenu isOpen={isUserDropdownOpen}>
                  <UserDropdownItem to="/dashboard" onClick={() => setIsUserDropdownOpen(false)}>
                    <FaTachometerAlt />
                    Dashboard
                  </UserDropdownItem>
                  <UserDropdownButton onClick={handleSignOut}>
                    <FaSignOutAlt />
                    Sign Out
                  </UserDropdownButton>
                </UserDropdownMenu>
              </UserDropdown>
            </UserSection>
          ) : (
            <AuthButtons>
              <CTAButton to="/free-audit">
                {t('freeAudit', 'Free Audit')}
              </CTAButton>
              <LoginButton to="/login">
                Sign In
              </LoginButton>
            </AuthButtons>
          )}
        </DesktopNavigation>
        
        <MobileMenuButton onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
      </HeaderContent>
      
      <MobileNavigation isOpen={isMobileMenuOpen}>
        <MobileNavContent>
          <MobileNavLink to="/" $isActive={isActive('/')} onClick={closeMobileMenu}>
            {t('home', 'Home')}
          </MobileNavLink>
          <MobileNavLink to="/services" $isActive={isActive('/services')} onClick={closeMobileMenu}>
            {t('services', 'Services')}
          </MobileNavLink>
          <MobileNavLink to="/services/accessibility" $isActive={isActive('/services/accessibility')} onClick={closeMobileMenu}>
            {t('accessibility', 'Accessibility')}
          </MobileNavLink>
          <MobileNavLink to="/services/seo-content" $isActive={isActive('/services/seo-content')} onClick={closeMobileMenu}>
            {t('seoContent', 'SEO & Content')}
          </MobileNavLink>
          <MobileNavLink to="/services/website-overhaul" $isActive={isActive('/services/website-overhaul')} onClick={closeMobileMenu}>
            {t('websiteOverhaul', 'Website Overhaul')}
          </MobileNavLink>
          <MobileNavLink to="/pricing" $isActive={isActive('/pricing')} onClick={closeMobileMenu}>
            {t('pricing', 'Pricing')}
          </MobileNavLink>
          <MobileNavLink to="/about" $isActive={isActive('/about')} onClick={closeMobileMenu}>
            {t('about', 'About')}
          </MobileNavLink>
          {/* <MobileNavLink to="/blog" $isActive={isActive('/blog')} onClick={closeMobileMenu}>
            {t('blog', 'Blog')}
          </MobileNavLink> */}
          <MobileNavLink to="/contact" $isActive={isActive('/contact')} onClick={closeMobileMenu}>
            {t('contact', 'Contact')}
          </MobileNavLink>
          
          {user && (
            <>
              <MobileNavLink to="/dashboard" isActive={isActive('/dashboard')} onClick={closeMobileMenu}>
                Dashboard
              </MobileNavLink>
              <UserDropdownButton onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                <FaSignOutAlt />
                Sign Out
              </UserDropdownButton>
            </>
          )}
          
          <LanguageSelector />
          <SimpleThemeToggle />
          <CTAButton to="/free-audit" onClick={closeMobileMenu}>
            {t('freeAudit', 'Free Audit')}
          </CTAButton>
          
          {!user && (
            <LoginButton to="/login" onClick={closeMobileMenu}>
              Sign In
            </LoginButton>
          )}
        </MobileNavContent>
      </MobileNavigation>
    </HeaderContainer>
  );
};

export default Header;