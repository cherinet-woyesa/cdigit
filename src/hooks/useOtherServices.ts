import { useState, useEffect, useCallback } from 'react';
import otherServicesService from '@services/otherServicesService';
import type { OtherServicesData } from '@services/otherServicesService';
import { jwtDecode } from 'jwt-decode';

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

  useEffect(() => {
    fetchServicesData();
  }, [fetchServicesData]);

  useEffect(() => {
    const intervalId = setInterval(fetchServicesData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchServicesData]);

  return { servicesData, loading, error, fetchServicesData };
};
