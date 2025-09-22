import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Smartphone, Mail, Home, User, FileText, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FormData {
  formRefId: string;
  branchName: string;
  accountNumber: string;
  customerName: string;
  businessName: string;
  businessType: string;
  tinNumber: string;
  businessLicenseNumber: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  region: string;
  city: string;
  subCity: string;
  woreda: string;
  houseNumber: string;
  landmark?: string;
  numberOfPOS: number;
  posType: 'mobile' | 'desktop';
  estimatedMonthlyTransaction: string;
  bankAccountForSettlement: string;
  date: string;
}

const POSRequestConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the form data from location state
  const formData = location.state?.formData as FormData | undefined;
  
  // Redirect to the form if no data is available
  useEffect(() => {
    if (!formData) {
      navigate('/form/pos-request');
    }
  }, [formData, navigate]);
  
  if (!formData) {
    return null; // Will redirect in useEffect
  }
  
  // Format the account number for display (e.g., XXXX-XXXX-1234)
  const formatAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    const lastFour = accountNumber.slice(-4);
    return `XXXX-XXXX-${lastFour}`;
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-800 px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold text-white">
            {t('posRequestSubmitted', 'POS Request Submitted')}
          </h2>
          <p className="mt-1 text-sm text-fuchsia-100">
            {t('thankYouForYourRequest', 'Thank you for your request. We will process it shortly.')}
          </p>
        </div>
        
        {/* Confirmation Content */}
        <div className="p-6">
          {/* Success Message */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {t('requestSubmittedSuccessfully', 'Your POS request has been submitted successfully.')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Reference Information */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('referenceInformation', 'Reference Information')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-fuchsia-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('referenceNumber', 'Reference Number')}</p>
                  <p className="text-sm text-gray-900 font-mono">{formData.formRefId}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-fuchsia-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('submissionDate', 'Submission Date')}</p>
                  <p className="text-sm text-gray-900">{formatDate(formData.date)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-fuchsia-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('branch', 'Branch')}</p>
                  <p className="text-sm text-gray-900">{formData.branchName}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-fuchsia-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('accountNumber', 'Account Number')}</p>
                  <p className="text-sm text-gray-900">{formatAccountNumber(formData.accountNumber)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Request Details */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                {t('requestDetails', 'Request Details')}
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Business Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 text-fuchsia-600 mr-2" />
                    {t('businessInformation', 'Business Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('businessName', 'Business Name')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.businessName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('businessType', 'Business Type')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{formData.businessType}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('tinNumber', 'TIN Number')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.tinNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('businessLicense', 'Business License')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.businessLicenseNumber}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Smartphone className="h-5 w-5 text-fuchsia-600 mr-2" />
                    {t('contactInformation', 'Contact Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('contactPerson', 'Contact Person')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.contactPerson}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('phoneNumber', 'Phone Number')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('emailAddress', 'Email Address')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{formData.email}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Address Information */}
                <div className="sm:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 text-fuchsia-600 mr-2" />
                    {t('businessAddress', 'Business Address')}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">
                      {formData.houseNumber && <span>{formData.houseNumber}, </span>}
                      {formData.landmark && <span>{formData.landmark}, </span>}
                      {formData.woreda && <span>{formData.woreda}, </span>}
                      {formData.subCity && <span>{formData.subCity}, </span>}
                      {formData.city && <span>{formData.city}, </span>}
                      {formData.region && <span>{formData.region}</span>}
                    </p>
                  </div>
                </div>
                
                {/* POS Terminal Details */}
                <div className="sm:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 text-fuchsia-600 mr-2" />
                    {t('posTerminalDetails', 'POS Terminal Details')}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">{t('numberOfPOS', 'Number of POS')}</p>
                      <p className="text-lg font-semibold text-gray-900">{formData.numberOfPOS}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">{t('posType', 'POS Type')}</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{formData.posType}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">{t('estimatedVolume', 'Estimated Monthly Volume')}</p>
                      <p className="text-lg font-semibold text-gray-900">{formData.estimatedMonthlyTransaction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {t('whatHappensNext', 'What happens next?')}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    {t('nextStepsDescription', 'Our team will review your POS request and contact you within 3-5 business days. ')}
                    {t('nextStepsContact', 'If you have any questions, please contact our customer service.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
            >
              {t('printThisPage', 'Print this page')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
            >
              {t('backToDashboard', 'Back to Dashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSRequestConfirmation;
