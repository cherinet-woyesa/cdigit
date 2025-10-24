import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../../../context/AuthContext';
import makerServices from '../../../../../services/makerServices';
import { EmptyState, ActionMessage } from '../../common';
import { formatCurrency, formatDate, capitalizeWords } from '../../../utils';
import type { ServiceRequest, ActionMessage as ActionMessageType } from '../../../types';

interface ServiceDetailPanelProps {
  onBack?: () => void;
}

const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({ onBack }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<string>('');
  const [endpoint, setEndpoint] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessageType | null>(null);

  useEffect(() => {
    const storedServiceType = localStorage.getItem('selectedServiceType') || '';
    const storedEndpoint = localStorage.getItem('selectedServiceEndpoint') || '';
    
    setServiceType(storedServiceType);
    setEndpoint(storedEndpoint);
    
    fetchServiceRequests(storedEndpoint);
  }, []);

  const fetchServiceRequests = async (endpoint: string) => {
    if (!token || !endpoint) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const branchId = user?.branchId || localStorage.getItem('userBranchId') || 'default-branch';
      
      let response;
      const serviceMethods = {
        'AccountOpening': () => makerServices.getAccountOpeningRequests(token, branchId),
        'CbeBirrRegistrations': () => makerServices.getCbeBirrRegistrationRequests(token, branchId),
        'EBankingApplication': () => makerServices.getEBankingApplicationRequests(token, branchId),
        'PosRequest': () => makerServices.getPosRequestRequests(token, branchId),
        'StatementRequest': () => makerServices.getStatementRequestRequests(token, branchId),
        'StopPaymentOrder': () => makerServices.getStopPaymentRequests(token, branchId),
        'CbeBirrLink': () => makerServices.getCbeBirrLinkRequests(token, branchId),
        'RtgsTransfer': () => makerServices.getRtgsTransferRequests(token, branchId),
      };

      if (serviceMethods[endpoint as keyof typeof serviceMethods]) {
        response = await serviceMethods[endpoint as keyof typeof serviceMethods]();
      } else {
        throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      console.log('🔍 API Response for', endpoint, ':', response);
      
      if (response.success && response.data) {
        setServiceRequests(response.data);
        
        if (response.data.length === 0) {
          setActionMessage({
            type: 'info',
            content: `No ${serviceType.toLowerCase()} requests found.`
          });
        }
      } else {
        setError(response.message || 'Failed to fetch service requests');
        setServiceRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch service requests:', error);
      const errorMessage = error.message || 'Failed to fetch service requests';
      setError(errorMessage);
      setActionMessage({
        type: 'error',
        content: errorMessage
      });
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getRequestId = (request: ServiceRequest): string => {
    if (request.formReferenceId) {
      return request.formReferenceId;
    }
    
    const possibleIdFields = [
      'id', 'requestId', 'applicationId', 'eBankingApplicationId',
      '_id', 'ID', 'RequestID', 'ApplicationID', 'eBankingId'
    ];
    
    for (const field of possibleIdFields) {
      if (request[field as keyof ServiceRequest]) {
        return request[field as keyof ServiceRequest]?.toString() || '';
      }
    }
    
    console.warn('❌ No ID field found in request:', request);
    return '';
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/maker/dashboard/other');
    }
  };

  const handleRefresh = () => {
    fetchServiceRequests(endpoint);
  };

  const handleViewRequest = (requestId: string, request: ServiceRequest) => {
    if (!requestId || requestId === 'undefined' || requestId === '') {
      setActionMessage({
        type: 'error',
        content: 'Cannot view request: Invalid request ID.'
      });
      return;
    }
    
    localStorage.setItem('selectedRequestId', requestId);
    localStorage.setItem('selectedRequestData', JSON.stringify(request));
    
    console.log('🚀 Navigating to:', `/maker/service-request/${endpoint}/${requestId}`);
    window.location.hash = `/maker/service-request/${endpoint}/${requestId}`;
  };

  // Helper functions using our utility functions
  const getCustomerName = (request: ServiceRequest): string => {
    return request.accountHolderName || request.customerName || request.name || 
           request.fullName || request.customerFullName || 'Unknown Customer';
  };

  const getAccountNumber = (request: ServiceRequest): string => {
    return request.accountNumber || request.accountNo || request.account || 'N/A';
  };

  const getStatus = (request: ServiceRequest): string => {
    return request.status || request.requestStatus || 'Pending';
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('queue')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower.includes('progress')) {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower.includes('completed') || statusLower.includes('approved')) {
      return 'bg-green-100 text-green-800';
    } else if (statusLower.includes('cancelled') || statusLower.includes('rejected')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getSubmittedDate = (request: ServiceRequest): string => {
    return request.submittedAt || request.createdAt || request.requestDate || new Date().toISOString();
  };

  const getAmount = (request: ServiceRequest): number | null => {
    return request.amount || request.transferAmount || request.requestedAmount || null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center">
              <DocumentTextIcon className="h-5 w-5 text-fuchsia-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{serviceType}</h2>
              <p className="text-sm text-gray-500">Manage service requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="px-6 pt-4">
          <ActionMessage 
            message={actionMessage} 
            onClose={() => setActionMessage(null)}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
          </div>
        ) : error ? (
          <EmptyState
            title="Error Loading Requests"
            message={error}
            action={
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
              >
                Retry
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-gray-900">
                {serviceRequests.length} {serviceRequests.length === 1 ? 'Request' : 'Requests'}
              </h3>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Filter
                </button>
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {serviceRequests.length === 0 ? (
              <EmptyState
                title="No Requests Found"
                message={`There are no ${serviceType.toLowerCase()} requests at this time.`}
                icon={DocumentTextIcon}
              />
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceRequests.map((request, index) => {
                        const requestId = getRequestId(request);
                        return (
                          <tr key={requestId || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {capitalizeWords(getCustomerName(request))}
                              </div>
                              <div className="text-xs text-gray-400">
                                {request.phoneNumber || 'No phone'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 font-mono">
                                {getAccountNumber(request)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-900">
                                {request.formReferenceId || 'No Reference'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getStatus(request))}`}>
                                {capitalizeWords(getStatus(request))}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(getSubmittedDate(request))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getAmount(request) ? formatCurrency(getAmount(request)!) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleViewRequest(requestId, request)}
                                className="flex items-center gap-1 text-fuchsia-600 hover:text-fuchsia-900 transition-colors"
                              >
                                <EyeIcon className="h-4 w-4" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailPanel;