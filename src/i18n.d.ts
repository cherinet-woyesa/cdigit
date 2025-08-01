import 'i18next';
import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';

declare module 'i18next' {
  type FormKeys = 'accountOpening' | 'cashDeposit' | 'cashWithdrawal' | 'fundTransfer' | 'mobileBanking' | 'atmCard' | 'cbeBirr' | 'otherForms';
  
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        // Navigation
        language: string;
        login: string;
        dashboard: string;
        deposit: string;
        withdrawal: string;
        accountOpening: string;
        submit: string;
        
        // OTP Login
        otpSent: string;
        otpSendError: string;
        loginSuccessful: string;
        invalidOtp: string;
        
        // UI Text
        bankName: string;
        logoAlt: string;
        welcome: string;
        enterPhonePrompt: string;
        
        // Form Fields
        phoneNumber: string;
        phonePlaceholder: string;
        requestOtp: string;
        sendingOtp: string;
        verifyOtp: string;
        verifying: string;
        resendOtp: string;
        resendTimer: string;
        createAccount: string;
        noAccount: string;
        enterOtp: string;
        otpPlaceholder: string;
        otpLabel: string;
        backToPhone: string;
        
        // Dashboard
        dashboardTitle: string;
        loggedInAs: string;
        welcomeBanner: string;
        welcomeSubtitle: string;
        searchPlaceholder: string;
        noResults: string;
        startForm: string;
        forms: {
          [key in FormKeys]: string;
        };
        
        // Allow string indexing for dynamic form keys
        [key: `forms.${FormKeys}`]: string;
      };
    };
  }
}

declare module './i18n' {
  import { i18n } from 'i18next';
  const instance: i18n;
  export default instance;
}
