import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef, Fragment } from 'react';
import depositService from '../../../../services/depositService';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
// Reusable message components
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {message}
        </div>
    );
}

function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
        </div>
    );
}

type DepositData = {
    id?: string;
    formReferenceId?: string;
    referenceId?: string;
    ReferenceId?: string;
    accountNumber?: string;
    accountHolderName?: string;
    amount?: number;
    tokenNumber?: string;
    queueNumber?: number;
    [key: string]: any; // For any additional properties
};

export default function DepositConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<any>(state?.serverData || null);
    const [localData, setLocalData] = useState<DepositData>(state?.serverData?.data || {});
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const data = useMemo(() => {
        if (serverData?.data) {
            return serverData.data;
        }
        if (state?.serverData?.data) {
            return state.serverData.data;
        }
        return {};
    }, [serverData, state]);

    useEffect(() => {
        const fetchDeposit = async () => {
            if (data.id || error) return;
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.serverData?.data?.id;
            if (!refId) return;
            setSubmitting(true);
            setError('');
            try {
                const res = await depositService.getDepositById(refId);
                setServerData(res);
                if (res?.data) {
                    setLocalData(prev => ({
                        ...prev,
                        ...res.data,
                        id: res.data.id || prev.id,
                        formReferenceId: res.data.formReferenceId || prev.formReferenceId,
                        tokenNumber: res.data.tokenNumber || prev.tokenNumber,
                        queueNumber: res.data.queueNumber ?? prev.queueNumber
                    }));
                }
            } catch (e: any) {
                setError(e?.message || t('fetchDepositError', 'Failed to fetch deposit confirmation.'));
            } finally {
                setSubmitting(false);
            }
        };
        if (state?.serverData?.data) {
            setServerData(state.serverData);
            setLocalData(prev => ({
                ...prev,
                ...state.serverData.data,
                tokenNumber: state.serverData.data.tokenNumber || prev.tokenNumber,
                queueNumber: state.serverData.data.queueNumber ?? prev.queueNumber
            }));
        } else if (state?.pending || !serverData) {
            fetchDeposit();
        }
    }, [state, serverData, error, data.id, t]);

    const effectiveData = localData?.id ? localData : (data || {});
    const accountNumber = effectiveData?.accountNumber || state?.ui?.accountNumber || 'N/A';
    const accountHolderName = effectiveData?.accountHolderName || state?.ui?.accountHolderName || 'N/A';
    const branchName = state?.branchName || t('ayerTenaBranch', 'Ayer Tena Branch');
    const amountValue = effectiveData?.amount ?? state?.ui?.amount;
    const amount = amountValue !== undefined && amountValue !== null
        ? `${Number(amountValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
        : '0.00 ETB';
    // Always prefer values from navigation state if present and not 'N/A', then from effectiveData, then from serverData, then fallback
    const token = (state?.tokenNumber && state?.tokenNumber !== 'N/A')
        ? state.tokenNumber
        : (effectiveData?.tokenNumber || serverData?.data?.tokenNumber || 'N/A');
    const queueNumber = (state?.queueNumber && state?.queueNumber !== 'N/A')
        ? state.queueNumber.toString()
        : (effectiveData?.queueNumber?.toString() || serverData?.data?.queueNumber?.toString() || 'N/A');
    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: t('depositConfirmation', 'Deposit Confirmation'),
        onAfterPrint: () => {},
        removeAfterPrint: true,
        pageStyle: `
            @page { size: auto; margin: 10mm 10mm 10mm 10mm; }
            @media print { body { -webkit-print-color-adjust: exact; } }
        `,
    } as any);
    const entityId = useMemo(() => {
        return (
            effectiveData?.id ||
            data?.id ||
            serverData?.data?.id ||
            null
        );
    }, [effectiveData?.id, data?.id, serverData?.data?.id]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white rounded-lg shadow-lg">
                <div className="mb-6 bg-fuchsia-700 text-white rounded-t-lg shadow-lg text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white py-5">{t('depositConfirmation', 'Deposit Confirmation')}</h1>
                </div>
                <div className="text-center mb-1">
                    <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
                    <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">{t('success', 'Success!')}</h1>
                    <p className="text-gray-600 text-sm mb-1">{t('depositSubmitted', 'Your deposit has been submitted.')}</p>
                </div>
                <div className="my-4 grid grid-cols-2 gap-3">
                    <div className="bg-fuchsia-700 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">{t('queueNumber', 'Queue #')}</p>
                        <p className="text-3xl font-bold">{queueNumber}</p>
                    </div>
                    <div className="bg-fuchsia-600 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">{t('token', 'Token')}</p>
                        <p className="text-3xl font-bold">{token}</p>
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-4">
                    <h3 className="text-base font-bold text-fuchsia-700 mb-2">{t('transactionSummary', 'Transaction Summary')}</h3>
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
                        <div className="flex justify-between">
                            <strong className="font-medium">{t('accountHolder', 'Account Holder')}:</strong>
                            <span className="text-right">{accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong className="font-medium">{t('accountNumber', 'Account Number')}:</strong>
                            <span>{accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong className="font-medium">{t('amount', 'Amount')}:</strong>
                            <span className="font-bold text-fuchsia-800">{amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong className="font-medium">{t('branch', 'Branch')}:</strong>
                            <span>{branchName}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                        onClick={() => navigate('/form/cash-deposit')}
                        className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition"
                    >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        {t('newDeposit', 'New')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition"
                    >
                        <PrinterIcon className="h-3.5 w-3.5" />
                        {t('print', 'Print')}
                    </button>
                    {entityId && (
                        <button
                            onClick={async () => {
                                setSubmitting(true);
                                setError('');
                                try {
                                    const depositData = await depositService.getDepositById(entityId);
                                    navigate('/form/cash-deposit', {
                                        state: {
                                            updateId: entityId,
                                            formData: {
                                                accountNumber: depositData.data?.accountNumber,
                                                accountHolderName: depositData.data?.accountHolderName,
                                                amount: depositData.data?.amount,
                                                branchId: depositData.data?.branchId,
                                                telephoneNumber: depositData.data?.telephoneNumber,
                                                sourceOfProceeds: depositData.data?.sourceOfProceeds,
                                                DepositedBy: depositData.data?.depositedBy
                                            },
                                            // Pass queueNumber and tokenNumber for preservation
                                            queueNumber: depositData.data?.queueNumber ?? queueNumber,
                                            tokenNumber: depositData.data?.tokenNumber ?? token
                                        }
                                    });
                                } catch (e: any) {
                                    setError(e?.message || t('prepareUpdateError', 'Failed to prepare deposit update. Please try again.'));
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            className="flex items-center justify-center gap-1 w-full bg-yellow-500 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-yellow-600 transition"
                            disabled={submitting}
                        >
                            {t('update', 'Update')}
                        </button>
                    )}
                    {entityId && (
                        <>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="flex items-center justify-center gap-1 w-full bg-red-600 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-red-700 transition disabled:opacity-70"
                                disabled={submitting}
                            >
                                {submitting ? t('cancelling', 'Cancelling...') : t('cancel', 'Cancel')}
                            </button>
                            {/* Cancel Confirmation Modal */}
                            <Transition appear show={showCancelModal} as={Fragment}>
                                <Dialog as="div" className="relative z-10" onClose={() => !submitting && setShowCancelModal(false)}>
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="fixed inset-0 bg-black/25" />
                                    </Transition.Child>
                                    <div className="fixed inset-0 overflow-y-auto">
                                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                                            <Transition.Child
                                                as={Fragment}
                                                enter="ease-out duration-300"
                                                enterFrom="opacity-0 scale-95"
                                                enterTo="opacity-100 scale-100"
                                                leave="ease-in duration-200"
                                                leaveFrom="opacity-100 scale-100"
                                                leaveTo="opacity-0 scale-95"
                                            >
                                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                                    <Dialog.Title
                                                        as="h3"
                                                        className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2"
                                                    >
                                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                                        {t('confirmCancellation', 'Confirm Cancellation')}
                                                    </Dialog.Title>
                                                    <div className="mt-4">
                                                        <p className="text-sm text-gray-500">
                                                            {t('cancelDepositPrompt', 'Are you sure you want to cancel this deposit? This action cannot be undone.')}
                                                        </p>
                                                    </div>
                                                    {error && <ErrorMessage message={error} />}
                                                    <div className="mt-6 flex justify-end gap-3">
                                                        <button
                                                            type="button"
                                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 disabled:opacity-50"
                                                            onClick={() => setShowCancelModal(false)}
                                                            disabled={submitting}
                                                        >
                                                            {t('goBack', 'Go Back')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                                            onClick={async () => {
                                                                try {
                                                                    setSubmitting(true);
                                                                    setError('');
                                                                    const response = await depositService.cancelDepositByCustomer(entityId);
                                                                    if (response.success) {
                                                                        setSuccessMessage(response.message || t('depositCancelled', 'Deposit cancelled successfully'));
                                                                        setShowCancelModal(false);
                                                                        setTimeout(() => {
                                                                            navigate('/form/cash-deposit', {
                                                                                state: {
                                                                                    showSuccess: true,
                                                                                    successMessage: response.message || t('depositCancelled', 'Deposit cancelled successfully')
                                                                                }
                                                                            });
                                                                        }, 1500);
                                                                    } else {
                                                                        throw new Error(response.message || t('cancelDepositFailed', 'Failed to cancel deposit'));
                                                                    }
                                                                } catch (e: any) {
                                                                    setError(e?.message || t('cancelDepositFailed', 'Failed to cancel deposit. Please try again.'));
                                                                } finally {
                                                                    setSubmitting(false);
                                                                }
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            {submitting ? t('cancelling', 'Cancelling...') : t('yesCancelDeposit', 'Yes, Cancel Deposit')}
                                                        </button>
                                                    </div>
                                                </Dialog.Panel>
                                            </Transition.Child>
                                        </div>
                                    </div>
                                </Dialog>
                            </Transition>
                        </>
                    )}
                </div>
                {error && <ErrorMessage message={error} />}
                {successMessage && <SuccessMessage message={successMessage} />}
                <p className="text-sm text-gray-500 mt-6">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
            </div>
        </div>
    );
}

