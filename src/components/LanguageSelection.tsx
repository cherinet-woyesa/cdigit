import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speechService } from '../services/speechService';
import logo from '../assets/logo.jpg';
import './LanguageSelection.css';
import { LANGUAGES, LANGUAGE_CONFIG } from '../constants/languageConfig';
import type { LanguageCode } from '../constants/languageConfig';

const LanguageSelection: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get last used language from localStorage
  const getLastUsedLanguage = (): string | null => {
    return localStorage.getItem('lastUsedLanguage');
  };

  // Save last used language to localStorage
  const saveLastUsedLanguage = (langCode: string) => {
    localStorage.setItem('lastUsedLanguage', langCode);
  };

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageSelect = async (langCode: LanguageCode) => {
    setSelectedLanguage(langCode);
    
    // Save to localStorage
    saveLastUsedLanguage(langCode);
    
    // Stop any ongoing speech
    speechService.stop();
    
    // Speak selection confirmation
    const confirmationText = LANGUAGE_CONFIG[langCode].name;
    await speechService.speak(confirmationText, langCode);
    
    // Add selection animation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Change language and navigate
    await i18n.changeLanguage(langCode);
    
    // Update document direction
    document.documentElement.dir = LANGUAGE_CONFIG[langCode].direction;
    document.documentElement.lang = langCode;
    
    navigate('/select-branch');
  };

  // Speak welcome message
  const speakWelcomeMessage = () => {
    const welcomeMessage = t('welcome_message') || 'Welcome to Commercial Bank of Ethiopia. Choose language to proceed.';
    speechService.speak(welcomeMessage, i18n.language);
  };

  // Auto-select last used language and speak welcome
  useEffect(() => {
    const lastUsedLanguage = getLastUsedLanguage();
    if (lastUsedLanguage && LANGUAGES.some(lang => lang.code === lastUsedLanguage)) {
      setSelectedLanguage(lastUsedLanguage);
      // Auto-speak welcome in last used language after a delay
      const timer = setTimeout(() => {
        const welcomeMessage = t('welcome_message') || 'Welcome to Commercial Bank of Ethiopia. Choose language to proceed.';
        speechService.speak(welcomeMessage, lastUsedLanguage);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Default welcome message
      const timer = setTimeout(() => {
        speakWelcomeMessage();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  return (
    <div 
      className="language-selection min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8"
      ref={containerRef}
    >
      <div className="language-selection__container w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 border border-fuchsia-100">
        {/* Header Section */}
        <div className="language-selection__header text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="logo-container w-12 h-12 bg-gradient-to-br from-fuchsia-700 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <img 
                src={logo} 
                alt={t('logoAlt')} 
                className="h-8 w-8 object-contain rounded-full"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {t('bankName')}
            </h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-700 to-pink-600 bg-clip-text text-transparent">
              {t('selectLanguage')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-700 to-pink-600 rounded-full mx-auto"></div>
          </div>

          <p className="text-gray-600 text-sm">
            {t('chooseYourPreferredLanguage')}
          </p>

          {/* Voice Button */}
          {speechService.isSupported && (
            <button
              onClick={speakWelcomeMessage}
              className="voice-button mx-auto flex items-center gap-2 px-6 py-3 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
              disabled={isSpeaking}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              {t('voice') || 'Listen Welcome'}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="language-selection__search relative">
          <input
            type="text"
            placeholder={t('searchLanguages') || "Search languages..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-700 focus:border-transparent transition-colors"
          />
          <svg 
            className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Languages Grid */}
        <div className="language-selection__grid">
          {filteredLanguages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`language-card w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:border-fuchsia-700 hover:shadow-md ${
                    selectedLanguage === lang.code 
                      ? 'border-fuchsia-700 bg-fuchsia-50 shadow-md' 
                      : 'border-gray-200 bg-white'
                  }`}
                  aria-label={`Select ${lang.name} language`}
                >
                  <div className="language-card__content flex items-center gap-4">
                    <span className="language-card__flag text-2xl">
                      {lang.flag}
                    </span>
                    <div className="language-card__text flex-1">
                      <span className="language-card__name block font-semibold text-gray-900">
                        {lang.name}
                      </span>
                      <span className="language-card__native block text-sm text-gray-600">
                        {lang.nativeName}
                      </span>
                    </div>
                    <div className="language-card__indicator">
                      <svg className="w-5 h-5 text-fuchsia-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{t('noLanguagesFound') || 'No languages found matching your search'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="language-selection__footer text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {t('secureAuthentication')} • {new Date().getFullYear()} • {t('cbeDigitalServices')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;