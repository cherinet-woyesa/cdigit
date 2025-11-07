import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@components/language/LanguageSwitcher';
import { useAuth } from '@context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Smartphone, 
  User, 
  FileText, 
  CreditCard,
  Plane,
  Calendar,
  Printer,
  RefreshCw
} from 'lucide-react';

interface FormData {
  formRefId: string;
  branchName: string;
  accountNumber: string;
  customerName: string;
  businessName: string;
  businessType: string;
  // Removed unused fields that aren't in the form
  contactPerson: string;
  phoneNumber: string;
  email: string;
  region: string;
  city: string;
  subCity: string;
  woreda: string;
  kebele: string;
  houseNumber: string;
  landmark?: string;
  numberOfPOS: number;
  posType: 'mobile' | 'desktop';
  estimatedMonthlyTransaction: string;
  // Removed unused fields that aren't in the form
  date: string;
}

const POSRequestConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { phone } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  
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
  
  const serverData: any = location.state?.serverData?.data;
  const branchName = location.state?.branchName as string | undefined;
  const queueNumber = serverData?.queueNumber != null ? String(serverData.queueNumber) : 'N/A';
  const tokenNumber = serverData?.tokenNumber || 'N/A';
  const formReferenceId = serverData?.formReferenceId || formData.formRefId;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with softer gradient */}
          <header className="bg-fuchsia-700 text-white">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">{t('posRequestSubmitted', 'POS Request Submitted')}</h1>
                    <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{branchName || t('branch', 'Branch')}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">📱 {phone}</div>
                  {/* <div className="bg-white/20 rounded p-1"><LanguageSwitcher /></div> */}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div ref={printRef} className="p-4">
          {/* Success Message */}
          <div className="text-center py-4">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
    <CheckCircle2 className="h-10 w-10 text-green-600" />
  </div>
  <h2 className="text-lg font-bold text-gray-900 mb-1">
    {t('success', 'Success!')}
  </h2>
  <p className="text-sm text-green-700">
                  {t('requestSubmittedSuccessfully', 'Your POS request has been submitted successfully.')}
                </p>
</div>

          
          
            {/* Queue and Token Cards with improved colors */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                  </div>
                  <p className="text-2xl font-bold">{queueNumber}</p>
                </div>
                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-xs font-medium">{t('token', 'Token')}</span>
                  </div>
                  <p className="text-2xl font-bold">{tokenNumber}</p>
                </div>
              </div>
            </div>

            {/* Reference Information with softer background */}
            <div className="bg-amber-25 p-4 rounded-lg mb-4 border border-amber-200 shadow-sm">
              <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('referenceInformation', 'Reference Information')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">{t('referenceNumber', 'Reference Number')}:</span>
                  <span className="font-mono font-semibold">{formReferenceId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">{t('submissionDate', 'Submission Date')}:</span>
                  <span className="text-amber-700">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">{t('branch', 'Branch')}:</span>
                  <span className="text-amber-700">{branchName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">{t('accountNumber', 'Account Number')}:</span>
                  <span className="font-mono font-semibold">{formatAccountNumber(formData.accountNumber)}</span>
                </div>
              </div>
            </div>
          
          {/* Request Details */}
          <div className="bg-white border border-amber-200 rounded-lg overflow-hidden mb-6 shadow-sm">
            <div className="px-4 py-5 border-b border-amber-200 sm:px-6">
              <h3 className="text-lg font-medium text-amber-700">
                {t('requestDetails', 'Request Details')}
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Business Information */}
                <div>
                  <h4 className="text-md font-medium text-amber-700 mb-3 flex items-center">
                    <User className="h-5 w-5 text-amber-600 mr-2" />
                    {t('businessInformation', 'Business Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-amber-600">{t('businessName', 'Business Name')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.businessName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-amber-600">{t('businessType', 'Business Type')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{formData.businessType}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-amber-700 mb-3 flex items-center">
                    <Smartphone className="h-5 w-5 text-amber-600 mr-2" />
                    {t('contactInformation', 'Contact Information')}
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-amber-600">{t('contactPerson', 'Contact Person')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.contactPerson}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-amber-600">{t('phoneNumber', 'Phone Number')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formData.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-amber-600">{t('emailAddress', 'Email Address')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{formData.email}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Address Information */}
                <div className="sm:col-span-2">
                  <h4 className="text-md font-medium text-amber-700 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 text-amber-600 mr-2" />
                    {t('businessAddress', 'Business Address')}
                  </h4>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
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
                  <h4 className="text-md font-medium text-amber-700 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 text-amber-600 mr-2" />
                    {t('posTerminalDetails', 'POS Terminal Details')}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <p className="text-sm font-medium text-amber-600">{t('numberOfPOS', 'Number of POS')}</p>
                      <p className="text-lg font-semibold text-amber-700">{formData.numberOfPOS}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <p className="text-sm font-medium text-amber-600">{t('posType', 'POS Type')}</p>
                      <p className="text-lg font-semibold text-amber-700 capitalize">{formData.posType}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <p className="text-sm font-medium text-amber-600">{t('estimatedVolume', 'Estimated Monthly Volume')}</p>
                      <p className="text-lg font-semibold text-amber-700">{formData.estimatedMonthlyTransaction}</p>
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
          
            {/* Actions with improved colors */}
            <div className="p-4 border-t border-amber-200">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/form/pos-request')}
                  className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t('newRequest', 'New')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                >
                  <Printer className="h-3 w-3" />
                  {t('print', 'Print')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSRequestConfirmation;