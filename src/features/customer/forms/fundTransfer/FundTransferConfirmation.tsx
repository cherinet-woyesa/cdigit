import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { cancelFundTransferByCustomer } from '../../../../services/fundTransferService';

export default function FundTransferConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const componentToPrintRef = useRef(null);

    const data = state || {};
    const referenceId = data.referenceId || `FT-${Date.now()}`;
    const debitAccount = data.debitAccountNumber || 'N/A';
    const creditAccount = data.creditAccountNumber || 'N/A';
    const amount = data.amount ? `${Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : 'N/A';
    const branch = data.branch || 'Ayer Tena Branch';
    const token = data.token?.toString() || 'N/A';
    const queueNumber = data.window?.toString() || 'N/A';

    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentToPrintRef.current,
    });

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500" />
                <h1 className="text-3xl font-extrabold text-fuchsia-800 mt-4">Success!</h1>
                <p className="text-gray-600 mt-2">Your fund transfer has been submitted successfully.</p>

                <div className="my-8 flex flex-col md:flex-row gap-4 justify-center text-white">
                    <div className="flex-1 bg-fuchsia-700 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Queue Number</p>
                        <p className="text-7xl font-bold tracking-wider">{queueNumber}</p>
                    </div>
                    <div className="flex-1 bg-fuchsia-600 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Token</p>
                        <p className="text-7xl font-bold tracking-wider">{token}</p>
                    </div>
                </div>

                <div className="text-left bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-bold text-fuchsia-700 mb-4">Summary</h3>
                    <div className="space-y-2 text-gray-700">
                        <div className="flex justify-between"><strong className="font-medium">Reference ID:</strong> <span>{referenceId}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">From Account:</strong> <span>{debitAccount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">To Account:</strong> <span>{creditAccount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Amount:</strong> <span className="font-bold text-fuchsia-800">{amount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Branch:</strong> <span>{branch}</span></div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => navigate('/fund-transfer')} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition transform hover:scale-105">
                        <ArrowPathIcon className="h-5 w-5" />
                        New Transfer
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-200 text-fuchsia-800 px-8 py-3 rounded-lg shadow-md hover:bg-gray-300 transition transform hover:scale-105">
                        <PrinterIcon className="h-5 w-5" />
                        Print
                    </button>
                    <button
                        onClick={async () => {
                            // You may want to show a modal or navigate to an update form instead
                            navigate('/fund-transfer', { state: { updateId: data.id || data.Id } });
                        }}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-yellow-500 text-white px-8 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition transform hover:scale-105"
                    >
                        Update
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                // You need to implement cancelFundTransferByCustomer in fundTransferService
                                await cancelFundTransferByCustomer(data.id || data.Id);
                                navigate('/fund-transfer', { state: { cancelled: true } });
                            } catch (e: any) {
                                alert(e?.message || 'Failed to cancel fund transfer.');
                            }
                        }}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-red-700 transition transform hover:scale-105"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
            </div>
        </div>
    );
}