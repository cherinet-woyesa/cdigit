// src/components/dashboards/MakerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import makerService from '../../services/makerService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle, faArrowRight, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import DenominationModal from '../../models/DenominationModal';

// Define common types for all forms
interface BaseForm {
    id: string;
    formKey: string;
    queueNumber: number;
    customerFullName?: string; // Add this for consistency, though it may not be on all types
    submittedAt: string;
    status: string;
}

// Specific types for each form
interface DepositForm extends BaseForm {
    type: 'Deposit';
    accountHolderName: string;
    accountNumber: string;
    amount: number;
    // Add all other specific fields for deposit here
}

interface WithdrawalForm extends BaseForm {
    type: 'Withdrawal';
    accountHolderName: string;
    accountNumber: string;
    withdrawalAmount: number;
    // Add all other specific fields for withdrawal here
}

interface FundTransferForm extends BaseForm {
    type: 'FundTransfer';
    sourceAccountNumber: string;
    destinationAccountNumber: string;
    amount: number;
    // Add all other specific fields for fund transfer here
}

type QueuedForm = DepositForm | WithdrawalForm | FundTransferForm;

// Interface for the minimal response from the initial 'CallNextCustomer' API
interface NextCustomerResponse {
    id: string;
    formKey: string;
    queueNumber: number;
    transactionType: 'Deposit' | 'Withdrawal' | 'FundTransfer';
    message: string;
}

interface Window {
    id: string;
    windowNumber: number;
    branchId: string;
}

const MakerDashboard: React.FC = () => {
    const { user, token, logout, updateAssignedWindow } = useAuth();
    const [forms, setForms] = useState<QueuedForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedForm, setSelectedForm] = useState<DepositForm | null>(null); // This is for denominations
    const [isDenominationModalOpen, setIsDenominationModalOpen] = useState(false);
    
    const [assignedWindowId, setAssignedWindowId] = useState<string | null>(user?.assignedWindow?.id || null);
    const [assignedWindowNumber, setAssignedWindowNumber] = useState<number | null>(user?.assignedWindow?.windowNumber || null);
    const [windows, setWindows] = useState<Window[]>([]);
    const [showWindowModal, setShowWindowModal] = useState(false);
    const [selectedWindowForAssignment, setSelectedWindowForAssignment] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // NEW state to hold the full details of the customer currently being served
    const [currentCustomer, setCurrentCustomer] = useState<QueuedForm | null>(null);

    const fetchForms = useCallback(async () => {
        if (!token || !assignedWindowId) return;
        setLoading(true);
        setError('');
        try {
            const fetchedForms = await makerService.getFormsForWindow(assignedWindowId, token);
            setForms(fetchedForms);
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Failed to fetch forms.');
            console.error('Fetch forms error:', err);
        } finally {
            setLoading(false);
        }
    }, [token, assignedWindowId]);

    // Initial check for a window assignment
    useEffect(() => {
        const checkWindowAssignment = async () => {
            if (!user || user.role !== 'Maker' || !token) {
                setLoading(false);
                return;
            }

            try {
                const assignedWindow = await makerService.getAssignedWindowForMaker(user.id, token);
                console.log('Assigned Window for maker:', assignedWindow);
                if (assignedWindow) {
                    updateAssignedWindow(assignedWindow);
                    setAssignedWindowId(assignedWindow.id);
                    setAssignedWindowNumber(assignedWindow.windowNumber);
                    setShowWindowModal(false);
                } else {
                    setShowWindowModal(true);
                }
            } catch (err) {
                console.error('Failed to check window assignment:', err);
                setError('Failed to load window information.');
            } finally {
                setLoading(false);
            }
        };
        
        if (!assignedWindowId && user && token) {
            checkWindowAssignment();
        }
    }, [user, token, assignedWindowId, updateAssignedWindow]);

    useEffect(() => {
        if (assignedWindowId) {
            fetchForms();
        }
    }, [assignedWindowId, fetchForms]);

    useEffect(() => {
        const fetchWindowsForModal = async () => {
            console.log('Fetching windows for modal:', showWindowModal, user?.branchId, token);
            if (showWindowModal && user?.branchId && token) {
                try {
                    const branchWindows = await makerService.getWindowsByBranchId(user.branchId, token);
                    console.log('Fetched windows for modal:', branchWindows);
                    setWindows(branchWindows);
                } catch (err) {
                    console.error('Failed to fetch windows for modal:', err);
                }
            }
        };
        fetchWindowsForModal();
    }, [showWindowModal, user, token]);


    const handleAssignWindow = async () => {
        if (!selectedWindowForAssignment || !user || !token) return;
        
        setMessage('');
        setMessageType('');

        try {
            const response = await makerService.selectWindow(selectedWindowForAssignment, user.id, token);
            
            const assignedWindow = windows.find(w => w.id === selectedWindowForAssignment);
            
            if (assignedWindow) {
                updateAssignedWindow(assignedWindow);
                setAssignedWindowId(assignedWindow.id);
                setAssignedWindowNumber(assignedWindow.windowNumber);
            }
            
            setMessage(response.message || 'Window assigned successfully!');
            setMessageType('success');
            
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to assign window. Please try again.';
            setMessage(errorMessage);
            setMessageType('error');
        } finally {
            setTimeout(() => {
                setShowWindowModal(false);
                setMessage('');
                setMessageType('');
            }, 5000);
        }
    };
   
    const handleUpdateDenominations = (form: DepositForm) => {
        setSelectedForm(form);
        setIsDenominationModalOpen(true);
    };

    
    const handleMarkAsDeposited = async (form: DepositForm) => {
        if (!token || !user) return;
        setLoading(true);
        setError('');

        try {
            await makerService.markDepositAsDeposited(form.formKey, user.id, token);
            fetchForms();
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Failed to update deposit status.');
            console.error('Mark as deposited error:', err);
        } finally {
            setLoading(false);
        }
    };

    // MODIFIED function to handle the two-step API call process
    const handleCallNextCustomer = async () => {
        if (!assignedWindowId || !token || !user || !user.branchId) {
            setError('Missing required user or window information.');
            return;
        }

        setLoading(true);
        setError('');
        setCurrentCustomer(null); // Clear previous customer data

        try {
            // Step 1: Call the general API to get the next customer's basic info
            const nextCustomerResponse: NextCustomerResponse = await makerService.callNextCustomer(user.id, assignedWindowId, user.branchId, token);

            if (!nextCustomerResponse || !nextCustomerResponse.id) {
                setError(nextCustomerResponse.message || 'No pending customers in queue.');
                return;
            }

            // Step 2: Use the transactionType to call the specific API for full form data
            let fullFormDetails;
            switch (nextCustomerResponse.transactionType) {
                case 'Deposit':
                    fullFormDetails = await makerService.getDepositById(nextCustomerResponse.id, token);
                    break;
                case 'Withdrawal':
                    fullFormDetails = await makerService.getWithdrawalById(nextCustomerResponse.id, token);
                    break;
                case 'FundTransfer':
                    fullFormDetails = await makerService.getFundTransferById(nextCustomerResponse.id, token);
                    break;
                default:
                    throw new Error('Unknown transaction type received.');
            }

            if (fullFormDetails) {
                setCurrentCustomer({ ...fullFormDetails, type: nextCustomerResponse.transactionType });
                // Now, remove this customer from the pending list if it exists.
                setForms(prevForms => prevForms.filter(f => f.id !== fullFormDetails.id));
            } else {
                setError('Failed to fetch full customer details.');
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to call next customer.';
            setError(errorMessage);
            console.error('Call next customer error:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Conditional Rendering for the main content ---

    if (!user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-purple-600" />
            </div>
        );
    }
    
    // NEW conditional rendering logic: Show either the detailed view or the queue list
    const renderMainContent = () => {
        if (currentCustomer) {
            return (
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Serving Customer: {currentCustomer.customerFullName}
                    </h2>
                    <p className="text-sm text-gray-600">Queue No: <span className="font-bold">{currentCustomer.queueNumber}</span></p>
                    <p className="text-sm text-gray-600">Form Key: <span className="font-mono">{currentCustomer.formKey}</span></p>
                    <span className="font-mono">current form type: {currentCustomer.type}</span>
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        {currentCustomer.type == 'Deposit' && (
                          <DepositDetailView
                              form={currentCustomer as DepositForm}
                              onUpdateDenominationsClick={handleUpdateDenominations} // Pass the handler here
                          />
                      )}

                        {currentCustomer.type === 'Withdrawal' && (
                            <WithdrawalDetailView form={currentCustomer as WithdrawalForm} />
                        )}
                         {currentCustomer.type === 'FundTransfer' && (
                            <FundTransferDetailView form={currentCustomer as FundTransferForm} />
                        )}
                    </div>
                </div>
            );
        }

        // If no customer is being served, render the standard queue list
        return (
            <>
                <div className="flex justify-center space-x-4 mb-6">
                    <button
                        onClick={handleCallNextCustomer}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-150 ease-in-out disabled:opacity-50 flex items-center"
                    >
                        <FontAwesomeIcon icon={faDoorOpen} className="mr-2" />
                        Call Next Customer
                    </button>
                </div>
                
                {forms.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-2xl font-semibold">No pending forms in your queue.</p>
                        <p className="mt-2">Click the button above to call the next customer.</p>
                    </div>
                )}
                
                {forms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map((form) => (
                            <div key={form.formKey} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${form.type === 'Deposit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {form.type}
                                    </span>
                                    <span className="text-sm text-gray-500">Queue: {form.queueNumber}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{form.customerFullName}</h3>
                                <p className="text-sm text-gray-600">Account No: <span className="font-mono">{(form as DepositForm).accountNumber || (form as WithdrawalForm).accountNumber || (form as FundTransferForm).sourceAccountNumber}</span></p>
                                <p className="text-2xl font-bold text-gray-900 mt-4">
                                    ETB {(form as DepositForm).amount?.toFixed(2) || (form as WithdrawalForm).withdrawalAmount?.toFixed(2) || (form as FundTransferForm).amount?.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-purple-700 text-white py-5 px-6 shadow-lg">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Maker Dashboard</h1>
                    {user && (
                      <p className="text-sm bg-purple-800 px-3 py-1 rounded-full">
                        Welcome, {user.firstName} {user.lastName} ({user.role})
                      </p>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Welcome Banner */}
                <div className="bg-purple-700 text-white p-6 rounded-xl mb-8 shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Manage Transactions</h2>
                    <p className="opacity-90">View and process customer transactions efficiently.</p>
                </div>

                {/* Transaction Queue */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    {error && <p className="text-red-600 mb-4 font-medium text-center">{error}</p>}

                    {forms.length === 0 && !loading && (
                        <div className="text-center py-20 text-gray-500">
                            <p className="text-2xl font-semibold">No pending forms in your queue.</p>
                            <p className="mt-2">Click the button below to call the next customer.</p>
                        </div>
                    )}

                    {forms.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {forms.map((form) => (
                                <div key={form.formKey} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${form.type === 'Deposit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {form.type}
                                        </span>
                                        <span className="text-sm text-gray-500">Queue: {form.queueNumber}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{form.customerFullName}</h3>
                                    <p className="text-sm text-gray-600">Account No: <span className="font-mono">{(form as DepositForm).accountNumber || (form as WithdrawalForm).accountNumber || (form as FundTransferForm).sourceAccountNumber}</span></p>
                                    <p className="text-2xl font-bold text-gray-900 mt-4">
                                        ETB {(form as DepositForm).amount?.toFixed(2) || (form as WithdrawalForm).withdrawalAmount?.toFixed(2) || (form as FundTransferForm).amount?.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center space-x-4 mt-6">
                        <button
                            onClick={handleCallNextCustomer}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-150 ease-in-out disabled:opacity-50 flex items-center"
                        >
                            Call Next Customer
                        </button>
                    </div>
                </div>
            </main>
            
            {/* The modal components would be rendered here, as before */}
            <DenominationModal
                isOpen={isDenominationModalOpen}
                onClose={() => setIsDenominationModalOpen(false)}
                form={selectedForm}
                onSave={() => {
                    fetchForms();
                    // setIsDenominationModalOpen(false);
                }}
            />
            
            {showWindowModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Select Your Window</h2>
                        {message && (
                            <div className={`p-3 rounded-md mb-4 ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message}
                            </div>
                        )}
                        <p className="text-gray-600 mb-6">Please select an available window to start serving customers.</p>
                        <select
                            value={selectedWindowForAssignment || ''}
                            onChange={(e) => setSelectedWindowForAssignment(e.target.value)}
                            className="block w-full p-2 border rounded-md mb-4"
                        >
                            <option value="">Choose a Window</option>
                            {windows.map(window => (
                                <option key={window.id} value={window.id}>Window No. {window.windowNumber}</option>
                            ))}
                        </select>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleAssignWindow}
                                disabled={!selectedWindowForAssignment}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                                Assign and Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper components for displaying detailed views
const DepositDetailView = ({ form, onUpdateDenominationsClick }: { form: DepositForm, onUpdateDenominationsClick: (form: DepositForm) => void }) => (
    <div className="space-y-4">
        <div><span className="font-semibold">Account Number:</span> {form.accountNumber}</div>
        <div><span className="font-semibold">Account Holder:</span> {form.accountHolderName}</div>
        <div><span className="font-semibold">Amount:</span> ETB {form.amount.toFixed(2)}</div>
        {/* ... other deposit-specific fields ... */}

        {/* NEW BUTTON for denominations */}
        {((form.status === 'OnQueue') ||(form.status === 'In Progress')) && ( // Only show button for pending forms
          <button
            onClick={() => onUpdateDenominationsClick(form)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Denominations
          </button>
        )}
    </div>
);


const WithdrawalDetailView = ({ form }: { form: WithdrawalForm }) => (
    <div className="space-y-4">
        <div><span className="font-semibold">Account Number:</span> {form.accountNumber}</div>
        <div><span className="font-semibold">Account Holder:</span> {form.accountHolderName}</div>
        <div><span className="font-semibold">Withdrawal Amount:</span> ETB {form.withdrawalAmount.toFixed(2)}</div>
        {/* Add more Withdrawal-specific fields here */}
    </div>
);

const FundTransferDetailView = ({ form }: { form: FundTransferForm }) => (
    <div className="space-y-4">
        <div><span className="font-semibold">Source Account:</span> {form.sourceAccountNumber}</div>
        <div><span className="font-semibold">Destination Account:</span> {form.destinationAccountNumber}</div>
        <div><span className="font-semibold">Amount:</span> ETB {form.amount.toFixed(2)}</div>
        {/* Add more FundTransfer-specific fields here */}
    </div>
);

export default MakerDashboard;