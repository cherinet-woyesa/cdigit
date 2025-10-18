import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { RefreshCw, FileText, Calendar, Clock, MapPin, ChevronRight, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { statementService, type StatementRequestData } from '../../../../services/statementService';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';

const StatementRequestList: React.FC = () => {
  const { t } = useTranslation();
  const { phone } = useAuth();
  const { branch } = useBranch();
  const navigate = useNavigate();
  const { loadingAccounts, errorAccounts, refreshAccounts } = useUserAccounts();
  const [requests, setRequests] = useState<StatementRequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all statement requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statementService.getStatementRequests();
      setRequests(data);
    } catch (err) {
      setError(t('failedToLoadRequests', 'Failed to load statement requests'));
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format frequency
  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily':
        return t('daily', 'Daily');
      case 'weekly':
        return t('weekly', 'Weekly');
      case 'monthly':
        return t('monthly', 'Monthly');
      case 'quarterly':
        return t('quarterly', 'Quarterly');
      default:
        return freq;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Loading states (consistent with other forms)
  if (loadingAccounts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorAccounts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
            <p className="text-gray-600 mb-4">{errorAccounts}</p>
            <button
              onClick={() => refreshAccounts()}
              className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800"
            >
              {t('tryAgain', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <RefreshCw className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('loadingRequests', 'Loading statement requests...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="font-semibold">{t('error', 'Error')}</p>
            <p className="mt-2">{error}</p>
          </div>
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white rounded-md hover:from-amber-600 hover:to-fuchsia-800 flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with brand gradient */}
        <div className="mb-6 bg-gradient-to-r from-amber-400 to-fuchsia-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-extrabold text-white">{t('statementRequests', 'Statement Requests')}</h1>
              <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                <MapPin className="h-3 w-3" />
                <span>{branch?.name || t('branch', 'Branch')}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/form/statement-request')}
                className="text-xs text-fuchsia-100 hover:text-white underline"
              >
                {t('newRequest', 'New Request')}
              </button>
              <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                📱 {phone}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{t('requestHistory', 'Request History')}</h2>
          <button
            onClick={fetchRequests}
            className="text-amber-600 hover:text-amber-800 flex items-center text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {t('refresh', 'Refresh')}
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noRequests', 'No statement requests')}</h3>
            <p className="text-gray-600 mb-6">{t('noRequestsMessage', 'You haven\'t submitted any statement requests yet.')}</p>
            <button
              onClick={() => navigate('/form/statement-request')}
              className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-md font-medium hover:from-amber-600 hover:to-fuchsia-800"
            >
              {t('createRequest', 'Create Your First Request')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div 
                  key={request.id || request.formRefId} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/form/statement-request/confirmation', { state: { request } })}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-amber-500 mr-2" />
                        <span className="font-medium text-gray-900">
                          {request.formRefId}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {request.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(request.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(request.date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatFrequency(request.statementFrequency)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {request.accountNumbers.length} {t('account', 'account')}{request.accountNumbers.length > 1 ? 's' : ''}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {request.branchName}
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => navigate('/form/statement-request')}
                className="w-full bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-md font-medium hover:from-amber-600 hover:to-fuchsia-800 flex items-center justify-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {t('newRequest', 'New Statement Request')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatementRequestList;