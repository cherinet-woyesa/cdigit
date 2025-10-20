import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext'; // Add for phone number
import { useBranch } from '../../../../context/BranchContext'; // Add for branch info
import { CheckCircle2, Printer, RefreshCw, ChevronRight, MapPin, User, Hash, Calendar, Clock, FileText, Mail, CreditCard } from 'lucide-react';
import { type StatementRequestData } from '../../../../services/statementService';

const StatementRequestConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const { phone } = useAuth(); // Get phone for header
  const { branch } = useBranch(); // Get branch info
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the request data
  const request = state?.request as StatementRequestData | undefined;
  
  // Redirect if no request data is found
  useEffect(() => {
    if (!request) {
      navigate('/form/statement-request');
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
  
  // Format time only
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format frequency
  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      default:
        return freq;
    }
  };
  
  // Mask account number (show only last 4 digits)
  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '••••' + accountNumber.slice(-4);
  };
  
  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 print:bg-white">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with softer gradient */}
          <header className="bg-fuchsia-700 text-white">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">{t('statementRequestConfirmation', 'Statement Request Confirmation')}</h1>
                    <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{branch?.name || request.branchName || t('branch', 'Branch')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">
                    📱 {phone}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="p-4">
            {/* Success Icon */}
            <div className="text-center py-4">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
    <CheckCircle2 className="h-10 w-10 text-green-600" />
  </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('success', 'Success!')}</h2>
              <p className="text-gray-600 text-sm">{t('requestSubmitted', 'Your statement request has been submitted.')}</p>
            </div>

            {/* Queue and Token Cards with improved colors */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Hash className="h-3 w-3" />
                    <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                  </div>
                  <p className="text-2xl font-bold">{request.queueNumber || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-xs font-medium">{t('token', 'Token')}</span>
                  </div>
                  <p className="text-2xl font-bold">{request.tokenNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Transaction Summary with softer background */}
            <div className="mb-4">
              <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('requestDetails', 'Request Details')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="font-medium text-amber-800 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {t('customerName', 'Customer Name')}:
                    </span>
                    <span className="font-semibold text-right">{request.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="font-medium text-amber-800 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {t('accountNumber', 'Account Number')}:
                    </span>
                    <span className="font-mono font-semibold">{maskAccountNumber(request.accountNumbers[0])}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="font-medium text-amber-800 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('branch', 'Branch')}:
                    </span>
                    <span>{branch?.name || request.branchName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="font-medium text-amber-800 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('statementFrequency', 'Statement Frequency')}:
                    </span>
                    <span>{formatFrequency(request.statementFrequency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium text-amber-800 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t('emailAddresses', 'Email Address(es)')}:
                    </span>
                    <span className="text-right break-all">{request.emailAddresses.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center pt-3 border-t border-amber-200">
              <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
            </div>
          </div>

          {/* Action Buttons with improved colors */}
          <div className="p-4 border-t border-amber-200 print:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
                {t('dashboard', 'Dashboard')}
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
              >
                <Printer className="h-3 w-3" />
                {t('print', 'Print')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => navigate('/form/statement-request/list')}
                className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
              >
                <FileText className="h-3 w-3" />
                {t('viewHistory', 'History')}
              </button>
              
              <button
                onClick={() => navigate('/form/statement-request')}
                className="flex items-center justify-center gap-1 w-full bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {t('newRequest', 'New Request')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatementRequestConfirmation;