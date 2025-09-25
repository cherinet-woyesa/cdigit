import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';
import { useMemo, useRef } from 'react';
import { cancelFundTransferByCustomer } from '../../../../services/fundTransferService';

export default function FundTransferConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const componentToPrintRef = useRef(null);

    // Prefer nested api response: { success, message, data }
    const apiWrapper = state?.api ?? state?.serverData ?? state;
    const apiData = useMemo(() => (apiWrapper?.data ?? apiWrapper ?? {}) as any, [apiWrapper]);

    const debitAccount = apiData.DebitAccountNumber || apiData.debitAccountNumber || apiData.debitAccount || state?.debitAccountNumber || 'N/A';
    const creditAccount = apiData.CreditAccountNumber || apiData.creditAccountNumber || apiData.creditAccount || state?.creditAccountNumber || 'N/A';
    const amountValue = apiData.Amount ?? apiData.amount ?? state?.amount;
    const amount = amountValue != null ? `${Number(amountValue).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : 'N/A';
    const branch = apiData.BranchName || apiData.branchName || state?.branch || 'Ayer Tena Branch';
    const token = (apiData.TokenNumber || apiData.tokenNumber || state?.token)?.toString() || 'N/A';
    const queueNumber = (apiData.QueueNumber ?? apiData.queueNumber ?? apiData.Window ?? apiData.window ?? state?.window)?.toString() || 'N/A';
    const entityId = apiData.Id || apiData.id || null;

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentToPrintRef.current,
    });

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
                <div className="mb-6 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">Fund Transfer Confirmation</h1>
                </div>

                <div className="text-center mb-4">
                    <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
                    <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">Success!</h1>
                    <p className="text-gray-600 text-sm">Your fund transfer has been submitted.</p>
                </div>

                <div className="my-4 grid grid-cols-2 gap-3">
                    <div className="bg-fuchsia-700 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">Queue #</p>
                        <p className="text-3xl font-bold">{queueNumber}</p>
                    </div>
                    <div className="bg-fuchsia-600 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">Token</p>
                        <p className="text-3xl font-bold">{token}</p>
                    </div>
                </div>

                <div className="text-left bg-gray-50 p-3 rounded-lg shadow-inner">
                    <h3 className="text-base font-bold text-fuchsia-700 mb-2">Transaction Summary</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between"><strong className="font-medium">From:</strong> <span>{debitAccount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">To:</strong> <span>{creditAccount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Amount:</strong> <span className="font-bold text-fuchsia-800">{amount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Branch:</strong> <span>{branch}</span></div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={() => navigate('/form/fund-transfer')} className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition">
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        New
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition">
                        <PrinterIcon className="h-3.5 w-3.5" />
                        Print
                    </button>
                    {entityId && (
                        <button
                            onClick={async () => {
                                navigate('/form/fund-transfer', {
                                    state: {
                                        updateId: entityId,
                                        formData: {
                                            debitAccountNumber: apiData?.DebitAccountNumber || apiData?.debitAccountNumber,
                                            creditAccountNumber: apiData?.BeneficiaryAccountNumber || apiData?.creditAccountNumber,
                                            creditAccountName: apiData?.BeneficiaryName || apiData?.beneficiaryName,
                                            amount: apiData?.TransferAmount || apiData?.amount,
                                        }
                                    }
                                });
                            }}
                            className="flex items-center justify-center gap-1 w-full bg-yellow-500 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-yellow-600 transition"
                        >
                            Update
                        </button>
                    )}
                    {entityId && (
                        <button
                            onClick={async () => {
                                try {
                                    await cancelFundTransferByCustomer(entityId);
                                    navigate('/form/fund-transfer', { state: { cancelled: true } });
                                } catch (e: any) {
                                    alert(e?.message || 'Failed to cancel fund transfer.');
                                }
                            }}
                            className="flex items-center justify-center gap-1 w-full bg-red-600 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-red-700 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                <p className="text-xs sm:text-sm text-gray-500 mt-4">Thank you for banking with us!</p>
            </div>
        </div>
    );
}