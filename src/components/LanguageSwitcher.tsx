import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import './LanguageSwitcher.css';

// Supported languages with their display names and flags
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  // Add more languages here as needed
  // Example:
  // { code: 'fr', name: 'Français', flag: '🇫🇷' },
  // { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLanguage = i18n.language;
  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChange = async (lng: string) => {
    // The i18next-browser-languagedetector plugin, if configured,
    // will automatically handle persisting the language.
    await i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <div className="language-dropdown">
        <button 
          type="button"
          onClick={toggleDropdown}
          className="language-current"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Select language"
        >
          <span className="language-flag">{currentLang.flag}</span>
          <span className="language-code">{currentLanguage.toUpperCase()}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        
        {isOpen && (
          <div className="language-menu" role="menu">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleChange(lang.code)}
                className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`}
                role="menuitem"
                aria-label={`Change language to ${lang.name}`}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-name">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <span className="checkmark" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
