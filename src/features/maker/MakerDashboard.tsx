import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import makerService from "../../services/makerService";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";
import OtherServices from "./OtherServices";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import MainLayout from "../../components/layout/MainLayout";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import WindowChangeModal from "../../components/modals/WindowChangeModal";
import { 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowPathIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
};

const MakerDashboardContent: React.FC<Props> = ({ 
    activeSection = "transactions",
    assignedWindow = null
}) => {
    const { token, logout } = useAuth();
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

    // Fetch assigned window on component mount
    useEffect(() => {
        const fetchAssignedWindow = async () => {
            if (!decodedToken?.nameid || !token) return;

            try {
                const window = await makerService.getAssignedWindowForMaker(decodedToken.nameid, token);
                if (window) {
                    setAssignedWindow(window);
                    console.log('Assigned window loaded:', window);
                } else {
                    console.log('No window assigned to this maker');
                    setActionMessage({
                        type: 'warning',
                        content: 'No window assigned. Please select a window to start serving customers.'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch assigned window:', error);
                setActionMessage({
                    type: 'error',
                    content: 'Failed to load assigned window.'
                });
            }
        };

        fetchAssignedWindow();
    }, [decodedToken?.nameid, token]);

    useEffect(() => {
        const loadMetrics = async () => {
            if (!decodedToken || !token) return;

            try {
                const queueResponse = await makerService.getAllCustomersOnQueueByBranch(decodedToken.BranchId, token);
                const servedResponse = await makerService.getTotalServed(decodedToken.nameid, token);

                const pendingTransactions = queueResponse.data?.length || 0;
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
                        value: "4.2m", // Still mock data
                        color: "blue",
                        icon: <ArrowPathIcon className="h-4 w-4" />,
                        trend: "down"
                    },
                    {
                        label: "Queue Waiting",
                        value: pendingTransactions, // Same as pending for now
                        color: "orange",
                        icon: <UserCircleIcon className="h-4 w-4" />,
                        trend: "neutral"
                    }
                ];
                setDashboardMetrics(metrics);
            } catch (error) {
                console.error("Failed to load dashboard metrics:", error);
                // Optionally set an error message
            }
        };

        loadMetrics();
    }, [decodedToken, token]);

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
            // Update window assignment on backend
            const response = await makerService.changeMakerToWindow(selectedWindow.id, decodedToken.nameid, token);
            
            if (response.success) {
                setAssignedWindow(selectedWindow);
                setWindowModalOpen(false);
                setActionMessage({
                    type: 'success',
                    content: response.message || `Successfully changed to Window #${selectedWindow.windowNumber}.`
                });
            } else {
                setActionMessage({
                    type: 'error',
                    content: response.message || 'Failed to change window.'
                });
            }
        } catch (error) {
            console.error('Error changing window:', error);
            setActionMessage({
                type: 'error',
                content: 'Failed to change window. Please try again.'
            });
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
            <div className="p-6">
                {/* Action Message */}
                {actionMessage && (
                    <div className={`rounded-lg p-3 border-l-4 mb-6 ${
                        actionMessage.type === 'success' 
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : actionMessage.type === 'error'
                            ? 'bg-red-50 border-red-400 text-red-700'
                            : actionMessage.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                            : 'bg-blue-50 border-blue-400 text-blue-700'
                    }`}>
                        <div className="flex items-center">
                            <div className="ml-3">
                                <p className="text-sm font-medium">{actionMessage.content}</p>
                            </div>
                            <button
                                onClick={() => setActionMessage(null)}
                                className="ml-auto p-1 hover:bg-black/10 rounded-full"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Window Assignment Alert */}
                {!currentAssignedWindow && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 rounded-lg p-4 mb-6 shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-bold text-orange-800">No Window Assigned</h3>
                                <p className="text-sm text-orange-700 mt-1">You need to select a window before you can serve customers.</p>
                                <button
                                    onClick={handleWindowChange}
                                    className="mt-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
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
                {currentSection === "other" && <OtherServices onServiceClick={handleServiceClick} />}
                {currentSection === "performance" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">My Performance</h2>
                        <p className="text-gray-600">Performance metrics and analytics coming soon...</p>
                    </div>
                )}
                {currentSection === "settings" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Settings</h2>
                        <p className="text-gray-600">Configuration and preferences coming soon...</p>
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