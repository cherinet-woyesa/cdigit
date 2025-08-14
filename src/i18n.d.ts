import 'i18next';
import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        language: string;
        login: string;
        dashboard: string;
        deposit: string;
        withdrawal: string;
        accountOpening: string;
        submit: string;
        otpSent: string;
        otpSendError: string;
        loginSuccessful: string;
        invalidOtp: string;
        bankName: string;
        logoAlt: string;
        welcome: string;
        enterPhonePrompt: string;
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
        dashboardTitle: string;
        loggedInAs: string;
        welcomeBanner: string;
        welcomeSubtitle: string;
        searchPlaceholder: string;
        noResults: string;
        startForm: string;
        select: string;
        next: string;
        forms: {
          accountOpening: string;
          cashDeposit: string;
          cashWithdrawal: string;
          fundTransfer: string;
          mobileBanking: string;
          atmCard: string;
          cbeBirr: string;
          otherForms: string;
        };
        account: {
          personalDetailsTitle: string;
          accountType: string;
          savings: string;
          current: string;
          ifb: string;
          title: string;
          titles: {
            Mr: string;
            Mrs: string;
            Miss: string;
            Ms: string;
            Dr: string;
          };
          yourName: string;
          fullNamePlaceholder: string;
          fatherName: string;
          grandfatherName: string;
          motherFullName: string;
          sex: string;
          sexOptions: {
            male: string;
            female: string;
          };
          dateOfBirth: string;
          placeOfBirth: string;
          maritalStatus: string;
          maritalStatusOptions: {
            single: string;
            married: string;
            divorced: string;
            widowed: string;
          };
          educationQualification: string;
          education: {
            none: string;
            primary: string;
            secondary: string;
            diploma: string;
            degree: string;
            masters: string;
            phd: string;
          };
          nationality: string;
          nationalityOptions: {
            ethiopian: string;
            foreignnational: string;
          };
        };
      };
    };
  }
}

declare module './i18n' {
  import { i18n } from 'i18next';
  const instance: i18n;
  export default instance;
}