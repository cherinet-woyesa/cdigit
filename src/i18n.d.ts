import 'i18next';
import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';

declare module 'i18next' {
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
      };
    };
  }
}

declare module './i18n' {
  import { i18n } from 'i18next';
  const instance: i18n;
  export default instance;
}
