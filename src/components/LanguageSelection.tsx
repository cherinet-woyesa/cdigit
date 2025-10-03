import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speechService } from '../services/speechService';
import logo from '../assets/logo.jpg';
import cbeImage from '../assets/cbe1.jpg';
import './LanguageSelection.css';
import { LANGUAGES, LANGUAGE_CONFIG } from '../constants/languageConfig';
import type { LanguageCode } from '../constants/languageConfig';

const LanguageSelection: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentLanguages, setRecentLanguages] = useState<LanguageCode[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get last used language from localStorage
  const getLastUsedLanguage = (): LanguageCode | null => {
    const lang = localStorage.getItem('lastUsedLanguage');
    return lang && LANGUAGES.some(l => l.code === lang) ? lang as LanguageCode : null;
  };

  // Get recent languages from localStorage
  const getRecentLanguages = (): LanguageCode[] => {
    try {
      const recent = localStorage.getItem('recentLanguages');
      if (!recent) return [];
      
      const parsed = JSON.parse(recent);
      return parsed.filter((lang: string) => 
        LANGUAGES.some(l => l.code === lang)
      ) as LanguageCode[];
    } catch {
      return [];
    }
  };

  // Save last used language to localStorage
  const saveLastUsedLanguage = (langCode: LanguageCode) => {
    localStorage.setItem('lastUsedLanguage', langCode);
    
    // Update recent languages
    const recent = getRecentLanguages();
    const updatedRecent = [
      langCode,
      ...recent.filter(lang => lang !== langCode)
    ].slice(0, 4); // Keep last 4 languages
    
    localStorage.setItem('recentLanguages', JSON.stringify(updatedRecent));
    setRecentLanguages(updatedRecent);
  };

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get popular languages (most used)
  const popularLanguages = LANGUAGES.filter(lang => 
    ['am', 'en', 'or', 'ti'].includes(lang.code)
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
  const speakWelcomeMessage = async () => {
    setIsSpeaking(true);
    const welcomeMessage = t('welcome_message', 'Welcome to Commercial Bank of Ethiopia. Choose language to proceed.');
    await speechService.speak(welcomeMessage, i18n.language as LanguageCode);
    setIsSpeaking(false);
  };

  // Auto-select last used language and speak welcome
  useEffect(() => {
    const lastUsedLanguage = getLastUsedLanguage();
    const recentLangs = getRecentLanguages();
    setRecentLanguages(recentLangs);
    
    if (lastUsedLanguage) {
      setSelectedLanguage(lastUsedLanguage);
      // Auto-speak welcome in last used language after a delay
      const timer = setTimeout(() => {
        const welcomeMessage = t('welcome_message', 'Welcome to Commercial Bank of Ethiopia. Choose language to proceed.');
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

  // Toggle recent languages view
  const toggleRecentView = () => {
    setShowRecent(!showRecent);
    setSearchTerm('');
  };

  // Clear recent languages
  const clearRecentLanguages = () => {
    localStorage.removeItem('recentLanguages');
    setRecentLanguages([]);
    setShowRecent(false);
  };

  const displayLanguages = showRecent 
    ? LANGUAGES.filter(lang => recentLanguages.includes(lang.code))
    : filteredLanguages;

  const hasRecentLanguages = recentLanguages.length > 0;

  return (
    <div 
      className="language-selection min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-2 sm:p-4"
      ref={containerRef}
    >
      <div className="language-selection__container w-full max-w-5xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col lg:flex-row lg:h-auto max-h-[95vh]">
        
        {/* Left Column - CBE Image & Branding */}
        <div className="cbe-image-section lg:w-2/5 bg-gradient-to-br from-fuchsia-700 to-pink-600 p-4 lg:p-8 flex flex-row items-center lg:flex-col lg:justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* CBE Image */}
          <div className="cbe-image-container flex-shrink-0 w-20 h-20 lg:w-48 lg:h-48 lg:mb-6 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
            <img 
              src={cbeImage} 
              alt="Commercial Bank of Ethiopia" 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Brand Content */}
          <div className="relative z-10 ml-4 lg:ml-0 text-left lg:text-center lg:space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="logo-container w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <img 
                  src={logo} 
                  alt={t('logoAlt', 'CBE Logo')} 
                  className="h-6 w-6 lg:h-8 lg:w-8 object-contain rounded-full"
                />
              </div>
              <h1 className="text-lg lg:text-3xl font-bold text-white uppercase tracking-wide">
                {t('bankName', 'Commercial Bank of Ethiopia')}
              </h1>
            </div>

            <div className="hidden lg:block space-y-2">
              <h2 className="text-xl lg:text-2xl font-bold text-white/90">
                Digital Banking
              </h2>
              <div className="w-20 h-1 bg-white/50 rounded-full mx-auto"></div>
            </div>

            <p className="hidden lg:block text-white/80 text-sm lg:text-base max-w-md">
              Experience seamless banking in your preferred language. Secure, fast, and accessible to everyone.
            </p>

            {/* Quick Stats */}
            <div className="hidden lg:grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">50+</div>
                <div className="text-xs text-white/70">Languages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">24/7</div>
                <div className="text-xs text-white/70">Service</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">100%</div>
                <div className="text-xs text-white/70">Secure</div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="hidden lg:block absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="hidden lg:block absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-24 translate-y-24"></div>
        </div>

        {/* Right Column - Language Selection Form */}
        <div className="language-form-section lg:w-3/5 p-4 lg:p-8 flex flex-col space-y-4 flex-1 min-h-0">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-fuchsia-700 to-pink-600 bg-clip-text text-transparent">
                {t('selectLanguage', 'Select Language')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-700 to-pink-600 rounded-full mx-auto"></div>
            </div>

            <p className="text-gray-600 text-sm pb-2">
              {t('chooseYourPreferredLanguage', 'Choose your preferred language to continue')}
            </p>

            {/* Voice & Recent Buttons */}
            <div className="flex items-center justify-center gap-3">
              {speechService.isSupported && (
                <button
                  onClick={speakWelcomeMessage}
                  className="voice-button flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  disabled={isSpeaking}
                >
                  <svg className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                  <span className="hidden sm:inline">
                    {isSpeaking 
                      ? t('speaking', 'Speaking...') 
                      : t('voice', 'Listen Welcome')
                    }
                  </span>
                </button>
              )}
              
              {hasRecentLanguages && (
                <button
                  onClick={toggleRecentView}
                  className={`flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3 rounded-lg transition-all duration-200 ${
                    showRecent 
                      ? 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{showRecent ? t('allLanguages', 'All') : t('recent', 'Recent')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="language-selection__search relative flex-shrink-0">
            <input
              type="text"
              placeholder={t('searchLanguages', "Search languages...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-700 focus:border-transparent transition-colors"
              onFocus={() => setShowRecent(false)}
            />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800">
              {showRecent ? t('recentlyUsed', 'Recently Used') : searchTerm ? t('searchResults', 'Results') : t('availableLanguages', 'Available Languages')}
            </h3>
            {showRecent && hasRecentLanguages && (
              <button onClick={clearRecentLanguages} className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('clear', 'Clear')}
              </button>
            )}
          </div>

          {/* Languages Grid */}
          <div className="language-selection__grid flex-1 overflow-y-auto min-h-0">
            {displayLanguages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-2">
                {displayLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`language-card w-full text-left p-3 rounded-lg border-2 transition-all duration-200 hover:border-fuchsia-700 hover:shadow-md group ${
                      selectedLanguage === lang.code 
                        ? 'border-fuchsia-700 bg-fuchsia-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:bg-fuchsia-50'
                    } ${
                      recentLanguages.includes(lang.code) ? 'recent-language' : ''
                    }`}
                    aria-label={`Select ${lang.name} language`}
                  >
                    <div className="language-card__content flex items-center gap-3">
                      <span className="language-card__flag text-xl lg:text-2xl flex-shrink-0">{lang.flag}</span>
                      <div className="language-card__text flex-1 min-w-0">
                        <span className="language-card__name block font-semibold text-gray-900 text-sm">{lang.name}</span>
                        <span className="language-card__native block text-xs text-gray-600">{lang.nativeName}</span>
                      </div>
                      <div className="language-card__indicator flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4 text-fuchsia-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {recentLanguages.includes(lang.code) && (
                        <div className="recent-badge flex-shrink-0">
                          <svg className="w-3 h-3 text-fuchsia-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                      )}
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
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-sm text-fuchsia-600 hover:text-fuchsia-700 transition-colors">
                    {t('clearSearch', 'Clear search')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Popular Languages Quick Access */}
          {!searchTerm && !showRecent && (
            <div className="popular-languages-section flex-shrink-0 pt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('popularLanguages', 'Popular')}</h4>
              <div className="flex flex-wrap gap-2">
                {popularLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-fuchsia-100 text-gray-700 rounded-lg transition-colors duration-200 border border-transparent hover:border-fuchsia-300"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
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