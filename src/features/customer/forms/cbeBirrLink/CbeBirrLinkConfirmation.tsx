import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ArrowLeft } from 'lucide-react';
import { type CbeBirrLinkRequest } from '../../../../services/cbeBirrService';

const CbeBirrLinkConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the request data
  const request = state?.request as CbeBirrLinkRequest | undefined;
  
  // Redirect if no request data is found
  useEffect(() => {
    if (!request) {
      navigate('/form/cbe-birr-link');
    }
  }, [request, navigate]);
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get action label
  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'link':
        return 'Account Link';
      case 'unlink':
        return 'Account Unlink';
      case 'change_phone':
        return 'Phone Number Change';
      case 'modify_end_date':
        return 'End Date Modification';
      default:
        return 'Request';
    }
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 print-confirmation">
      <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-lg print:shadow-none">
        {/* Header with softer gradient */}
        <header className="bg-gradient-to-r from-amber-400 to-fuchsia-600 text-white p-4 rounded-lg shadow-lg text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {t('requestSubmitted', 'Request Submitted Successfully')}
          </h1>
        </header>
        
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-amber-700 mb-2">
            {t('success', 'Success!')}
          </h2>
          <p className="text-amber-700">
            {t('requestSubmittedMessage', 'Your request has been submitted successfully. Please present your ID at windows number 12.')}
          </p>
        </div>
        
        {/* Request Summary with softer background */}
        <div className="border border-amber-200 rounded-lg p-6 mb-8 bg-amber-25 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-amber-200 text-amber-700">
            {t('requestDetails', 'Request Details')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-amber-600">{t('formRefId', 'Form Ref ID')}</p>
              <p className="font-medium">{request.formRefId}</p>
            </div>
            <div>
              <p className="text-sm text-amber-600">{t('branchName', 'Branch Name')}</p>
              <p className="font-medium">{request.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-amber-600">{t('customerName', 'Customer Name')}</p>
              <p className="font-medium">{request.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-amber-600">{t('selectedServices', 'Selected Service(s)')}</p>
              <p className="font-medium">{getActionLabel(request.actionType)}</p>
            </div>
          </div>
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-blue-800 mb-2">{t('whatHappensNext', 'What happens next?')}</h3>
          <p className="text-blue-700 text-sm">
            {t('nextStepsDescription', 'Your request has been submitted for processing. Please present your ID at windows number 12 to complete the verification process. You will receive a confirmation message once your request has been processed.')}
          </p>
        </div>
        
        {/* Actions with improved colors */}
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center justify-center px-4 py-2 border border-amber-300 rounded-md text-amber-700 bg-white hover:bg-amber-50 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToDashboard', 'Back to Dashboard')}
          </button>
          
          <div className="space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-4 py-2 border border-fuchsia-300 rounded-md text-fuchsia-700 bg-white hover:bg-fuchsia-50 font-medium"
            >
              <Printer className="h-4 w-4 mr-2" />
              {t('printReceipt', 'Print Receipt')}
            </button>
            
            <button
              onClick={() => navigate('/form/cbe-birr-link')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 font-medium"
            >
              {t('newRequest', 'New Request')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-confirmation,
          .print-confirmation * {
            visibility: visible;
          }
          .print-confirmation {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// ID types for display
const ID_TYPES = [
  { value: 'NID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
];

export default CbeBirrLinkConfirmation;