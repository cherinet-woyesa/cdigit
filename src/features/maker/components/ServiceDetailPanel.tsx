import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@context/AuthContext';
import makerServices from '@services/makerServices';

interface ServiceDetailPanelProps {
  onBack?: () => void;
}

const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({ onBack }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<string>('');
  const [endpoint, setEndpoint] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get service type and endpoint from localStorage
    const storedServiceType = localStorage.getItem('selectedServiceType') || '';
    const storedEndpoint = localStorage.getItem('selectedServiceEndpoint') || '';
    
    setServiceType(storedServiceType);
    setEndpoint(storedEndpoint);
    
    // Fetch service requests
    fetchServiceRequests(storedEndpoint);
  }, []);

  const fetchServiceRequests = async (endpoint: string) => {
    if (!token || !endpoint) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get branchId from user context or localStorage
      const branchId = user?.branchId || localStorage.getItem('userBranchId') || 'default-branch';
      
      let response;
      switch (endpoint) {
        case 'AccountOpening':
          response = await makerServices.getAccountOpeningRequests(token, branchId);
          break;
        case 'CbeBirrRegistrations':
          response = await makerServices.getCbeBirrRegistrationRequests(token, branchId);
          break;
        case 'EBankingApplication':
          response = await makerServices.getEBankingApplicationRequests(token, branchId);
          break;
        case 'PosRequest':
          response = await makerServices.getPosRequestRequests(token, branchId);
          break;
        case 'StatementRequest':
          response = await makerServices.getStatementRequestRequests(token, branchId);
          break;
        case 'StopPaymentOrder':
          response = await makerServices.getStopPaymentRequests(token, branchId);
          break;
        case 'CbeBirrLink':
          response = await makerServices.getCbeBirrLinkRequests(token, branchId);
          break;
        case 'RtgsTransfer':
          response = await makerServices.getRtgsTransferRequests(token, branchId);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      console.log('🔍 API Response for', endpoint, ':', response);
      console.log('📊 Response data structure:', response.data);
      
      if (response.success && response.data) {
        setServiceRequests(response.data);
        
        // Debug: Check the first request object
        if (response.data.length > 0) {
          console.log('🔬 First request object:', response.data[0]);
          console.log('🔑 Available keys in first request:', Object.keys(response.data[0]));
        }
      } else {
        setError(response.message || 'Failed to fetch service requests');
        setServiceRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch service requests:', error);
      setError(error.message || 'Failed to fetch service requests');
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fixed helper function to get the correct ID from request
  const getRequestId = (request: any): string => {
    // Use formReferenceId as the primary ID field
    if (request.formReferenceId) {
      console.log('✅ Found ID in field "formReferenceId":', request.formReferenceId);
      return request.formReferenceId;
    }
    
    // Fallback to other possible ID fields
    const possibleIdFields = [
      'id', 'requestId', 'applicationId', 'eBankingApplicationId',
      '_id', 'ID', 'RequestID', 'ApplicationID', 'eBankingId'
    ];
    
    for (const field of possibleIdFields) {
      if (request[field]) {
        console.log(`✅ Found ID in field "${field}":`, request[field]);
        return request[field].toString();
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

  const handleViewRequest = (requestId: string, request: any) => {
    console.log('👁️ Viewing request:', { requestId, request });
    
    if (!requestId || requestId === 'undefined' || requestId === '') {
      console.error('❌ Invalid request ID:', requestId);
      console.log('📋 Full request object:', request);
      alert('Cannot view request: Invalid request ID. Check console for details.');
      return;
    }
    
    // Store request details in localStorage
    localStorage.setItem('selectedRequestId', requestId);
    localStorage.setItem('selectedRequestData', JSON.stringify(request));
    
    console.log('🚀 Navigating to:', `/maker/service-request/${endpoint}/${requestId}`);
    window.location.hash = `/maker/service-request/${endpoint}/${requestId}`;
  };

  // Helper function to get customer name from request
  const getCustomerName = (request: any): string => {
    return request.accountHolderName || request.customerName || request.name || 
           request.fullName || request.customerFullName || 'Unknown Customer';
  };

  // Helper function to get account number from request
  const getAccountNumber = (request: any): string => {
    return request.accountNumber || request.accountNo || request.account || 'N/A';
  };

  // Helper function to get status from request
  const getStatus = (request: any): string => {
    return request.status || request.requestStatus || 'Pending';
  };

  // Helper function to get submitted date from request
  const getSubmittedDate = (request: any): string => {
    return request.submittedAt || request.createdAt || request.requestDate || new Date().toISOString();
  };

  // Helper function to get amount from request
  const getAmount = (request: any): number | null => {
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

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-gray-900">
                {serviceRequests.length} Requests
              </h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Filter
                </button>
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {serviceRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No requests found</p>
                <p className="text-sm text-gray-400 mt-1">There are no {serviceType.toLowerCase()} requests at this time.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                        <tr key={requestId || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{getCustomerName(request)}</div>
                            <div className="text-xs text-gray-400">{request.phoneNumber || 'No phone'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{getAccountNumber(request)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">{request.formReferenceId || 'No Reference'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              getStatus(request) === 'Pending' || getStatus(request) === 'OnQueue' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : getStatus(request) === 'In Progress' || getStatus(request) === 'OnProgress'
                                  ? 'bg-blue-100 text-blue-800' 
                                  : getStatus(request) === 'Completed' || getStatus(request) === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : getStatus(request) === 'Cancelled' || getStatus(request) === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatus(request)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(getSubmittedDate(request)).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getAmount(request) ? `ETB ${getAmount(request)!.toLocaleString()}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleViewRequest(requestId, request)}
                              className="flex items-center gap-1 text-fuchsia-600 hover:text-fuchsia-900"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailPanel;