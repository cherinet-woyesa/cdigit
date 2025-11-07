import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@assets/logo.jpg';
import cbeImage from '@assets/cbe1.jpg';
import './LanguageSelection.css';
import { LANGUAGES, LANGUAGE_CONFIG } from '@constants/languageConfig';
import type { LanguageCode } from '@constants/languageConfig';

// Define the languages to show outside component for better performance
const languagesToShow = ['en', 'am', 'om', 'ti', 'so'];

// Filter LANGUAGES array to only include the specified languages (outside component for better performance)
const filteredLanguagesForDisplay = LANGUAGES.filter(lang => languagesToShow.includes(lang.code));

const LanguageSelection: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLastUsedLanguage = useCallback((): LanguageCode | null => {
    const lang = localStorage.getItem('lastUsedLanguage');
    return lang && languagesToShow.includes(lang) ? lang as LanguageCode : null;
  }, []); // languagesToShow is now a module-level constant, so no need to include in dependencies

  const saveLastUsedLanguage = useCallback((langCode: LanguageCode) => {
    localStorage.setItem('lastUsedLanguage', langCode);
  }, []);

  // Using pre-filtered languages directly for better performance
  const filteredLanguages = filteredLanguagesForDisplay;

  const handleLanguageSelect = useCallback(async (langCode: LanguageCode) => {
    setSelectedLanguage(langCode);
    saveLastUsedLanguage(langCode);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    await i18n.changeLanguage(langCode);
    
    document.documentElement.dir = LANGUAGE_CONFIG[langCode].direction;
    document.documentElement.lang = langCode;
    
    // Always navigate to dashboard after language selection
    navigate('/dashboard');
  }, [i18n, navigate, saveLastUsedLanguage]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, langCode: LanguageCode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLanguageSelect(langCode);
    }
  }, [handleLanguageSelect]);

  return (
    <div 
      className="language-selection min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-2 sm:p-4"
      ref={containerRef}
    >
      <div className="language-selection__container w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row md:h-auto max-h-[95vh]">
        
        <div className="cbe-image-section md:w-2/5 bg-gradient-to-br from-fuchsia-700 to-pink-600 p-6 md:p-8 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="cbe-image-container w-24 h-24 md:w-40 md:h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
            <img 
              src={cbeImage} 
              alt="Commercial Bank of Ethiopia" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="relative z-10 text-center space-y-2">
            <div className="flex items-center justify-center space-x-3">
              <div className="logo-container w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <img 
                  src={logo} 
                  alt={t('logoAlt', 'CBE Logo')} 
                  className="h-6 w-6 object-contain rounded-full"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
                {t('bankName', 'Commercial Bank of Ethiopia')}
              </h1>
            </div>

            <div className="hidden md:block space-y-2 pt-2">
              <h2 className="text-lg md:text-xl font-bold text-white/90">
                Digital Banking
              </h2>
              <div className="w-20 h-1 bg-white/50 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>

        <div className="language-form-section md:w-3/5 p-4 sm:p-6 md:p-8 flex flex-col space-y-4 flex-1 min-h-0">
          <div className="text-center space-y-2">            
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-fuchsia-700 to-pink-600 bg-clip-text text-transparent">
                {t('selectLanguage', 'Select Language')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-700 to-pink-600 rounded-full mx-auto"></div>
            </div>

            <p className="text-gray-600 text-sm sm:text-base pb-2">
              {t('chooseYourPreferredLanguage', 'Choose your preferred language to continue')}
            </p>
          </div>

          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {t('availableLanguages', 'Available Languages')}
            </h3>
          </div>

          <div className="language-selection__grid flex-1 overflow-y-auto min-h-0">
            {filteredLanguages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    onKeyDown={(e) => handleKeyDown(e, lang.code)}
                    className={`language-card w-full text-left p-3 rounded-lg border-2 transition-all duration-200 hover:border-fuchsia-700 hover:shadow-md group ${
                      selectedLanguage === lang.code 
                        ? 'border-fuchsia-700 bg-fuchsia-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:bg-fuchsia-50'
                    }`}
                    aria-label={`Select ${lang.name} language`}
                  >
                    <div className="language-card__content flex items-center gap-3">
                      <span className="language-card__flag text-xl sm:text-2xl flex-shrink-0">{lang.flag}</span>
                      <div className="language-card__text flex-1 min-w-0">
                        <span className="language-card__name block font-semibold text-gray-900 text-sm">{lang.name}</span>
                        <span className="language-card__native block text-xs text-gray-600">{lang.nativeName}</span>
                      </div>
                      <div className="language-card__indicator flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4 text-fuchsia-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 mb-2">{t('noLanguagesFound', 'No languages found')}</p>
              </div>
            )}
          </div>

          <div className="language-selection__footer text-center pt-2 border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-500">
              {t('cbeDigitalServices', 'CBE Digital Services')} • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;