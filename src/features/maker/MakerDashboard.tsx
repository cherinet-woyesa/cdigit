import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";
import { 
  CurrencyDollarIcon, 
  ClockIcon,
  CogIcon,
  UserCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import { BRAND_COLORS } from "../../config/env";

type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
};

// Enhanced navigation tabs with proper typing
interface Tab {
    id: string;
    name: string;
    icon: React.ElementType;
    badgeCount?: number;
}

const MakerDashboardContent: React.FC<Props> = ({ 
    activeSection = "transactions",
    assignedWindow = null
}) => {
    const { token, logout, user } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardMetrics, setDashboardMetrics] = useState<Metric[]>([]);

    // Enhanced navigation tabs with metrics
    const tabs: Tab[] = [
        { id: "transactions", name: "Transactions", icon: CurrencyDollarIcon, badgeCount: 12 },
        { id: "petty", name: "Petty Cash", icon: CogIcon, badgeCount: 3 },
        { id: "other", name: "Other Services", icon: ClockIcon, badgeCount: 5 },
    ];

    const [currentSection, setCurrentSection] = useState(activeSection);
    const [sectionLoading, setSectionLoading] = useState(false);

    /** Secure token decoding with error handling */
    useEffect(() => {
        if (!token) {
            logout();
            return;
        }
        
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
            console.log('MakerDashboard: Token decoded successfully', d);
        } catch (error) {
            console.error('MakerDashboard: Failed to decode token', error);
            setActionMessage({
                type: 'error',
                content: 'Authentication error. Please login again.'
            });
            setTimeout(() => logout(), 2000);
        }
    }, [token, logout]);

    /** Load dashboard metrics */
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                // Simulated API call - replace with actual endpoint
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
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        };

        loadMetrics();
    }, []);

    /** Simulate loading completion */
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    /** Handle section changes with loading states */
    const handleSectionChange = useCallback((sectionId: string) => {
        setSectionLoading(true);
        setCurrentSection(sectionId);
        
        // Simulate section loading
        setTimeout(() => {
            setSectionLoading(false);
        }, 300);
    }, []);

    /** Handle service clicks in Other Services */
    const handleServiceClick = useCallback((serviceType: string) => {
        setActionMessage({
            type: 'info',
            content: `Opening ${serviceType}...`
        });
        
        // TODO: Implement actual service navigation
        console.log(`Service clicked: ${serviceType}`);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
                    <p className="mt-4 text-fuchsia-700 font-medium">Loading Maker Dashboard...</p>
                    <p className="text-sm text-gray-500 mt-2">Preparing your workspace</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Header */}
            <header className="bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Left Side - Brand & Welcome */}
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <CurrencyDollarIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Maker Dashboard</h1>
                                <p className="text-fuchsia-100 text-xs">
                                    Welcome, {user?.firstName || decoded?.unique_name || 'Maker'}
                                    {assignedWindow && ` • Window #${assignedWindow.windowNumber}`}
                                </p>
                            </div>
                        </div>
                        
                        {/* Right Side - User Info & Status */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-fuchsia-100 text-sm">
                                    <UserCircleIcon className="h-4 w-4" />
                                    <span className="font-semibold">Role: Maker</span>
                                </div>
                                <div className="text-xs text-fuchsia-200 mt-1">
                                    Branch: {decoded?.BranchId || 'N/A'}
                                </div>
                            </div>
                            
                            {assignedWindow && (
                                <div className="bg-white/20 px-3 py-1.5 rounded-md">
                                    <div className="text-xs text-fuchsia-200">Active Window</div>
                                    <div className="font-bold text-white text-sm">#{assignedWindow.windowNumber}</div>
                                </div>
                            )}

                            {/* Connection Status */}
                            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-md">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-100 text-xs font-medium">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Metrics */}
            {currentSection === "transactions" && dashboardMetrics.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
                    <DashboardMetrics metrics={dashboardMetrics} />
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="bg-gray-100 border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
                    <div className="flex space-x-2 p-1 bg-gray-200/50 rounded-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleSectionChange(tab.id)}
                                disabled={sectionLoading}
                                className={`w-full flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 disabled:opacity-50 ${
                                    currentSection === tab.id
                                        ? 'bg-white text-fuchsia-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
                                }`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.name}
                                {tab.badgeCount && tab.badgeCount > 0 && (
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                        currentSection === tab.id ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-300 text-gray-700'
                                    }`}>
                                        {tab.badgeCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Global Action Message */}
                {actionMessage && (
                    <div className={`rounded-lg p-3 border-l-4 ${
                        actionMessage.type === 'success' 
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : actionMessage.type === 'error'
                            ? 'bg-red-50 border-red-400 text-red-700'
                            : 'bg-blue-50 border-blue-400 text-blue-700'
                    }`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {actionMessage.type === 'success' ? (
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : actionMessage.type === 'error' ? (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                ) : (
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{actionMessage.content}</p>
                            </div>
                            <button
                                onClick={() => setActionMessage(null)}
                                className="ml-auto p-1 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Section Loading State */}
                {sectionLoading && (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
                        <span className="ml-3 text-gray-600">Loading {tabs.find(t => t.id === currentSection)?.name}...</span>
                    </div>
                )}

                {/* Section Content */}
                {!sectionLoading && (
                    <>
                        {currentSection === "transactions" && (
                            <Transactions 
                                assignedWindow={assignedWindow} 
                                activeSection={currentSection}
                            />
                        )}

                        {currentSection === "other" && (
                            <section className="animate-fadeIn">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Other Services</h3>
                                        <div className="text-xs text-gray-500">
                                            {dashboardMetrics.find(m => m.label === "Queue Waiting")?.value} requests waiting
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {[
                                            { title: "Account Opening", description: "Process new account applications", color: "fuchsia", icon: "📋", count: 3 },
                                            { title: "CBE Birr Requests", description: "Handle CBE Birr registration", color: "purple", icon: "📱", count: 5 },
                                            { title: "E-Banking Request", description: "Manage e-banking service requests", color: "indigo", icon: "💻", count: 2 },
                                        ].map((service, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleServiceClick(service.title)}
                                                className={`relative rounded-lg shadow-sm p-4 bg-white cursor-pointer border-t-4 border-${service.color}-500 transform transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
                                            >
                                                {service.count > 0 && (
                                                    <div className={`absolute -top-2 -right-2 bg-${service.color}-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                                        {service.count}
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-3">
                                                    <div className={`text-xl text-${service.color}-600 mt-1`}>
                                                        {service.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-md font-bold text-gray-800">{service.title}</h4>
                                                        <p className="text-xs text-gray-500 leading-snug mt-1">
                                                            {service.description}
                                                        </p>
                                                    </div>
                                                    <ArrowPathIcon className={`h-4 w-4 text-gray-300 group-hover:text-${service.color}-600 group-hover:rotate-180 transition-transform`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {currentSection === "petty" && (
                            <PettyCash />
                        )}
                    </>
                )}
            </main>

            {/* Quick Actions Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <h3 className="font-semibold text-fuchsia-700 mb-3 text-md">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button 
                            onClick={() => handleServiceClick("Print Today's Report")}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all group"
                        >
                            <div className="font-semibold text-fuchsia-700 group-hover:text-fuchsia-800 text-sm">Print Report</div>
                            <div className="text-xs text-gray-500 mt-0.5">Today's transaction summary</div>
                        </button>
                        <button 
                            onClick={() => handleServiceClick("View Performance")}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all group"
                        >
                            <div className="font-semibold text-fuchsia-700 group-hover:text-fuchsia-800 text-sm">Performance</div>
                            <div className="text-xs text-gray-500 mt-0.5">Your efficiency metrics</div>
                        </button>
                        <button 
                            onClick={() => handleServiceClick("Need Assistance")}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all group"
                        >
                            <div className="font-semibold text-fuchsia-700 group-hover:text-fuchsia-800 text-sm">Get Help</div>
                            <div className="text-xs text-gray-500 mt-0.5">Contact supervisor</div>
                        </button>
                        <button 
                            onClick={() => handleServiceClick("System Settings")}
                            className="text-left p-3 rounded-lg border border-gray-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all group"
                        >
                            <div className="font-semibold text-fuchsia-700 group-hover:text-fuchsia-800 text-sm">Settings</div>
                            <div className="text-xs text-gray-500 mt-0.5">Preferences & configuration</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <div className="text-center text-gray-500 text-xs">
                        <p>Maker Dashboard • CBE Digital Services • {new Date().getFullYear()}</p>
                        <p className="text-xs mt-1">Last sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Export with error boundary
const MakerDashboard: React.FC<Props> = (props) => {
    return (
        <DashboardErrorBoundary
            onError={(error, errorInfo) => {
                console.error('Maker Dashboard Error:', error, errorInfo);
                // TODO: Send to error reporting service
            }}
        >
            <MakerDashboardContent {...props} />
        </DashboardErrorBoundary>
    );
};

export default MakerDashboard;