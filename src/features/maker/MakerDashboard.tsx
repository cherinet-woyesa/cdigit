import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import makerService from "../../services/makerService";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";
import OtherServices from "./OtherServices";
import ServiceDetailPanel from "./ServiceDetailPanel";
import ServiceRequestDetailPanel from "./ServiceRequestDetailPanel";
import VoucherDashboard from "./VoucherDashboard";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import MainLayout from "./MakerLayout";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import WindowChangeModal from "../../components/modals/WindowChangeModal";
import {
    CurrencyDollarIcon,
    ClockIcon,
    ArrowPathIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import MakerPerformance from "./MakerPerformance";

type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
};

const MakerDashboardContent: React.FC<Props> = ({
    activeSection = "transactions",
    assignedWindow = null
}) => {
    const { token, logout } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState(activeSection);
    const [dashboardMetrics, setDashboardMetrics] = useState<Metric[]>([]);
    const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
    const [isWindowModalOpen, setWindowModalOpen] = useState(false);
    const [currentAssignedWindow, setAssignedWindow] = useState<WindowDto | null>(assignedWindow);
    const [shouldShowWindowModal, setShouldShowWindowModal] = useState(false);
    const [branchName, setBranchName] = useState<string>("");
    const [serviceRequestParams, setServiceRequestParams] = useState<{endpoint: string, requestId: string} | null>(null);

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

    // Handle hash-based routing for service requests
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

        // Check initial hash
        handleHashChange();
        
        // Listen for hash changes
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
                    setBranchName(res.data.name);
                } else {
                    setBranchName("Unknown Branch");
                }
            } catch (err) {
                console.error("Failed to fetch branch:", err);
                setBranchName("Error loading branch");
            }
        };

        if (decodedToken?.BranchId) {
            fetchBranch();
        }
    }, [decodedToken?.BranchId, token]);

    // Fetch assigned window on component mount - BLOCKING
    useEffect(() => {
        const fetchAssignedWindow = async () => {
            if (!decodedToken?.nameid || !token) return;

            try {
                setIsLoading(true);
                const window = await makerService.getAssignedWindowForMaker(decodedToken.nameid, token);
                if (window) {
                    setAssignedWindow(window);
                    console.log('Assigned window loaded:', window);
                } else {
                    console.log('No window assigned to this maker');
                    // Set flag to show window modal immediately after login
                    setShouldShowWindowModal(true);
                    setActionMessage({
                        type: 'warning',
                        content: 'No window assigned. Please select a window to start serving customers.'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch assigned window:', error);
                // Set flag to show window modal even if fetch fails
                setShouldShowWindowModal(true);
                setActionMessage({
                    type: 'error',
                    content: 'Failed to load assigned window. Please select a window manually.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (decodedToken?.nameid) {
            fetchAssignedWindow();
        }
    }, [decodedToken?.nameid, token]);

    useEffect(() => {
        const loadMetrics = async () => {
            if (!decodedToken || !token) return;

            try {
                console.log('Loading metrics for branch:', decodedToken.BranchId);

                // Validate branchId before making the call
                if (!decodedToken.BranchId) {
                    console.error('BranchId is missing from decoded token');
                    setActionMessage({
                        type: 'error',
                        content: 'Branch information missing. Please contact administrator.'
                    });
                    return;
                }

                // Validate that branchId is a valid GUID format
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

                console.log('Queue response:', queueResponse);
                console.log('Served response:', servedResponse);

                // Handle both success and "no customers" cases
                const pendingTransactions = (queueResponse.success || (queueResponse.message && queueResponse.message.includes('No customers in queue')))
                    ? (queueResponse.data?.length || 0)
                    : 0;

                const completedToday = servedResponse.data || 0;

                const metrics: Metric[] = [
                    {
                        label: "Pending Transactions",
                        value: pendingTransactions,
                        color: "fuchsia",
                        icon: <CurrencyDollarIcon className="h-4 w-4" />,
                        trend: "up"
                    },
                    {
                        label: "Completed Today",
                        value: completedToday,
                        color: "green",
                        icon: <ClockIcon className="h-4 w-4" />,
                        trend: "up"
                    },
                    {
                        label: "Avg. Process Time",
                        value: "4.2m",
                        color: "blue",
                        icon: <ArrowPathIcon className="h-4 w-4" />,
                        trend: "down"
                    },
                    {
                        label: "Queue Waiting",
                        value: pendingTransactions,
                        color: "orange",
                        icon: <UserCircleIcon className="h-4 w-4" />,
                        trend: "neutral"
                    }
                ];
                setDashboardMetrics(metrics);
            } catch (error: any) {
                console.error("Failed to load dashboard metrics:", error);
                console.error("Error details:", {
                    message: error.message,
                    response: error.response,
                    status: error.response?.status,
                    branchId: decodedToken?.BranchId
                });

                // More specific error messages based on error type
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

                // Also show global notification
                showError('Dashboard Error', errorMessage);
            }
        };

        loadMetrics();
    }, [decodedToken, token, showError]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    // Effect to open window modal immediately after login when no window is assigned
    useEffect(() => {
        if (shouldShowWindowModal) {
            setWindowModalOpen(true);
            setShouldShowWindowModal(false); // Reset the flag
        }
    }, [shouldShowWindowModal]);

    const handleSectionChange = useCallback((sectionId: string) => {
        // Reset service request params when changing sections
        if (sectionId !== "service-request-detail") {
            setServiceRequestParams(null);
        }
        setCurrentSection(sectionId);
    }, []);

    const handleWindowChange = useCallback(() => {
        setWindowModalOpen(true);
    }, []);

    const handleSelectWindow = async (selectedWindow: WindowDto) => {
        if (!decodedToken?.nameid || !token) return;

        try {
            // Update window assignment on backend
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
        } catch (error) {
            console.error('Error changing window:', error);
            setActionMessage({
                type: 'error',
                content: 'Failed to change window. Please try again.'
            });
            showError('Window Assignment Error', 'Failed to change window. Please try again.');
        }
    };

    const handleServiceClick = useCallback((serviceType: string) => {
        setActionMessage({
            type: 'info',
            content: `Opening ${serviceType}...`
        });
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
                    <p className="mt-4 text-fuchsia-700 font-medium">Loading Maker Dashboard...</p>
                </div>
            </div>
        );
    }

    // Render ONLY the content - no layout elements
    const renderContent = () => {
        return (
            <div className="p-6 bg-gray-50">
                {/* Action Message */}
                {actionMessage && (
                    <div className={`rounded-lg p-4 mb-6 border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${actionMessage.type === 'success'
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : actionMessage.type === 'error'
                                ? 'bg-red-50 border-red-500 text-red-800'
                                : actionMessage.type === 'warning'
                                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                                    : 'bg-blue-50 border-blue-500 text-blue-800'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {actionMessage.type === 'success' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {actionMessage.type === 'error' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {actionMessage.type === 'warning' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {actionMessage.type === 'info' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <p className="text-sm font-medium">{actionMessage.content}</p>
                            </div>
                            <button
                                onClick={() => setActionMessage(null)}
                                className="flex-shrink-0 ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Window Assignment Alert */}
                {!currentAssignedWindow && !isWindowModalOpen && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-amber-900 mb-1">No Window Assigned</h3>
                                <p className="text-sm text-amber-800 mb-4">You need to select a window before you can serve customers.</p>
                                <button
                                    onClick={handleWindowChange}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    Select Window Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Content */}
                {currentSection === "transactions" && dashboardMetrics.length > 0 && (
                    <div className="space-y-6">
                        <DashboardMetrics metrics={dashboardMetrics} />
                        <Transactions
                            assignedWindow={currentAssignedWindow}
                            activeSection={currentSection}
                        />
                    </div>
                )}

                {currentSection === "transactions" && dashboardMetrics.length === 0 && (
                    <Transactions
                        assignedWindow={currentAssignedWindow}
                        activeSection={currentSection}
                    />
                )}

                {currentSection === "petty" && <PettyCash />}
                {currentSection === "other" && <OtherServices onServiceClick={(serviceType, endpoint) => {
                  // Store the selected service in localStorage for the service detail component
                  localStorage.setItem('selectedServiceType', serviceType);
                  localStorage.setItem('selectedServiceEndpoint', endpoint);
                  // Navigate to the service detail section
                  setCurrentSection("service-detail");
                }} />}
                {currentSection === "service-detail" && <ServiceDetailPanel onBack={() => setCurrentSection("other")} />}
                {currentSection === "service-request-detail" && serviceRequestParams && (
                    <ServiceRequestDetailPanel 
                        endpoint={serviceRequestParams.endpoint}
                        requestId={serviceRequestParams.requestId}
                    />
                )}
                {currentSection === "vouchers" && <VoucherDashboard />}


                {currentSection === "performance" && (
                    <MakerPerformance makerId={decodedToken?.nameid!} branchId={decodedToken?.BranchId!} />
                )}
                {/* {currentSection === "performance" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-fuchsia-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="h-8 w-8 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">My Performance</h2>
                            <p className="text-gray-600">Performance metrics and analytics coming soon...</p>
                        </div>
                    </div>
                )} */}
                {currentSection === "settings" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Settings</h2>
                            <p className="text-gray-600">Configuration and preferences coming soon...</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout
            activeSection={currentSection}
            onSectionChange={handleSectionChange}
            assignedWindow={currentAssignedWindow}
            onWindowChange={handleWindowChange}
            branchName={branchName}
            decoded={decodedToken}
            actionMessage={actionMessage}
        >
            {renderContent()}
            <WindowChangeModal
                isOpen={isWindowModalOpen}
                onClose={() => setWindowModalOpen(false)}
                onSelectWindow={handleSelectWindow}
                branchId={decodedToken?.BranchId || null}
            />
        </MainLayout>
    );
};

const MakerDashboard: React.FC<Props> = (props) => {
    return (
        <DashboardErrorBoundary>
            <MakerDashboardContent {...props} />
        </DashboardErrorBoundary>
    );
};

export default MakerDashboard;