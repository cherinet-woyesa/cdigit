import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProductSelection, type ProductType } from '../context/ProductSelectionContext'; // Adjust path as needed

import logo from '@assets/logo.jpg';
import cbeImage from '@assets/cbe1.jpg';
// Assuming you have a CSS file for styles, possibly reusing LanguageSelection.css
// import './LanguageSelection.css'; 

const productOptions: { type: ProductType; name: string; description: string }[] = [
  { type: 'Conventional', name: 'Conventional Banking', description: 'Standard financial services.' },
  { type: 'IFB', name: 'Interest-Free Banking (IFB)', description: 'Sharia-compliant financial services.' },
];

const ProductSelection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedProduct, setProductAndNavigate } = useProductSelection();
  
  // Use a temporary state for visual selection before final click, if desired, 
  // but for simplicity, we'll use the context value for styling.

  const handleProductSelect = useCallback((product: ProductType) => {
    // 1. Save the selection to context
    setProductAndNavigate(product);
    
    // 2. Navigate to the dashboard
    navigate('/dashboard');
  }, [navigate, setProductAndNavigate]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, product: ProductType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProductSelect(product);
    }
  }, [handleProductSelect]);

  return (
    <div 
      className="language-selection min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-2 sm:p-4"
    >
      <div className="language-selection__container w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row md:h-auto max-h-[95vh]">
        
        {/* Left Section - Reused Styling */}
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

        {/* Right Section - Product Selection */}
        <div className="language-form-section md:w-3/5 p-4 sm:p-6 md:p-8 flex flex-col space-y-4 flex-1 min-h-0">
          <div className="text-center space-y-2">            
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-fuchsia-700 to-pink-600 bg-clip-text text-transparent">
                {t('selectProduct', 'Select Product Type')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-700 to-pink-600 rounded-full mx-auto"></div>
            </div>

            <p className="text-gray-600 text-sm sm:text-base pb-2">
              {t('chooseYourBankingType', 'Choose your preferred banking service to continue')}
            </p>
          </div>

          <div className="language-selection__grid flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 gap-4 pr-2">
              {productOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleProductSelect(option.type)}
                  onKeyDown={(e) => handleKeyDown(e, option.type)}
                  className={`language-card w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:border-fuchsia-700 hover:shadow-lg group ${
                    selectedProduct === option.type
                      ? 'border-fuchsia-700 bg-fuchsia-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:bg-fuchsia-50'
                  }`}
                  aria-label={`Select ${option.name} banking service`}
                  role="radio" // Use role for better accessibility
                  aria-checked={selectedProduct === option.type}
                >
                  <div className="language-card__content flex items-center gap-4">
                    <span className="text-3xl flex-shrink-0">
                      {option.type === 'Conventional' ? '🏦' : '🕌'}
                    </span>
                    <div className="language-card__text flex-1 min-w-0">
                      <span className="language-card__name block font-bold text-gray-900 text-lg">
                        {option.name}
                      </span>
                      <span className="language-card__native block text-sm text-gray-600">
                        {option.description}
                      </span>
                    </div>
                    <div className="language-card__indicator flex-shrink-0">
                      <svg className={`w-5 h-5 transition-colors duration-200 ${selectedProduct === option.type ? 'text-fuchsia-700 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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

export default ProductSelection;