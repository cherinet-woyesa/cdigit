import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speechService } from '../services/speechService';
import { LANGUAGES, LANGUAGE_CONFIG } from '../constants/languageConfig';
import type { LanguageCode } from '../constants/languageConfig';
import { useAuth } from '../context/AuthContext';

// Define the languages to show outside component for better performance
const languagesToShow = ['en', 'am', 'om', 'ti', 'so'];

// Filter LANGUAGES array to only include the specified languages (outside component for better performance)
const filteredLanguagesForDisplay = LANGUAGES.filter(lang => languagesToShow.includes(lang.code));

const Welcome: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserBranch } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Using pre-filtered languages directly for better performance
  const filteredLanguages = filteredLanguagesForDisplay;

  const handleLanguageSelect = useCallback(async (langCode: LanguageCode) => {
    setSelectedLanguage(langCode);
    speechService.stop();

    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');

    if (branchId) {
      // Save branch ID to localStorage for use in OTP login
      localStorage.setItem('branchIdFromWelcome', branchId);
    }

    const confirmationText = LANGUAGE_CONFIG[langCode].name;
    await speechService.speak(confirmationText, langCode);

    await new Promise(resolve => setTimeout(resolve, 800));

    await i18n.changeLanguage(langCode);

    document.documentElement.dir = LANGUAGE_CONFIG[langCode].direction;
    document.documentElement.lang = langCode;

    // Navigate to OTP login
    navigate('/otp-login');
  }, [i18n, navigate, location.search, updateUserBranch]);

  const speakWelcomeMessage = useCallback(async (lang?: LanguageCode) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const welcomeMessage = t('welcome_message', 'Welcome to Commercial Bank of Ethiopia. Choose language to proceed.');
    const langCode = lang || i18n.language as LanguageCode;
    await speechService.speak(welcomeMessage, langCode, 'welcome_message');
    setIsSpeaking(false);
  }, [t, i18n.language, isSpeaking]);

  useEffect(() => {
    const hasPlayedWelcome = sessionStorage.getItem('welcomePlayed');
    if (!hasPlayedWelcome) {
      const timer = setTimeout(() => {
        speakWelcomeMessage('en');
        sessionStorage.setItem('welcomePlayed', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [speakWelcomeMessage]);

  return (
    <div className="language-selection min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-2 sm:p-4">
      <div className="language-selection__container w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col md:h-auto max-h-[95vh]">
        <div className="language-form-section p-4 sm:p-6 md:p-8 flex flex-col space-y-4 flex-1 min-h-0">
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

          <div className="language-selection__grid flex-1 overflow-y-auto min-h-0">
            {filteredLanguages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
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

export default Welcome;