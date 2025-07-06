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
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral[700]};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral[50]};
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]}20;
  }
`;

const LanguageDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
  margin-top: 4px;
`;

const LanguageOption = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral[700]};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral[50]};
  }

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.colors.neutral[50]};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primary[50]};
    color: ${({ theme }) => theme.colors.primary[600]};
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const LanguageFlag = styled.span`
  font-size: 18px;
`;

const LanguageName = styled.span`
  font-weight: 500;
`;

const LanguageNativeName = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral[500]};
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