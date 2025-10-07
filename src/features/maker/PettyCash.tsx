import { useAuth } from "../../context/AuthContext";
import ForeignCurrencyModal from "../../modals/ForeignCurrencyModal";
import PettyDenominationModal from "../../modals/PettyDenominationModal";
import React, { useEffect, useState } from "react";
import pettyCashMakerService from "../../services/pettyCashMakerService";
import type { ActionMessage } from "../../types/ActionMessage";
import type { DecodedToken } from "../../types/DecodedToken";
import type { InitialRequestDto } from "../../types/PettyCash/InitialRequestDto";
import type { PettyCashFormResponseDto } from "../../types/PettyCash/PettyCashFormResponseDto";
import { jwtDecode } from "jwt-decode";

interface PettyCashProps {
}

const PettyCash: React.FC<PettyCashProps> = ({ }) => {

    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);


    //petty cash related states
    const [showPettyModal, setShowPettyModal] = useState(false);
    const [showForeignModal, setShowForeignModal] = useState<boolean>(false);
    const [foreignDenomForm, setForeignDenomForm] = useState<{ makerId: string; formId: string } | null>(null);
    const [pettyCashData, setPettyCashData] = useState<PettyCashFormResponseDto | null>(null);
    const [pettyDenomForm, setPettyDenomForm] = useState<{ makerId: string; formId: string; } | null>(null);

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


    // fetching petty cash data
    useEffect(() => {
        const fetchFormData = async () => {
            console.log("get petty Cash Called");
            if (!token || !decoded?.nameid) return;

            try {
                const response = await pettyCashMakerService.getByFrontMaker(decoded?.nameid, decoded?.BranchId, token);
                setPettyCashData(response.data as PettyCashFormResponseDto | null);

            } catch (err) {
                // setError('Failed to fetch data.');
                console.error(err);
            } finally {
                // setLoading(false);
            }
        };

        fetchFormData();
    }, [decoded?.nameid, decoded?.BranchId]);


    // --- Petty Cash Handlers ---
    const handlePettyAction = async (
        action: keyof typeof pettyCashMakerService,
        dto?: object
    ) => {
        if (!token || !decoded?.nameid) return;

        try {
            // @ts-ignore dynamic service call
            const res = await pettyCashMakerService[action](decoded.nameid, dto || {}, token);

            if (res.success) {
                setActionMessage({ type: "success", content: res.message || "Success" });
            } else {
                setActionMessage({ type: "error", content: res.message || "Failed" });
            }
        } catch (err) {
            console.error("PettyCash error:", err);
            setActionMessage({ type: "error", content: "Something went wrong." });
        } finally {
            setTimeout(() => setActionMessage(null), 4000);
        }
    };
    const handleInitialRequest = async () => {
        if (!token || !decoded) return;
        const dto: InitialRequestDto = {
            FrontMakerId: decoded.nameid,
            BranchId: decoded.BranchId
        };

        try {
            const response = await pettyCashMakerService.requestInitial(dto, token);
            console.log("Response from initial request:", response);
            // Handle the response as needed
        } catch (error) {
            console.error("Error making initial request:", error);
            // Handle the error as needed
        }
    };

    const handleOpenForeignModal = (makerId: string, formId: string) => {
        setForeignDenomForm({ makerId, formId });
        setShowForeignModal(true);
    };

    const handleOpenPettyDenomModal = (makerId: string, formId: string) => {
        setPettyDenomForm({ makerId, formId });
        setShowPettyModal(true);
    };

    return (
        <section className="mt-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Petty Cash Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
                
                {pettyCashData == null && (
                    <button
                        onClick={() => handleInitialRequest()}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                    >
                        Request Initial
                    </button>
                )}


                <button
                    onClick={() => handlePettyAction("approveReceipt")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                >
                    Approve Initial Receipt
                </button>
                <button
                    onClick={() => handlePettyAction("requestAdditional")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                >
                    Request Additional
                </button>
                <button
                    onClick={() => handlePettyAction("approveAdditionalReceipt")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                >
                    Approve Additional Receipt
                </button>
                <button
                    onClick={() => handlePettyAction("surrenderInitial")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                >
                    Surrender Initial
                </button>
                <button
                    onClick={() => handlePettyAction("surrenderAdditional")}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                >
                    Surrender Additional
                </button>

                {/* Submit Petty Cash -> open modal */}
                <button onClick={() => handleOpenPettyDenomModal(pettyCashData?.frontMakerId || '', pettyCashData?.id || '')} className="bg-teal-700 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-800"
                >
                    Submit Petty Cash
                </button>

                {/* Submit Foreign Currency -> open modal */}
                <button onClick={() => handleOpenForeignModal(pettyCashData?.frontMakerId || '', pettyCashData?.id || '')} className="bg-teal-700 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-800"
                >
                    Submit Foreign Currency
                </button>
            </div>

            {/* Petty Cash Modal */}

            <PettyDenominationModal
                isOpen={showPettyModal}
                onClose={() => setShowPettyModal(false)}
                onSave={() => { }}
                form={pettyDenomForm}
            />
            <ForeignCurrencyModal
                isOpen={showForeignModal}
                onClose={() => setShowForeignModal(false)}
                onSave={() => { }}
                form={foreignDenomForm}
            />
        </section>

    );
};

export default PettyCash;




