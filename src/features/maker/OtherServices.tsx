import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  DevicePhoneMobileIcon, 
  ReceiptPercentIcon, 
  DocumentDuplicateIcon, 
  HandRaisedIcon, 
  LinkIcon, 
  ArrowsRightLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import otherServicesService from '../../services/otherServicesService';
import type { OtherServicesData } from '../../services/otherServicesService';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  nameid: string;
  unique_name: string;
  BranchId: string;
}

interface Service {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
  endpoint: string;
}

interface OtherServicesProps {
  onServiceClick?: (serviceType: string, endpoint: string) => void;
}

const OtherServices: React.FC<OtherServicesProps> = ({ onServiceClick }) => {
  const [servicesData, setServicesData] = useState<OtherServicesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';
  const decodedToken: JWTPayload | null = token ? jwtDecode<JWTPayload>(token) : null;
  const branchId = decodedToken?.BranchId || '';

  // Fetch services data
  const fetchServicesData = async () => {
    if (!branchId || !token) {
      setError('Missing branch ID or authentication token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await otherServicesService.getAllServicesCounts(branchId, token);
      setServicesData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch services data:', err);
      setError('Failed to load services data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchServicesData();
  }, [branchId, token]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchServicesData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [branchId, token]);

  // Map services data to display format
  const services: Service[] = servicesData
    ? [
        {
          id: 'accountOpening',
          name: 'Account Opening',
          icon: DocumentTextIcon,
          count: servicesData.accountOpening,
          color: 'text-blue-600',
          endpoint: 'AccountOpening'
        },
        {
          id: 'cbeBirrRegistration',
          name: 'CBE Birr Registration',
          icon: CurrencyDollarIcon,
          count: servicesData.cbeBirrRegistration,
          color: 'text-green-600',
          endpoint: 'CbeBirrRegistrations'
        },
        {
          id: 'eBankingApplication',
          name: 'E-Banking Application',
          icon: DevicePhoneMobileIcon,
          count: servicesData.eBankingApplication,
          color: 'text-purple-600',
          endpoint: 'EBankingApplication'
        },
        {
          id: 'posRequest',
          name: 'POS Request',
          icon: ReceiptPercentIcon,
          count: servicesData.posRequest,
          color: 'text-indigo-600',
          endpoint: 'PosRequest'
        },
        {
          id: 'statementRequest',
          name: 'Statement Request',
          icon: DocumentDuplicateIcon,
          count: servicesData.statementRequest,
          color: 'text-orange-600',
          endpoint: 'StatementRequest'
        },
        {
          id: 'stopPayment',
          name: 'Stop Payment',
          icon: HandRaisedIcon,
          count: servicesData.stopPayment,
          color: 'text-red-600',
          endpoint: 'StopPaymentOrder'
        },
        {
          id: 'cbeBirrLink',
          name: 'CBE Birr Link',
          icon: LinkIcon,
          count: servicesData.cbeBirrLink,
          color: 'text-teal-600',
          endpoint: 'CbeBirrLink'
        },
        {
          id: 'rtgsTransfer',
          name: 'RTGS Transfer',
          icon: ArrowsRightLeftIcon,
          count: servicesData.rtgsTransfer,
          color: 'text-pink-600',
          endpoint: 'RtgsTransfer'
        },
      ]
    : [];

  // Loading skeleton
  if (loading && !servicesData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !servicesData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Other Services</h3>
          <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            Error
          </span>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchServicesData}
            className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors shadow-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalCount = servicesData?.total || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
          <h3 className="text-lg font-bold text-gray-900">Other Services</h3>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          totalCount > 0 
            ? 'bg-fuchsia-700 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {totalCount}
        </span>
      </div>

      {/* Services List */}
      <div className="space-y-2">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No service data available</p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              onClick={() => onServiceClick?.(service.name, service.endpoint)}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-fuchsia-50 transition-colors border border-gray-200`}>
                  <service.icon className={`w-5 h-5 ${service.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {service.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  service.count > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {service.count}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh indicator */}
      {loading && servicesData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 border-2 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherServices;