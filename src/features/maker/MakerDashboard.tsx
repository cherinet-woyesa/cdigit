import React, { useEffect, useState } from "react";
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
  UserCircleIcon
} from "@heroicons/react/24/outline";

type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
};

const MakerDashboard: React.FC<Props> = ({ 
    activeSection = "transactions",
    assignedWindow = null
}) => {
    const { token, logout, user } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation tabs
    const tabs = [
        { id: "transactions", name: "Transactions", icon: CurrencyDollarIcon },
        { id: "petty", name: "Petty Cash", icon: CogIcon },
        { id: "other", name: "Other Services", icon: ClockIcon },
    ];

    const [currentSection, setCurrentSection] = useState(activeSection);

    /** Decode token */
    useEffect(() => {
        if (!token) return;
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
            console.log('MakerDashboard: Token decoded successfully', d);
        } catch (error) {
            console.error('MakerDashboard: Failed to decode token', error);
            logout();
        }
    }, [token, logout]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
                    <p className="mt-4 text-fuchsia-700 font-medium">Loading Maker Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-purple-50">
            {/* Enhanced Header */}
            <header className="bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Left Side - Brand & Welcome */}
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <CurrencyDollarIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Maker Dashboard</h1>
                                <p className="text-fuchsia-100 text-sm">
                                    Welcome, {user?.firstName || decoded?.unique_name || 'Maker'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Right Side - User Info & Status */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-fuchsia-100">
                                    <UserCircleIcon className="h-5 w-5" />
                                    <span className="font-semibold">Role: Maker</span>
                                </div>
                                <div className="text-xs text-fuchsia-200 mt-1">
                                    Branch: {decoded?.BranchId || 'N/A'}
                                </div>
                            </div>
                            
                            {assignedWindow && (
                                <div className="bg-white/20 px-3 py-2 rounded-lg">
                                    <div className="text-xs text-fuchsia-200">Window</div>
                                    <div className="font-bold text-white">#{assignedWindow.windowNumber}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentSection(tab.id)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200 ${
                                    currentSection === tab.id
                                        ? 'border-fuchsia-600 text-fuchsia-700 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Global Action Message */}
                {actionMessage && (
                    <div className={`rounded-xl p-4 border-l-4 ${
                        actionMessage.type === 'success' 
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-red-50 border-red-400 text-red-700'
                    }`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {actionMessage.type === 'success' ? (
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{actionMessage.content}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Content */}
                {currentSection === "transactions" && (
                    <Transactions 
                        assignedWindow={assignedWindow} 
                        activeSection={currentSection}
                    />
                )}

                {currentSection === "other" && (
                    <section className="animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Other Services</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { 
                                        title: "Account Opening Request", 
                                        description: "Process new account opening applications",
                                        color: "from-fuchsia-500 to-purple-600",
                                        icon: "📋"
                                    },
                                    { 
                                        title: "CBE Birr Requests", 
                                        description: "Handle CBE Birr registration and services",
                                        color: "from-purple-500 to-indigo-600",
                                        icon: "📱"
                                    },
                                    { 
                                        title: "E-Banking Request", 
                                        description: "Manage electronic banking service requests",
                                        color: "from-indigo-500 to-blue-600",
                                        icon: "💻"
                                    },
                                ].map((service, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-2xl shadow-lg p-6 text-white cursor-pointer bg-gradient-to-br ${service.color} transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group`}
                                    >
                                        <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                                            {service.icon}
                                        </div>
                                        <h4 className="text-lg font-bold mb-2">{service.title}</h4>
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {service.description}
                                        </p>
                                        <div className="mt-4 text-xs text-white/60">
                                            Click to manage services
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
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="text-center text-gray-500 text-sm">
                        <p>Maker Dashboard • CBE Digital Services • {new Date().getFullYear()}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MakerDashboard;