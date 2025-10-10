import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";
import OtherServices from "./OtherServices";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import MainLayout from "../../components/layout/MainLayout";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
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

    useEffect(() => {
        if (!token) {
            logout();
            return;
        }
        
        try {
            jwtDecode<DecodedToken>(token);
        } catch (error) {
            setActionMessage({
                type: 'error',
                content: 'Authentication error. Please login again.'
            });
            setTimeout(() => logout(), 2000);
        }
    }, [token, logout]);

    useEffect(() => {
        const loadMetrics = async () => {
            const metrics: Metric[] = [
                {
                    label: "Pending Transactions",
                    value: 12,
                    color: "fuchsia",
                    icon: <CurrencyDollarIcon className="h-4 w-4" />,
                    trend: "up"
                },
                {
                    label: "Completed Today",
                    value: 8,
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
                    value: 5,
                    color: "orange",
                    icon: <UserCircleIcon className="h-4 w-4" />,
                    trend: "neutral"
                }
            ];
            setDashboardMetrics(metrics);
        };

        loadMetrics();
    }, []);

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
        setActionMessage({
            type: 'info',
            content: 'Window change feature coming soon...'
        });
    }, []);

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

                {/* Section Content */}
                {currentSection === "transactions" && dashboardMetrics.length > 0 && (
                    <div className="space-y-6">
                        <DashboardMetrics metrics={dashboardMetrics} />
                        <Transactions 
                            assignedWindow={assignedWindow} 
                            activeSection={currentSection}
                        />
                    </div>
                )}

                {currentSection === "transactions" && dashboardMetrics.length === 0 && (
                    <Transactions 
                        assignedWindow={assignedWindow} 
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
            assignedWindow={assignedWindow}
            onWindowChange={handleWindowChange}
        >
            {renderContent()}
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