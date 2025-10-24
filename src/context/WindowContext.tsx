import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import makerService, { type WindowDto } from '../services/makerService';
import type { DecodedToken } from "../types/DecodedToken";
import { jwtDecode } from 'jwt-decode';

interface WindowContextType {
  assignedWindow: WindowDto | null;
  isLoading: boolean;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const WindowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [assignedWindow, setAssignedWindow] = useState<WindowDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);

  useEffect(() => {
    if (token) {
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
        } catch (error) {
            console.error('Failed to decode token', error);
        }
    }
  }, [token]);

  useEffect(() => {
    const fetchWindow = async () => {
      if (token && decoded?.nameid) {
        try {
          const window = await makerService.getAssignedWindowForMaker(decoded.nameid, token);
          setAssignedWindow(window);
        } catch (error) {
          console.error('Failed to fetch assigned window', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWindow();
  }, [token, decoded?.nameid]);

  return (
    <WindowContext.Provider value={{ assignedWindow, isLoading }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindow = () => {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error('useWindow must be used within a WindowProvider');
  }
  return context;
};