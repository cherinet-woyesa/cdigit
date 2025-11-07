import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import otherServicesService from '@services/otherServicesService';
import type { OtherServicesData, Service } from '@features/maker/types';

interface JWTPayload {
  nameid: string;
  unique_name: string;
  BranchId: string;
}

export const useOtherServices = () => {
  const [servicesData, setServicesData] = useState<OtherServicesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';
  const decodedToken: JWTPayload | null = token ? jwtDecode<JWTPayload>(token) : null;
  const branchId = decodedToken?.BranchId || '';

  const fetchServicesData = useCallback(async () => {
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
  }, [branchId, token]);

  // Initial fetch on mount
  useEffect(() => {
    fetchServicesData();
  }, [fetchServicesData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchServicesData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchServicesData]);

  // Map services data to display format
  const services: Service[] = servicesData ? [
    {
      id: 'accountOpening',
      name: 'Account Opening',
      icon: 'DocumentTextIcon',
      count: servicesData.accountOpening,
      color: 'text-blue-600',
      endpoint: 'AccountOpening'
    },
    {
      id: 'cbeBirrRegistration',
      name: 'CBE Birr Registration',
      icon: 'CurrencyDollarIcon',
      count: servicesData.cbeBirrRegistration,
      color: 'text-green-600',
      endpoint: 'CbeBirrRegistrations'
    },
    {
      id: 'eBankingApplication',
      name: 'E-Banking Application',
      icon: 'DevicePhoneMobileIcon',
      count: servicesData.eBankingApplication,
      color: 'text-purple-600',
      endpoint: 'EBankingApplication'
    },
    {
      id: 'posRequest',
      name: 'POS Request',
      icon: 'ReceiptPercentIcon',
      count: servicesData.posRequest,
      color: 'text-indigo-600',
      endpoint: 'PosRequest'
    },
    {
      id: 'statementRequest',
      name: 'Statement Request',
      icon: 'DocumentDuplicateIcon',
      count: servicesData.statementRequest,
      color: 'text-orange-600',
      endpoint: 'StatementRequest'
    },
    {
      id: 'stopPayment',
      name: 'Stop Payment',
      icon: 'HandRaisedIcon',
      count: servicesData.stopPayment,
      color: 'text-red-600',
      endpoint: 'StopPaymentOrder'
    },
    {
      id: 'cbeBirrLink',
      name: 'CBE Birr Link',
      icon: 'LinkIcon',
      count: servicesData.cbeBirrLink,
      color: 'text-teal-600',
      endpoint: 'CbeBirrLink'
    },
    {
      id: 'rtgsTransfer',
      name: 'RTGS Transfer',
      icon: 'ArrowsRightLeftIcon',
      count: servicesData.rtgsTransfer,
      color: 'text-pink-600',
      endpoint: 'RtgsTransfer'
    },
  ] : [];

  const totalCount = servicesData?.total || 0;

  return {
    services,
    totalCount,
    loading,
    error,
    fetchServicesData,
    servicesData
  };
};