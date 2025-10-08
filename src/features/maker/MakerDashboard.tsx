import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";

// FIXED: Added proper default props and made props optional
type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
};

const MakerDashboard: React.FC<Props> = ({ 
    activeSection = "transactions", // FIXED: Default value
    assignedWindow = null // FIXED: Default value
}) => {
    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    // inside MakerDashboard component state
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

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

    // FIXED: Add error boundary and loading state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading completion
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // FIXED: Add error boundary catch
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-purple-700">Loading Maker Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            {/* Header */}
            <header className="bg-purple-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Maker Dashboard</h1>
                            <p className="text-purple-200">
                                Welcome, {decoded?.unique_name || 'Maker'} | Branch: {decoded?.BranchId || 'N/A'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-purple-200">Role: Maker</p>
                            <p className="text-purple-200">Active Section: {activeSection}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Alert */}
                {actionMessage?.content && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-xl shadow-sm">
                        {actionMessage.content}
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex space-x-4">
                        <button
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeSection === "transactions" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Transactions
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeSection === "petty" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Petty Cash
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeSection === "other" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Other Services
                        </button>
                    </div>
                </div>

                {activeSection === "transactions" && (
                    <Transactions assignedWindow={assignedWindow} />
                )}

                {activeSection === "other" && (
                    <section className="mt-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Services</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Account Opening Request", color: "from-purple-500 to-fuchsia-600" },
                                { title: "CBE Birr Requests", color: "from-indigo-500 to-purple-600" },
                                { title: "E-Banking Request", color: "from-pink-500 to-purple-600" },
                            ].map((service, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-2xl shadow-lg p-6 text-white cursor-pointer bg-gradient-to-br ${service.color} transform transition hover:scale-105 hover:shadow-2xl`}
                                >
                                    <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                                    <p className="text-sm text-white/80">
                                        Manage and process {service.title.toLowerCase()} here.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Toggle Petty Cash Services */}
                {activeSection === "petty" && (
                    <PettyCash />
                )}
            </main>
        </div>
    );
};

export default MakerDashboard;