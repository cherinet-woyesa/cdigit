import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";
import PettyCash from "./PettyCash";
import Transactions from "./Transactions";


// const MakerDashboard: React.FC = () => {
type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto | null;

};

const MakerDashboard: React.FC<Props> = ({ activeSection, assignedWindow }) => {

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
        } catch {
            logout();
        }
    }, [token, logout]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            {/* Header */}

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Alert */}
                {actionMessage?.content && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-xl shadow-sm">
                        {actionMessage.content}
                    </div>
                )}

                {activeSection === "transactions" && (
                    // your transactions UI (queue, call next, current modal...)
                    <Transactions assignedWindow={assignedWindow} />

                )}

                {activeSection === "other" && (
                    // your "Other Services" section

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

                {/* {activeSection === "performance" && (
   // served stats, performance, ratings...
)}

                {activeSection === "settings" && (
   // change window, maybe profile, etc.
)} */}
            </main>

        </div>
    );
};


export default MakerDashboard;