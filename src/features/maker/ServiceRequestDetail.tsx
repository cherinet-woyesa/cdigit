import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import makerServices from '../../services/makerServices';

interface ServiceRequestDetailProps {
  serviceType: string;
  endpoint: string;
  requestId: string;
  onBack?: () => void;
}

const ServiceRequestDetail: React.FC<ServiceRequestDetailProps> = ({ 
  serviceType, 
  endpoint, 
  requestId,
  onBack 
}) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    console.log('🔍 ServiceRequestDetail mounted:', { endpoint, requestId });
    fetchServiceRequest();
  }, [endpoint, requestId]);

  const fetchServiceRequest = async () => {
    if (!token || !endpoint) {
      setError('Missing token or endpoint');
      setLoading(false);
      return;
    }

    // Check if requestId is valid
    if (!requestId || requestId === 'undefined') {
      console.error('❌ Invalid requestId:', requestId);
      
      // Try to get request data from localStorage as fallback
      const storedRequestData = localStorage.getItem('selectedRequestData');
      if (storedRequestData) {
        console.log('🔄 Using fallback data from localStorage');
        setRequest(JSON.parse(storedRequestData));
        setLoading(false);
        return;
      }
      
      setError(`Invalid request ID: ${requestId}`);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching request details for:', { endpoint, requestId });
      
      // Map endpoint to the appropriate service method
      let response;
      switch (endpoint) {
        case 'AccountOpening':
          response = await makerServices.getAccountOpeningRequestById(requestId, token);
          break;
        case 'CbeBirrRegistrations':
          response = await makerServices.getCbeBirrRegistrationRequestById(requestId, token);
          break;
        case 'EBankingApplication':
          response = await makerServices.getEBankingApplicationRequestById(requestId, token);
          break;
        case 'PosRequest':
          response = await makerServices.getPosRequestRequestById(requestId, token);
          break;
        case 'StatementRequest':
          response = await makerServices.getStatementRequestRequestById(requestId, token);
          break;
        case 'StopPaymentOrder':
          response = await makerServices.getStopPaymentRequestById(requestId, token);
          break;
        case 'CbeBirrLink':
          response = await makerServices.getCbeBirrLinkRequestById(requestId, token);
          break;
        case 'RtgsTransfer':
          response = await makerServices.getRtgsTransferRequestById(requestId, token);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      console.log('✅ API Response:', response);
      
      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        setError(response.message || 'Failed to fetch service request');
        
        // Fallback to localStorage data if API fails
        const storedRequestData = localStorage.getItem('selectedRequestData');
        if (storedRequestData) {
          console.log('🔄 Using fallback data from localStorage after API failure');
          setRequest(JSON.parse(storedRequestData));
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch service request:', error);
      setError(error.message || 'Failed to fetch service request');
      
      // Fallback to localStorage data on error
      const storedRequestData = localStorage.getItem('selectedRequestData');
      if (storedRequestData) {
        console.log('🔄 Using fallback data from localStorage after error');
        setRequest(JSON.parse(storedRequestData));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Navigate back to the service detail panel
      navigate(-1);
    }
  };

  const handleApprove = async () => {
    if (!token || !endpoint || !requestId || !request) return;
    
    try {
      setUpdating(true);
      
      // Update the request status to approved
      const updateData = {
        ...request,
        status: 'Approved'
      };
      
      let response;
      switch (endpoint) {
        case 'AccountOpening':
          response = await makerServices.updateServiceRequest('AccountOpening', requestId, updateData, token);
          break;
        case 'CbeBirrRegistrations':
          response = await makerServices.updateServiceRequest('CbeBirrRegistrations', requestId, updateData, token);
          break;
        case 'EBankingApplication':
          response = await makerServices.updateServiceRequest('EBankingApplication', requestId, updateData, token);
          break;
        case 'PosRequest':
          response = await makerServices.updateServiceRequest('PosRequest', requestId, updateData, token);
          break;
        case 'StatementRequest':
          response = await makerServices.updateServiceRequest('StatementRequest', requestId, updateData, token);
          break;
        case 'StopPaymentOrder':
          response = await makerServices.updateServiceRequest('StopPaymentOrder', requestId, updateData, token);
          break;
        case 'CbeBirrLink':
          response = await makerServices.updateServiceRequest('CbeBirrLink', requestId, updateData, token);
          break;
        case 'RtgsTransfer':
          response = await makerServices.updateServiceRequest('RtgsTransfer', requestId, updateData, token);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      if (response.success) {
        // Refresh the request data
        fetchServiceRequest();
      } else {
        setError(response.message || 'Failed to approve request');
      }
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      setError(error.message || 'Failed to approve request');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!token || !endpoint || !requestId || !request) return;
    
    try {
      setUpdating(true);
      
      // Update the request status to rejected
      const updateData = {
        ...request,
        status: 'Rejected'
      };
      
      let response;
      switch (endpoint) {
        case 'AccountOpening':
          response = await makerServices.updateServiceRequest('AccountOpening', requestId, updateData, token);
          break;
        case 'CbeBirrRegistrations':
          response = await makerServices.updateServiceRequest('CbeBirrRegistrations', requestId, updateData, token);
          break;
        case 'EBankingApplication':
          response = await makerServices.updateServiceRequest('EBankingApplication', requestId, updateData, token);
          break;
        case 'PosRequest':
          response = await makerServices.updateServiceRequest('PosRequest', requestId, updateData, token);
          break;
        case 'StatementRequest':
          response = await makerServices.updateServiceRequest('StatementRequest', requestId, updateData, token);
          break;
        case 'StopPaymentOrder':
          response = await makerServices.updateServiceRequest('StopPaymentOrder', requestId, updateData, token);
          break;
        case 'CbeBirrLink':
          response = await makerServices.updateServiceRequest('CbeBirrLink', requestId, updateData, token);
          break;
        case 'RtgsTransfer':
          response = await makerServices.updateServiceRequest('RtgsTransfer', requestId, updateData, token);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      if (response.success) {
        // Refresh the request data
        fetchServiceRequest();
      } else {
        setError(response.message || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      setError(error.message || 'Failed to reject request');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !endpoint || !requestId) return;
    
    try {
      setUpdating(true);
      
      let response;
      switch (endpoint) {
        case 'AccountOpening':
          response = await makerServices.cancelServiceRequest('AccountOpening', requestId, token);
          break;
        case 'CbeBirrRegistrations':
          response = await makerServices.cancelServiceRequest('CbeBirrRegistrations', requestId, token);
          break;
        case 'EBankingApplication':
          response = await makerServices.cancelServiceRequest('EBankingApplication', requestId, token);
          break;
        case 'PosRequest':
          response = await makerServices.cancelServiceRequest('PosRequest', requestId, token);
          break;
        case 'StatementRequest':
          response = await makerServices.cancelServiceRequest('StatementRequest', requestId, token);
          break;
        case 'StopPaymentOrder':
          response = await makerServices.cancelServiceRequest('StopPaymentOrder', requestId, token);
          break;
        case 'CbeBirrLink':
          response = await makerServices.cancelServiceRequest('CbeBirrLink', requestId, token);
          break;
        case 'RtgsTransfer':
          response = await makerServices.cancelServiceRequest('RtgsTransfer', requestId, token);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      if (response.success) {
        // Refresh the request data
        fetchServiceRequest();
      } else {
        setError(response.message || 'Failed to cancel request');
      }
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      setError(error.message || 'Failed to cancel request');
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to render request details
  const renderRequestDetails = () => {
    if (!request) return null;
    
    console.log('📋 Rendering request details:', request);
    
    // Get all properties except functions and nested objects
    const basicProperties = Object.keys(request).filter(key => 
      typeof request[key] !== 'object' && 
      typeof request[key] !== 'function' &&
      key !== 'id' &&
      key !== '_id' &&
      request[key] !== null &&
      request[key] !== undefined
    );
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {basicProperties.map((key) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
            </h4>
            <p className="mt-1 text-sm text-gray-900 break-words">
              {typeof request[key] === 'boolean' 
                ? request[key] ? 'Yes' : 'No'
                : request[key]?.toString() || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Error</h2>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={fetchServiceRequest}
                className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700"
              >
                Retry
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h2 className="text-lg font-bold text-gray-900">{serviceType} Request</h2>
              <p className="text-sm text-gray-500">ID: {requestId}</p>
              {error && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Using fallback data: {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              request?.status === 'Pending' || request?.status === 'OnQueue' 
                ? 'bg-yellow-100 text-yellow-800' 
                : request?.status === 'In Progress' || request?.status === 'OnProgress'
                  ? 'bg-blue-100 text-blue-800' 
                  : request?.status === 'Completed' || request?.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : request?.status === 'Cancelled' || request?.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
            }`}>
              {request?.status || 'Unknown'}
            </span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Submitted: {request?.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(request?.status === 'Pending' || request?.status === 'OnQueue') && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={updating}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{updating ? 'Approving...' : 'Approve'}</span>
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4" />
                  <span>{updating ? 'Rejecting...' : 'Reject'}</span>
                </button>
              </>
            )}
            {(request?.status === 'Pending' || request?.status === 'OnQueue' || request?.status === 'In Progress') && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
                <span>{updating ? 'Cancelling...' : 'Cancel'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Request Details */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold text-gray-900">Request Details</h3>
          <button
            onClick={fetchServiceRequest}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
        {renderRequestDetails()}
        
        {!request && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No request data available</p>
            <p className="text-sm text-gray-400 mt-1">Unable to load request details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestDetail;