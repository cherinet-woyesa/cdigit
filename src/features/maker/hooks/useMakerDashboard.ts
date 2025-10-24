import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../../context/AuthContext";
import { useNotification } from "../../../context/NotificationContext";
import makerService from "../../../services/makerService";
import type { 
  DecodedToken, 
  DashboardState, 
  WindowDto,
  Metric 
} from "../types";
import type { ActionMessage } from "../types/maker.types";

export const useMakerDashboard = (initialSection?: string, initialWindow?: WindowDto | null) => {
  const { token, logout } = useAuth();
  const { showError, showSuccess, showWarning } = useNotification();
  
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    actionMessage: null,
    currentSection: initialSection || "transactions",
    assignedWindow: initialWindow || null,
    dashboardMetrics: [],
    branchName: ""
  });

  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isWindowModalOpen, setWindowModalOpen] = useState(false);
  const [shouldShowWindowModal, setShouldShowWindowModal] = useState(false);
  const [serviceRequestParams, setServiceRequestParams] = useState<{endpoint: string, requestId: string} | null>(null);

  // Token decoding
  useEffect(() => {
    if (!token) {
      logout();
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setDecodedToken(decoded);
    } catch (error) {
      setActionMessage({
        type: 'error',
        content: 'Authentication error. Please login again.'
      });
      setTimeout(() => logout(), 2000);
    }
  }, [token, logout]);

  // Hash-based routing for service requests
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/maker/service-request/')) {
        const parts = hash.substring(24).split('/');
        if (parts.length >= 2) {
          setServiceRequestParams({
            endpoint: parts[0],
            requestId: parts[1]
          });
          setCurrentSection("service-request-detail");
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Fetch branch info
  useEffect(() => {
    const fetchBranch = async () => {
      if (!token || !decodedToken?.BranchId) return;
      try {
        const res = await makerService.getBranchById(decodedToken.BranchId, token);
        if (res.success && res.data?.name) {
          setState(prev => ({ ...prev, branchName: res.data.name }));
        } else {
          setState(prev => ({ ...prev, branchName: "Unknown Branch" }));
        }
      } catch (err) {
        console.error("Failed to fetch branch:", err);
        setState(prev => ({ ...prev, branchName: "Error loading branch" }));
      }
    };

    if (decodedToken?.BranchId) {
      fetchBranch();
    }
  }, [decodedToken?.BranchId, token]);

  // Fetch assigned window
  useEffect(() => {
    const fetchAssignedWindow = async () => {
      if (!decodedToken?.nameid || !token) return;

      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const window = await makerService.getAssignedWindowForMaker(decodedToken.nameid, token);
        if (window) {
          setState(prev => ({ ...prev, assignedWindow: window }));
          console.log('Assigned window loaded:', window);
        } else {
          console.log('No window assigned to this maker');
          setShouldShowWindowModal(true);
          setActionMessage({
            type: 'warning',
            content: 'No window assigned. Please select a window to start serving customers.'
          });
        }
      } catch (error) {
        console.error('Failed to fetch assigned window:', error);
        setShouldShowWindowModal(true);
        setActionMessage({
          type: 'error',
          content: 'Failed to load assigned window. Please select a window manually.'
        });
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (decodedToken?.nameid) {
      fetchAssignedWindow();
    }
  }, [decodedToken?.nameid, token]);

  // Fetch dashboard metrics
  useEffect(() => {
    const loadMetrics = async () => {
      if (!decodedToken || !token) return;

      try {
        console.log('Loading metrics for branch:', decodedToken.BranchId);

        if (!decodedToken.BranchId) {
          console.error('BranchId is missing from decoded token');
          setActionMessage({
            type: 'error',
            content: 'Branch information missing. Please contact administrator.'
          });
          return;
        }

        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(decodedToken.BranchId)) {
          console.warn('BranchId is not in valid GUID format:', decodedToken.BranchId);
          setActionMessage({
            type: 'error',
            content: 'Invalid branch information format. Please contact administrator.'
          });
          return;
        }

        const queueResponse = await makerService.getAllCustomersOnQueueByBranch(decodedToken.BranchId, token);
        const servedResponse = await makerService.getTotalServed(decodedToken.nameid, token);

        const pendingTransactions = (queueResponse.success || (queueResponse.message && queueResponse.message.includes('No customers in queue')))
          ? (queueResponse.data?.length || 0)
          : 0;

        const completedToday = servedResponse.data || 0;

        const metrics: Metric[] = [
          {
            label: "Pending Transactions",
            value: pendingTransactions,
            color: "fuchsia",
            icon: "💰", // Will be replaced with proper icons
            trend: "up"
          },
          {
            label: "Completed Today",
            value: completedToday,
            color: "green",
            icon: "⏱️",
            trend: "up"
          },
          {
            label: "Avg. Process Time",
            value: "4.2m",
            color: "blue",
            icon: "🔄",
            trend: "down"
          },
          {
            label: "Queue Waiting",
            value: pendingTransactions,
            color: "orange",
            icon: "👤",
            trend: "neutral"
          }
        ];
        
        setState(prev => ({ ...prev, dashboardMetrics: metrics }));
      } catch (error: any) {
        console.error("Failed to load dashboard metrics:", error);
        
        let errorMessage = 'Failed to load dashboard metrics. Please check your connection.';
        if (error.response?.status === 404) {
          errorMessage = 'Branch not found. Please check your branch assignment.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        setActionMessage({
          type: 'error',
          content: errorMessage
        });
        showError('Dashboard Error', errorMessage);
      }
    };

    loadMetrics();
  }, [decodedToken, token, showError]);

  // Auto-close loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Show window modal when needed
  useEffect(() => {
    if (shouldShowWindowModal) {
      setWindowModalOpen(true);
      setShouldShowWindowModal(false);
    }
  }, [shouldShowWindowModal]);

  // Action methods
  const setActionMessage = useCallback((message: ActionMessage | null) => {
    setState(prev => ({ ...prev, actionMessage: message }));
  }, []);

  const setCurrentSection = useCallback((sectionId: string) => {
    setState(prev => ({ ...prev, currentSection: sectionId }));
  }, []);

  const handleSectionChange = useCallback((sectionId: string) => {
    if (sectionId !== "service-request-detail") {
      setServiceRequestParams(null);
    }
    setCurrentSection(sectionId);
  }, [setCurrentSection]);

  const handleWindowChange = useCallback(() => {
    setWindowModalOpen(true);
  }, []);

  const handleSelectWindow = async (selectedWindow: WindowDto) => {
    if (!decodedToken?.nameid || !token) return;

    try {
      const response = await makerService.changeMakerToWindow(selectedWindow.id, decodedToken.nameid, token);

      if (response.success) {
        setState(prev => ({ ...prev, assignedWindow: selectedWindow }));
        setWindowModalOpen(false);
        setActionMessage({
          type: 'success',
          content: response.message || `Successfully changed to Window #${selectedWindow.windowNumber}.`
        });
        showSuccess('Window Assignment', response.message || `Successfully changed to Window #${selectedWindow.windowNumber}.`);
      } else {
        setActionMessage({
          type: 'error',
          content: response.message || 'Failed to change window.'
        });
        showError('Window Assignment Error', response.message || 'Failed to change window.');
      }
    } catch (error) {
      console.error('Error changing window:', error);
      setActionMessage({
        type: 'error',
        content: 'Failed to change window. Please try again.'
      });
      showError('Window Assignment Error', 'Failed to change window. Please try again.');
    }
  };

  return {
    // State
    ...state,
    decodedToken,
    isWindowModalOpen,
    serviceRequestParams,
    
    // Actions
    setActionMessage,
    setCurrentSection,
    handleSectionChange,
    handleWindowChange,
    handleSelectWindow,
    setWindowModalOpen
  };
};