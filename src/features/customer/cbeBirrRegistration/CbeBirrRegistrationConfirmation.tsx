import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';
import type { ReactToPrintProps } from 'react-to-print';

type RegistrationData = {
    formReferenceId?: string;
    phoneNumber?: string;
    fullName?: string;
    windowNumber?: string;
    tokenNumber?: string;
    submittedAt?: string;
};

export default function CbeBirrRegistrationConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<RegistrationData>({});
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state?.formData) {
            setData({
                formReferenceId: state.formData.formReferenceId,
                phoneNumber: state.formData.phoneNumber,
                fullName: state.formData.fullName,
                windowNumber: state.windowNumber || state.formData.windowNumber,
                tokenNumber: state.formData.tokenNumber,
                submittedAt: new Date().toISOString()
            });
            setIsLoading(false);
        } else {
            // In a real app, you would fetch the registration details using an ID from the URL
            // For now, we'll show an error if no data is passed
            setError('No registration data found. Please complete the registration form first.');
            setIsLoading(false);
        }
    }, [state]);

    const handleNewRegistration = () => {
        navigate('/form/cbe-birr');
    };

    const handlePrint = useReactToPrint({
        content: () => printRef.current as HTMLDivElement,
        documentTitle: `CBE-Birr-Registration-${data.formReferenceId || 'receipt'}`,
        removeAfterPrint: true
    } as ReactToPrintProps);

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
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
            <div ref={printRef} className="p-6">
                <div className="text-center mb-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900">CBE-Birr Registration Successful</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Your registration has been submitted successfully.
                    </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h2 className="text-lg font-medium text-cbe-primary mb-4">Registration Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Form Reference ID</h3>
                            <p className="mt-1 text-sm text-gray-900 font-medium">{data.formReferenceId || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Customer Phone</h3>
                            <p className="mt-1 text-sm text-gray-900">{data.phoneNumber || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                            <p className="mt-1 text-sm text-gray-900">{data.fullName || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Window Number</h3>
                            <p className="mt-1 text-sm text-gray-900">{data.windowNumber || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Token Number</h3>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{data.tokenNumber || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                            <p className="mt-1 text-sm text-gray-900">
                                {data.submittedAt ? new Date(data.submittedAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                To complete your registration, please present your ID at counter number <span className="font-bold">{data.windowNumber || 'N/A'}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            For any inquiries, please contact our customer service at +251 11 551 5000
                        </div>
                        <div className="text-xs text-gray-500">
                            {data.formReferenceId && `Ref: ${data.formReferenceId}`}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
                <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
                >
                    <PrinterIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                    Print
                </button>
                
                <div className="space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
                    >
                        Return to Dashboard
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleNewRegistration}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
                    >
                        <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New Registration
                    </button>
                </div>
            </div>
        </div>
    );
}
