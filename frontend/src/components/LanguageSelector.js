import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

// Define supported languages locally
const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
};

const LanguageSelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const LanguageButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  font-family: var(--font-family-secondary);

  &:hover {
    background: var(--color-surface-secondary);
    border-color: var(--color-interactive-primary);
    color: var(--color-text-primary);
  }

  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    box-shadow: 0 0 0 2px var(--color-interactive-primary);
  }
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  min-width: 160px;
  margin-top: 4px;
`;

const LanguageOption = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: background-color var(--transition-fast);
  font-family: var(--font-family-secondary);

  &:hover {
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
  }

  &:focus {
    outline: none;
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-interactive-primary);
    color: var(--color-text-on-brand);
  }

  &:first-child {
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  }
`;

const LanguageFlag = styled.span`
  font-size: var(--font-size-lg);
`;

const LanguageName = styled.span`
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
`;

const LanguageNativeName = styled.span`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
`;

const LanguageSelector = () => {
  const { i18n, t } = useTranslation('navigation');
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES[i18n.language] || SUPPORTED_LANGUAGES.en;

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const handleClickOutside = React.useCallback((event) => {
    if (!event.target.closest('[data-language-selector]')) {
      setIsOpen(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <LanguageSelectorContainer data-language-selector>
      <LanguageButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <LanguageFlag>{currentLanguage.flag}</LanguageFlag>
        <span>{currentLanguage.nativeName}</span>
      </LanguageButton>

      {isOpen && (
        <LanguageDropdown role="listbox" aria-label={t('languageSelector')}>
          {Object.values(SUPPORTED_LANGUAGES).map((language) => (
            <LanguageOption
              key={language.code}
              className={i18n.language === language.code ? 'active' : ''}
              onClick={() => handleLanguageChange(language.code)}
              role="option"
              aria-selected={i18n.language === language.code}
            >
              <LanguageFlag>{language.flag}</LanguageFlag>
              <div>
                <LanguageName>{language.nativeName}</LanguageName>
                {language.nativeName !== language.name && (
                  <LanguageNativeName>{language.name}</LanguageNativeName>
                )}
              </div>
            </LanguageOption>
          ))}
        </LanguageDropdown>
      )}
    </LanguageSelectorContainer>
  );
};

export default LanguageSelector;