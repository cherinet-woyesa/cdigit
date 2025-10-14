import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import makerService from "../../services/makerService";
import type { Metric } from "../../components/dashboard/DashboardMetrics";

export const useMakerDashboard = (activeSection: string, assignedWindow: WindowDto | null) => {
    const { token, logout } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState(activeSection);
    const [dashboardMetrics, setDashboardMetrics] = useState<Metric[]>([]);
    const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
    const [isWindowModalOpen, setWindowModalOpen] = useState(false);
    const [currentAssignedWindow, setAssignedWindow] = useState<WindowDto | null>(assignedWindow);

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

    useEffect(() => {
        const fetchAssignedWindow = async () => {
            if (!decodedToken?.nameid || !token) return;

            try {
                const window = await makerService.getAssignedWindowForMaker(decodedToken.nameid, token);
                if (window) {
                    setAssignedWindow(window);
                } else {
                    setActionMessage({
                        type: 'warning',
                        content: 'No window assigned. Please select a window to start serving customers.'
                    });
                }
            } catch (error: any) {
                setActionMessage({
                    type: 'error',
                    content: `Failed to load assigned window: ${error.response?.data?.message || error.message || 'Please try again.'}`
                });
            }
        };

        fetchAssignedWindow();
    }, [decodedToken?.nameid, token]);

    useEffect(() => {
        const loadMetrics = async () => {
            if (!decodedToken || !token) return;

            try {
                if (!decodedToken.BranchId) {
                    setActionMessage({
                        type: 'error',
                        content: 'Branch information missing. Please contact administrator.'
                    });
                    return;
                }
                
                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!guidRegex.test(decodedToken.BranchId)) {
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
                        icon: "CurrencyDollarIcon",
                        trend: "up"
                    },
                    {
                        label: "Completed Today",
                        value: completedToday,
                        color: "green",
                        icon: "ClockIcon",
                        trend: "up"
                    },
                    {
                        label: "Avg. Process Time",
                        value: "4.2m",
                        color: "blue",
                        icon: "ArrowPathIcon",
                        trend: "down"
                    },
                    {
                        label: "Queue Waiting",
                        value: pendingTransactions,
                        color: "orange",
                        icon: "UserCircleIcon",
                        trend: "neutral"
                    }
                ];
                setDashboardMetrics(metrics);
            } catch (error: any) {
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
    }, [decodedToken, token, showError, setActionMessage, setDashboardMetrics]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSectionChange = useCallback((sectionId: string) => {
        setCurrentSection(sectionId);
    }, []);

    const handleWindowChange = useCallback(() => {
        setWindowModalOpen(true);
    }, []);

    const handleSelectWindow = async (selectedWindow: WindowDto) => {
        if (!decodedToken?.nameid || !token) return;

        try {
            const response = await makerService.changeMakerToWindow(selectedWindow.id, decodedToken.nameid, token);
            
            if (response.success) {
                setAssignedWindow(selectedWindow);
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
        } catch (error: any) {
            setActionMessage({
                type: 'error',
                content: `Failed to change window: ${error.response?.data?.message || error.message || 'Please try again.'}`
            });
            showError('Window Assignment Error', `Failed to change window: ${error.response?.data?.message || error.message || 'Please try again.'}`);
        }
    };

    const handleServiceClick = useCallback((serviceType: string) => {
        setActionMessage({
            type: 'info',
            content: `Opening ${serviceType}...`
        });
    }, []);

    return {
        actionMessage,
        isLoading,
        currentSection,
        dashboardMetrics,
        isWindowModalOpen,
        currentAssignedWindow,
        decodedToken,
        handleSectionChange,
        handleWindowChange,
        handleSelectWindow,
        handleServiceClick,
        setActionMessage,
        setWindowModalOpen
    };
};