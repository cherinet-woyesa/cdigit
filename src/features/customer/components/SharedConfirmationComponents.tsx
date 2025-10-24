import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';
import { 
    CheckCircle2, 
    Printer, 
    RefreshCw, 
    X, 
    AlertTriangle,
    AlertCircle
} from 'lucide-react';

// Status message component
export function StatusMessage({ type, message }: { type: 'error' | 'success'; message: string }) {
    const styles = {
        error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertCircle },
        success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2 }
    };
    
    const { bg, border, text, icon: Icon } = styles[type];
    
    return (
        <div className={`flex items-center gap-3 p-3 ${bg} border ${border} rounded-lg mb-3`}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className={`text-sm ${text}`}>{message}</span>
        </div>
    );
}

// Print hook with common configuration - FIXED VERSION
export function usePrint(ref: React.RefObject<HTMLDivElement>, title: string) {
    return useReactToPrint({
        content: () => ref.current,
        documentTitle: title,
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
    } as any); // Using 'as any' to bypass TypeScript issues
}

// Success header component
export function SuccessHeader({ icon: Icon, title, branchName, phone }: {
    icon: React.ComponentType<any>;
    title: string;
    branchName: string;
    phone: string;
}) {
    return (
        <header className="bg-fuchsia-700 text-white">
            <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">{title}</h1>
                            <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                <span>{branchName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">
                            📱 {phone}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

// Success icon component
export function SuccessIcon({ title, message }: { title: string; message: string }) {
    return (
        <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
            <p className="text-gray-600 text-sm">{message}</p>
        </div>
    );
}

// Queue and token cards component
export function QueueTokenCards({ queueNumber, tokenNumber }: {
    queueNumber: string | number;
    tokenNumber: string | number;
}) {
    const { t } = useTranslation();
    
    return (
        <div className="mb-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                    </div>
                    <p className="text-2xl font-bold">{queueNumber}</p>
                </div>
                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs font-medium">{t('token', 'Token')}</span>
                    </div>
                    <p className="text-2xl font-bold">{tokenNumber}</p>
                </div>
            </div>
        </div>
    );
}

// Action buttons component
export function ActionButtons({ 
    onNew, 
    onPrint, 
    onUpdate, 
    onCancel, 
    showUpdateCancel = false,
    isSubmitting = false 
}: {
    onNew: () => void;
    onPrint: () => void;
    onUpdate?: () => void;
    onCancel?: () => void;
    showUpdateCancel?: boolean;
    isSubmitting?: boolean;
}) {
    const { t } = useTranslation();
    
    return (
        <div className="p-4 border-t border-amber-200 no-print">
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onNew}
                    className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                >
                    <RefreshCw className="h-3 w-3" />
                    {t('new', 'New')}
                </button>
                
                <button
                    onClick={onPrint}
                    className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                >
                    <Printer className="h-3 w-3" />
                    {t('print', 'Print')}
                </button>
            </div>

            {showUpdateCancel && onUpdate && onCancel && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                        onClick={onUpdate}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                    >
                        <RefreshCw className="h-3 w-3" />
                        {isSubmitting ? t('processing', 'Processing...') : t('update', 'Update')}
                    </button>
                    
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-1 w-full bg-rose-500 hover:bg-rose-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                    >
                        <X className="h-3 w-3" />
                        {t('cancel', 'Cancel')}
                    </button>
                </div>
            )}
        </div>
    );
}

// Cancel confirmation modal
export function CancelModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isSubmitting,
    title,
    message 
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    title: string;
    message: string;
}) {
    const { t } = useTranslation();
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => !isSubmitting && onClose()}>
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
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                    {title}
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">{message}</p>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        {t('no', 'No')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
                                        onClick={onConfirm}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center">
                                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                {t('processing', 'Processing...')}
                                            </span>
                                        ) : (
                                            t('yesCancel', 'Yes, Cancel')
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// Loading state component
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <RefreshCw className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        </div>
    );
}

// Error state component
export function ErrorState({ 
    error, 
    onPrimaryAction, 
    onSecondaryAction,
    primaryLabel,
    secondaryLabel 
}: {
    error: string;
    onPrimaryAction: () => void;
    onSecondaryAction: () => void;
    primaryLabel: string;
    secondaryLabel: string;
}) {
    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={onPrimaryAction}
                            className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                        >
                            {primaryLabel}
                        </button>
                        <button
                            onClick={onSecondaryAction}
                            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {secondaryLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}