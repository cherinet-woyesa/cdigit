import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';


type RTGSData = {
    formReferenceId?: string;
    branchName?: string;
    orderingAccountNumber?: string;
    orderingCustomerName?: string;
    beneficiaryBank?: string;
    beneficiaryBranch?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryName?: string;
    transferAmount?: number;
    paymentNarrative?: string;
    customerTelephone?: string;
    tokenNumber?: string;
    submittedAt?: string;
};

export default function RTGSTransferConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<RTGSData>({});
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state?.api) {
            const api = state.api;
            setData({
                formReferenceId: api.FormReferenceId || api.formReferenceId,
                branchName: api.BranchName || api.branchName,
                orderingAccountNumber: api.OrderingAccountNumber || api.orderingAccountNumber,
                orderingCustomerName: api.OrderingCustomerName || api.orderingCustomerName,
                beneficiaryBank: api.BeneficiaryBank || api.beneficiaryBank,
                beneficiaryBranch: api.BeneficiaryBranch || api.beneficiaryBranch,
                beneficiaryAccountNumber: api.BeneficiaryAccountNumber || api.beneficiaryAccountNumber,
                beneficiaryName: api.BeneficiaryName || api.beneficiaryName,
                transferAmount: api.TransferAmount ?? api.transferAmount,
                paymentNarrative: api.PaymentNarrative || api.paymentNarrative,
                customerTelephone: api.CustomerTelephone || api.customerTelephone,
                submittedAt: (api.SubmittedAt || api.submittedAt) ? new Date(api.SubmittedAt || api.submittedAt).toISOString() : new Date().toISOString(),
            });
            setIsLoading(false);
            return;
        }

        if (state?.formData) {
            setData({
                formReferenceId: state.formData.formReferenceId,
                branchName: state.formData.branchName,
                orderingAccountNumber: state.formData.orderingAccountNumber,
                orderingCustomerName: state.formData.orderingCustomerName,
                beneficiaryBank: state.formData.beneficiaryBank,
                beneficiaryBranch: state.formData.beneficiaryBranch,
                beneficiaryAccountNumber: state.formData.beneficiaryAccountNumber,
                beneficiaryName: state.formData.beneficiaryName,
                transferAmount: state.formData.transferAmount,
                paymentNarrative: state.formData.paymentNarrative,
                customerTelephone: state.formData.customerTelephone,
                submittedAt: new Date().toISOString()
            });
            setIsLoading(false);
            return;
        }

        setError('No transfer data found. Please complete the RTGS transfer form first.');
        setIsLoading(false);
    }, [state]);

    const handleNewTransfer = () => {
        navigate('/form/rtgs-transfer');
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    documentTitle: `RTGS-Transfer-${data.formReferenceId || 'receipt'}`
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cbe-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
                <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">Error</h3>
                    <div className="mt-2 text-sm text-gray-500">
                        <p>{error}</p>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
            <div ref={printRef} className="max-w-2xl w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="mb-6 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg text-center">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">RTGS Transfer Confirmation</h1>
                </div>

                <div className="text-center mb-4">
                    <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
                    <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">Success!</h1>
                    <p className="text-gray-600 text-sm">Your RTGS transfer request has been submitted.</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-4">
                    <h3 className="text-base font-bold text-fuchsia-700 mb-2">Transfer Details</h3>
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
                        <div className="flex justify-between"><strong>Reference:</strong> <span>{data.formReferenceId || 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Date:</strong> <span>{data.submittedAt ? new Date(data.submittedAt).toLocaleString() : 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>From Account:</strong> <span>{data.orderingAccountNumber || 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Amount:</strong> <span className="font-bold text-fuchsia-800">{typeof data.transferAmount === 'number' ? `ETB ${data.transferAmount.toLocaleString()}` : 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Beneficiary:</strong> <span>{data.beneficiaryName || 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Beneficiary Account:</strong> <span>{data.beneficiaryAccountNumber || 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Bank/Branch:</strong> <span>{data.beneficiaryBank || 'N/A'}{data.beneficiaryBranch ? ` / ${data.beneficiaryBranch}` : ''}</span></div>
                        <div className="flex justify-between"><strong>Narrative:</strong> <span className="text-right">{data.paymentNarrative || 'N/A'}</span></div>
                        <div className="flex justify-between"><strong>Branch:</strong> <span>{data.branchName || 'N/A'}</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleNewTransfer}
                        className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition"
                    >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        New
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition"
                    >
                        <PrinterIcon className="h-3.5 w-3.5" />
                        Print
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6 text-center">Thank you for banking with us!</p>
            </div>
        </div>
    );
}
