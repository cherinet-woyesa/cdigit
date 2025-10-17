import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { sendFundTransferOTP, submitFundTransfer, updateFundTransfer } from '../../../../services/fundTransferService';
import Field from '../../../../components/Field';
import { useToast } from '../../../../context/ToastContext';
import { validateAmount, validateRequired, validateOTP, validateAccountNumber } from '../../../../utils/validation';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    DollarSign,
    User,
    Shield,
    MapPin,
    Calendar,
    Users
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Eraser, Signature } from 'lucide-react';

// Consistent error message component
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

interface FormData {
    debitAccountNumber: string;
    debitAccountName: string;
    amount: string;
    creditAccountNumber: string;
    creditAccountName: string;
    otp: string;
}

// Add signature interface
interface SignatureData {
    signatoryName: string;
    signatureData: string;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string; signatures?: string };

export default function FundTransfer() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError, info } = useToast();
    const { createWorkflow } = useApprovalWorkflow();
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        accounts, 
        accountDropdown, 
        loadingAccounts, 
        errorAccounts, 
        refreshAccounts 
    } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        debitAccountNumber: '',
        debitAccountName: '',
        amount: '',
        creditAccountNumber: '',
        creditAccountName: '',
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [updateId, setUpdateId] = useState<string | null>(null);

    // Add signature state
    const [signatures, setSignatures] = useState<SignatureData[]>([]);
    const [currentSignature, setCurrentSignature] = useState<{index: number, data: SignatureData} | null>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
    const signaturePadRefs = useRef<any[]>([]);

    // Check authentication
    useEffect(() => {
        if (!token) {
            setErrors({ submit: t('authenticationRequired', 'Authentication required. Please log in again.') });
        }
    }, [token, t]);

    // Account selection logic
    useEffect(() => {
        if (loadingAccounts) return;

        const saved = localStorage.getItem('selectedDebitAccount');
        const selectedAccount = saved ? accounts.find(a => a.accountNumber === saved) : null;
        
        if (accounts.length === 1 || selectedAccount) {
            const account = selectedAccount || accounts[0];
            setFormData(prev => ({
                ...prev,
                debitAccountNumber: account.accountNumber,
                debitAccountName: account.accountHolderName || '',
            }));
            if (!selectedAccount) {
                localStorage.setItem('selectedDebitAccount', account.accountNumber);
            }
            
            // Debug: Check if this account requires signatures
            const accountType = account.TypeOfAccount || account.accountType || '';
            console.log('Auto-selected account:', account.accountNumber);
            console.log('Account type:', accountType);
            console.log('Requires signatures:', accountType === "Current");
            
            // If we're on step 1 and this is a Current account, we might want to prepare for signatures
            if (step === 1 && accountType === "Current") {
                console.log('Current account detected on step 1, preparing for signatures');
            }
        }
        
        // Handle update scenario
        if (location.state?.updateId) {
            setUpdateId(location.state.updateId);
            const fd = location.state.formData || {};
            setFormData(prev => ({
                ...prev,
                debitAccountNumber: fd.debitAccountNumber || prev.debitAccountNumber,
                debitAccountName: fd.debitAccountName || prev.debitAccountName,
                creditAccountNumber: fd.creditAccountNumber || prev.creditAccountNumber,
                creditAccountName: fd.creditAccountName || prev.creditAccountName,
                amount: fd.amount ? String(fd.amount) : prev.amount,
            }));
            setStep(3); // Skip to OTP step for updates
        }
    }, [accounts, loadingAccounts, location.state, step]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Real-time validation
        if (name === 'debitAccountNumber') {
            // Validate debit account number in real-time
            if (value.trim() === '') {
                setErrors(prev => ({ ...prev, debitAccountNumber: t('accountNumberRequired', 'Account number is required') }));
            } else if (value.length < 10) {
                setErrors(prev => ({ ...prev, debitAccountNumber: t('accountNumberTooShort', 'Account number is too short') }));
            } else if (value.length > 16) {
                setErrors(prev => ({ ...prev, debitAccountNumber: t('accountNumberTooLong', 'Account number is too long') }));
            } else if (!/^\d+$/.test(value)) {
                setErrors(prev => ({ ...prev, debitAccountNumber: t('accountNumberInvalid', 'Account number must contain only digits') }));
            } else {
                setErrors(prev => ({ ...prev, debitAccountNumber: undefined }));
            }
            
            // Set account holder name if account is found
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: value,
                    debitAccountName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedDebitAccount', value);
                
                // Log account type information for debugging
                const accountType = selected.TypeOfAccount || selected.accountType || '';
                console.log('Selected account type:', accountType);
                return;
            }
        }
        
        if (name === 'creditAccountNumber') {
            // Validate credit account number in real-time
            if (value.trim() !== '' && value.length < 10) {
                setErrors(prev => ({ ...prev, creditAccountNumber: t('accountNumberTooShort', 'Account number is too short') }));
            } else if (value.trim() !== '' && value.length > 16) {
                setErrors(prev => ({ ...prev, creditAccountNumber: t('accountNumberTooLong', 'Account number is too long') }));
            } else if (value.trim() !== '' && !/^\d+$/.test(value)) {
                setErrors(prev => ({ ...prev, creditAccountNumber: t('accountNumberInvalid', 'Account number must contain only digits') }));
            } else if (value.trim() !== '' && formData.debitAccountNumber === value) {
                setErrors(prev => ({ ...prev, creditAccountNumber: t('differentAccountRequired', 'Beneficiary account must be different') }));
            } else {
                setErrors(prev => ({ ...prev, creditAccountNumber: undefined }));
            }
            
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (name === 'amount') {
            // Validate amount in real-time
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            
            if (parts.length > 2) {
                setErrors(prev => ({ ...prev, amount: t('amountInvalidFormat', 'Invalid amount format') }));
                return;
            }
            
            if (parts[1] && parts[1].length > 2) {
                setErrors(prev => ({ ...prev, amount: t('amountInvalidFormat', 'Amount can have maximum 2 decimal places') }));
                return;
            }
            
            if (sanitizedValue === '') {
                setErrors(prev => ({ ...prev, amount: t('amountRequired', 'Amount is required') }));
            } else if (parseFloat(sanitizedValue) <= 0) {
                setErrors(prev => ({ ...prev, amount: t('amountGreaterThanZero', 'Amount must be greater than 0') }));
            } else if (parseFloat(sanitizedValue) > 10000000) {
                setErrors(prev => ({ ...prev, amount: t('amountTooLarge', 'Amount is too large') }));
            } else {
                setErrors(prev => ({ ...prev, amount: undefined }));
            }
            
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        
        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            // Validate OTP in real-time
            if (sanitizedValue.length === 6 && !/^\d{6}$/.test(sanitizedValue)) {
                setErrors(prev => ({ ...prev, otp: t('validOtpRequired', 'OTP must be 6 digits') }));
            } else if (sanitizedValue.length > 0 && sanitizedValue.length < 6) {
                setErrors(prev => ({ ...prev, otp: t('otpIncomplete', 'OTP must be 6 digits') }));
            } else {
                setErrors(prev => ({ ...prev, otp: undefined }));
            }
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'debitAccountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: value,
                    debitAccountName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedDebitAccount', value);
                return;
            }
        }
        
        if (name === 'amount') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;
            if (parts[1] && parts[1].length > 2) return;
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateCreditAccount = async (): Promise<boolean> => {
        if (formData.debitAccountNumber === formData.creditAccountNumber) {
            setErrors({ creditAccountNumber: t('differentAccountRequired', 'Beneficiary account must be different from debit account.') });
            return false;
        }
        
        if (!formData.creditAccountNumber.trim()) {
            setErrors({ creditAccountNumber: t('beneficiaryAccountRequired', 'Beneficiary account is required.') });
            return false;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:5268/api/Accounts/AccountNumExist/${formData.creditAccountNumber.trim()}`);
            if (response.ok) {
                const result = await response.json();
                setFormData(prev => ({ 
                    ...prev, 
                    creditAccountName: result.data?.accountHolderName || result.data?.name || '' 
                }));
                setErrors(prev => ({ ...prev, creditAccountNumber: undefined }));
                return true;
            } else {
                setErrors({ creditAccountNumber: t('accountNotFound', 'Beneficiary account not found.') });
                return false;
            }
        } catch (error) {
            setErrors({ creditAccountNumber: t('validationError', 'Error validating account.') });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        // Debit account validation
        if (!formData.debitAccountNumber.trim()) {
            errs.debitAccountNumber = t('accountNumberRequired', 'Please select an account');
        } else if (formData.debitAccountNumber.length < 10) {
            errs.debitAccountNumber = t('accountNumberTooShort', 'Account number is too short');
        } else if (formData.debitAccountNumber.length > 16) {
            errs.debitAccountNumber = t('accountNumberTooLong', 'Account number is too long');
        } else if (!/^\d+$/.test(formData.debitAccountNumber)) {
            errs.debitAccountNumber = t('accountNumberInvalid', 'Account number must contain only digits');
        }
        
        // Credit account validation
        if (!formData.creditAccountNumber.trim()) {
            errs.creditAccountNumber = t('beneficiaryAccountRequired', 'Beneficiary account is required');
        } else if (formData.creditAccountNumber.length < 10) {
            errs.creditAccountNumber = t('accountNumberTooShort', 'Account number is too short');
        } else if (formData.creditAccountNumber.length > 16) {
            errs.creditAccountNumber = t('accountNumberTooLong', 'Account number is too long');
        } else if (!/^\d+$/.test(formData.creditAccountNumber)) {
            errs.creditAccountNumber = t('accountNumberInvalid', 'Account number must contain only digits');
        } else if (formData.debitAccountNumber === formData.creditAccountNumber) {
            errs.creditAccountNumber = t('differentAccountRequired', 'Beneficiary account must be different from debit account.');
        }
        
        // Amount validation
        if (!formData.amount.trim()) {
            errs.amount = t('amountRequired', 'Amount is required');
        } else {
            const amountNum = parseFloat(formData.amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                errs.amount = t('validAmountRequired', 'Please enter a valid amount greater than 0');
            } else if (amountNum > 10000000) {
                errs.amount = t('amountTooLarge', 'Amount is too large');
            }
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please fix the errors in the form'));
        }
        
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errs: Errors = {};
        
        // OTP validation
        if (!formData.otp) {
            errs.otp = t('otpRequired', 'OTP is required');
        } else if (formData.otp.length !== 6) {
            errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
        } else if (!/^\d{6}$/.test(formData.otp)) {
            errs.otp = t('otpInvalid', 'OTP must contain only digits');
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please enter a valid OTP'));
        }
        
        return Object.keys(errs).length === 0;
    };

    const handleNext = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) return;
        
        const creditValid = await validateCreditAccount();
        if (!creditValid) return;
        
        // Check if signatures are required
        const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
        console.log('Account', formData.debitAccountNumber, 'requires signatures:', requiresSignatures);
        if (requiresSignatures) {
            // Initialize with one signature slot for Current accounts
            console.log('Initializing signature collection for Current account');
            setSignatures([{ signatoryName: '', signatureData: '' }]);
            setStep(2); // Go to signatures step
        } else {
            setStep(3); // Skip signatures, go to confirmation (was step 2)
        }
    };
    
    // Add new step for signatures
    const handleSignaturesNext = (e: FormEvent) => {
        e.preventDefault();
        
        // Validate that at least one signature is provided for Current accounts
        const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
        if (requiresSignatures) {
            if (signatures.length === 0) {
                setErrors({ signatures: 'At least one signature is required for Current accounts' });
                return;
            }
            
            // Validate signatures
            const hasEmptySignatures = signatures.some(sig => !sig.signatureData || sig.signatureData === '');
            const hasEmptyNames = signatures.some(sig => !sig.signatoryName.trim());
            
            if (hasEmptySignatures || hasEmptyNames) {
                setErrors({ signatures: 'Please provide all signatures and signatory names' });
                return;
            }
        }
        
        setStep(3); // Move to confirmation step (was step 2)
    };

    const handleRequestOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone || !token) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number or authentication token not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await sendFundTransferOTP(phone.trim());
            if (response.success || response.message) {
                const msg = response.message || t('otpSent', 'OTP sent to your phone.');
                setOtpMessage(msg);
                info(msg);
                setStep(4); // Move to OTP step (was step 3)
                setResendCooldown(30);
                
                const timer = setInterval(() => {
                    setResendCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                setResendTimer(timer);
            } else {
                setErrors({ submit: response.message || t('otpRequestFailed', 'Failed to send OTP.') });
            }
        } catch (error: any) {
            console.error('OTP request error:', error);
            setErrors({ submit: error?.response?.data?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || !token || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await sendFundTransferOTP(phone.trim());
            if (response.success || response.message) {
                setOtpMessage(t('otpResent', 'OTP resent successfully.'));
                setResendCooldown(30);
                
                const timer = setInterval(() => {
                    setResendCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                setResendTimer(timer);
            } else {
                setErrors({ submit: response.message || t('otpRequestFailed', 'Failed to send OTP.') });
            }
        } catch (error: any) {
            console.error('OTP resend error:', error);
            setErrors({ submit: error?.response?.data?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return; // This is now the OTP validation (step 4)

        if (!phone || !branch?.id || !token) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if signatures are required for this account
            const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
            console.log('Submitting transfer. Account requires signatures:', requiresSignatures);
            
            const payload: any = {
                phoneNumber: phone.trim(),
                branchId: branch.id,
                debitAccountNumber: formData.debitAccountNumber.trim(),
                creditAccountNumber: formData.creditAccountNumber.trim(),
                amount: parseFloat(formData.amount),
                otp: formData.otp.trim(),
                remark: '', // Add if you want to support remarks
            };

            // Add signatures if required
            if (requiresSignatures && signatures.length > 0) {
                console.log('Adding signatures to payload:', signatures);
                payload.signatures = signatures.map(sig => ({
                    signatoryName: sig.signatoryName,
                    signatureData: sig.signatureData
                }));
            } else {
                console.log('No signatures required or provided');
            }

            // Validate that all required fields have values
            if (!payload.phoneNumber || !payload.otp || !payload.debitAccountNumber || 
                !payload.creditAccountNumber || !payload.amount || isNaN(payload.amount)) {
                setErrors({ submit: t('missingRequiredFields', 'Please fill in all required fields.') });
                setIsSubmitting(false);
                return;
            }

            let response;
            if (updateId) {
                response = await updateFundTransfer(updateId, payload);
            } else {
                response = await submitFundTransfer(payload);
            }

            if (response && (response.success || response.data)) {
                // Create approval workflow for new transfers
                if (!updateId) {
                    await createWorkflow({
                        voucherId: response.data?.id || '',
                        voucherType: 'transfer',
                        transactionType: 'transfer',
                        amount: parseFloat(formData.amount),
                        currency: 'ETB',
                        customerSegment: 'normal',
                        reason: 'Customer fund transfer request',
                        voucherData: payload,
                    });
                }
                
                showSuccess(updateId 
                    ? t('transferUpdated', 'Transfer updated successfully!') 
                    : t('transferSubmitted', 'Transfer submitted successfully!')
                );
                
                navigate('/fund-transfer-confirmation', { 
                    state: { 
                        serverData: response,
                        branchName: branch?.name,
                        ui: {
                            debitAccountNumber: formData.debitAccountNumber,
                            debitAccountName: formData.debitAccountName,
                            creditAccountNumber: formData.creditAccountNumber,
                            creditAccountName: formData.creditAccountName,
                            amount: formData.amount,
                        }
                    } 
                });
            } else {
                setErrors({ submit: response?.message || t('invalidOtp', 'Invalid or already used OTP. Please try again.') });
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            let errorMsg = t('submissionFailed', 'Submission failed. Please try again.');
            
            if (error?.response?.data?.errors) {
                const backendErrors = error.response.data.errors;
                errorMsg = Object.values(backendErrors).flat().join(', ');
            } else if (error?.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error?.message) {
                errorMsg = error.message;
            }
            
            setErrors({ submit: errorMsg });
            showError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add function to check if account requires signatures
    const checkIfAccountRequiresSignatures = (accountNumber: string): boolean => {
        const account = accounts.find(acc => acc.accountNumber === accountNumber);
        console.log('Checking if account requires signatures:');
        console.log('Account number:', accountNumber);
        console.log('Account object:', account);
        
        // Based on backend logic, only "Current" accounts require signatures
        // Check for both variations
        const accountType = account?.TypeOfAccount || account?.accountType || '';
        console.log('Account type:', accountType);
        const requiresSignatures = accountType === "Current";
        console.log('Requires signatures:', requiresSignatures);
        return requiresSignatures;
    };
    
    // Add signature handling functions
    const handleAddSignature = () => {
        setSignatures(prev => [...prev, { signatoryName: '', signatureData: '' }]);
    };
    
    const handleSignatureStart = (index: number) => {
        setCurrentSignature({ index, data: signatures[index] });
    };
    
    const handleSignatureEnd = (index: number) => {
        if (signaturePadRefs.current[index] && !signaturePadRefs.current[index].isEmpty()) {
            const signatureData = signaturePadRefs.current[index].toDataURL();
            setIsSignatureEmpty(false);
            
            const updatedSignatures = [...signatures];
            updatedSignatures[index] = {
                ...updatedSignatures[index],
                signatureData
            };
            setSignatures(updatedSignatures);
        }
    };
    
    const handleSignatureClear = (index: number) => {
        if (signaturePadRefs.current[index]) {
            signaturePadRefs.current[index].clear();
            const updatedSignatures = [...signatures];
            updatedSignatures[index] = {
                ...updatedSignatures[index],
                signatureData: ''
            };
            setSignatures(updatedSignatures);
            setIsSignatureEmpty(true);
        }
    };
    
    const handleSignatoryNameChange = (index: number, name: string) => {
        const updatedSignatures = [...signatures];
        updatedSignatures[index] = {
            ...updatedSignatures[index],
            signatoryName: name
        };
        setSignatures(updatedSignatures);
    };
    
    const handleRemoveSignature = (index: number) => {
        const updatedSignatures = signatures.filter((_, i) => i !== index);
        setSignatures(updatedSignatures);
    };
    
    const checkApprovalStatus = () => {
        const approvalCheck = requiresTransactionApproval(
            'transfer',
            Number(formData.amount),
            'ETB',
            'normal'
        );

        if (approvalCheck.required) {
            return (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-orange-800 font-medium">
                        ⚠️ {t('approvalRequired', 'This transaction will require manager approval')}
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                        {approvalCheck.reason}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Loading states
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!loadingAccounts && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('refresh', 'Refresh')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with fuchsia-700 */}
                    <header className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-lg font-bold">{t('fundTransfer', 'Fund Transfer')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('branch', 'Branch')}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Step 1: Account Details */}
                        {step === 1 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <Field 
                                            label={t('debitAccount', 'Debit Account')} 
                                            required 
                                            error={errors.debitAccountNumber}
                                        >
                                            {accountDropdown ? (
                                                <select 
                                                    name="debitAccountNumber" 
                                                    value={formData.debitAccountNumber} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                                    id="debitAccountNumber"
                                                >
                                                    <option value="">{t('selectAccount', 'Select account')}</option>
                                                    {accounts.map(acc => {
                                                        const requiresSignatures = checkIfAccountRequiresSignatures(acc.accountNumber);
                                                        return (
                                                            <option key={acc.accountNumber} value={acc.accountNumber}>
                                                                {acc.accountNumber} - {acc.accountHolderName} 
                                                                {requiresSignatures ? ' (Signatures Required)' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    name="debitAccountNumber" 
                                                    value={formData.debitAccountNumber} 
                                                    onChange={handleChange} 
                                                    readOnly={accounts.length === 1}
                                                    className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50"
                                                    id="debitAccountNumber"
                                                />
                                            )}
                                        </Field>
                                        
                                        {/* Show account type information */}
                                        {formData.debitAccountNumber && (
                                            <div className="mt-2 text-sm text-amber-700">
                                                Account type: {accounts.find(acc => acc.accountNumber === formData.debitAccountNumber)?.TypeOfAccount || accounts.find(acc => acc.accountNumber === formData.debitAccountNumber)?.accountType || 'Unknown'}
                                                <br />
                                                {checkIfAccountRequiresSignatures(formData.debitAccountNumber) 
                                                    ? '✅ Signatures required for this account type' 
                                                    : 'ℹ️ Signatures not required for this account type'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Field 
                                            label={t('accountHolderName', 'Account Holder Name')} 
                                            required 
                                            error={errors.debitAccountName}
                                        >
                                            <input 
                                                type="text" 
                                                name="debitAccountName" 
                                                value={formData.debitAccountName} 
                                                readOnly 
                                                className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50"
                                                id="debitAccountName"
                                            />
                                        </Field>
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('creditAccount', 'Credit Account')} 
                                            required 
                                            error={errors.creditAccountNumber}
                                        >
                                            <input 
                                                type="text" 
                                                name="creditAccountNumber" 
                                                value={formData.creditAccountNumber} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                                placeholder={t('enterCreditAccount', 'Enter credit account number')}
                                                id="creditAccountNumber"
                                            />
                                        </Field>
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('amount', 'Amount (ETB)')} 
                                            required 
                                            error={errors.amount}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-amber-700 font-medium">ETB</span>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="amount" 
                                                    value={formData.amount} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 pl-16 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                                    placeholder="0.00"
                                                    id="amount"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium flex items-center gap-2"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Signatures (new step) */}
                        {step === 2 && (
                            <form onSubmit={handleSignaturesNext} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                        <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                            <Signature className="h-5 w-5" />
                                            {t('signaturesRequired', 'Signatures Required')}
                                        </h3>
                                        
                                        <p className="text-sm text-amber-700 mb-4">
                                            {t('signatureInstructions', 'Your account requires digital signatures for this transaction. Please provide signatures for all authorized signatories.')}
                                        </p>
                                        
                                        <div className="space-y-4">
                                            {signatures.map((signature, index) => (
                                                <div key={index} className="border border-amber-200 rounded-lg p-4 bg-white">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-medium text-amber-800">
                                                            {t('signatory', 'Signatory')} {index + 1}
                                                        </h4>
                                                        {signatures.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSignature(index)}
                                                                className="text-red-500 hover:text-red-700 text-sm"
                                                            >
                                                                {t('remove', 'Remove')}
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-amber-700 mb-1">
                                                            {t('signatoryName', 'Signatory Name')}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={signature.signatoryName}
                                                            onChange={(e) => handleSignatoryNameChange(index, e.target.value)}
                                                            className="w-full p-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                            placeholder={t('enterSignatoryName', 'Enter signatory name')}
                                                        />
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                                                        <div className="bg-white rounded-lg p-2 mb-3">
                                                            <SignatureCanvas
                                                                ref={(ref) => {
                                                                    signaturePadRefs.current[index] = ref;
                                                                }}
                                                                onBegin={() => handleSignatureStart(index)}
                                                                onEnd={() => handleSignatureEnd(index)}
                                                                canvasProps={{
                                                                    className: "w-full h-32 bg-white border border-gray-300 rounded-md cursor-crosshair"
                                                                }}
                                                                penColor="black"
                                                                backgroundColor="white"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSignatureClear(index)}
                                                                className="flex items-center gap-1 px-3 py-1 text-sm text-amber-700 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50"
                                                            >
                                                                <Eraser className="h-3 w-3" />
                                                                {t('clear', 'Clear')}
                                                            </button>
                                                            
                                                            <div className="text-xs text-gray-500">
                                                                {!signature.signatureData ? (
                                                                    <span className="text-amber-600">
                                                                        {t('signaturePending', 'Signature pending')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-600 flex items-center gap-1">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        {t('signed', 'Signed')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <button
                                                type="button"
                                                onClick={handleAddSignature}
                                                className="w-full py-2 text-amber-700 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 flex items-center justify-center gap-2"
                                            >
                                                <PenTool className="h-4 w-4" />
                                                {t('addAnotherSignatory', 'Add Another Signatory')}
                                            </button>
                                        </div>
                                        
                                        {errors.signatures && (
                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-700">{errors.signatures}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-amber-300 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        <span>{t('back', 'Back')}</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium flex items-center gap-2 justify-center"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}
                        
                        {/* Step 3: Confirmation (was Step 2) */}
                        {step === 3 && (
                            <form onSubmit={handleRequestOtp} className="space-y-6">
                                <div className="space-y-4">
                                    {checkApprovalStatus()}
                                    
                                    <div className="bg-amber-50 rounded-lg p-4 space-y-3 border border-amber-100">
                                        <div className="flex justify-between items-center py-2 border-b border-amber-200">
                                            <span className="font-medium text-amber-800">{t('fromAccount', 'From Account')}:</span>
                                            <span className="font-mono font-semibold">{formData.debitAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-amber-200">
                                            <span className="font-medium text-amber-800">{t('toAccount', 'To Account')}:</span>
                                            <span className="font-mono font-semibold">{formData.creditAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-amber-200">
                                            <span className="font-medium text-amber-800">{t('accountHolder', 'Account Holder')}:</span>
                                            <span className="font-semibold">{formData.debitAccountName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-medium text-amber-800">{t('amount', 'Amount')}:</span>
                                            <span className="text-lg font-bold text-amber-700">
                                                {Number(formData.amount).toLocaleString()} ETB
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
                                            if (requiresSignatures) {
                                                setStep(2); // Go back to signatures step
                                            } else {
                                                setStep(1); // Go back to account details
                                            }
                                        }}
                                        className="border border-amber-300 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        <span>{t('back', 'Back')}</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {otpLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('requestingOtp', 'Requesting OTP...')}
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                {t('requestOtp', 'Request OTP')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: OTP Verification (was Step 3) */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('otpVerification', 'OTP Verification')}
                                    </h2>
                                    
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-amber-700">
                                            {t('otpSentMessage', 'An OTP has been sent to your phone number:')} 
                                            <strong className="text-amber-900"> {phone}</strong>
                                        </p>
                                        {otpMessage && (
                                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {otpMessage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-w-md">
                                        <Field 
                                            label={t('enterOtp', 'Enter OTP')} 
                                            required 
                                            error={errors.otp}
                                        >
                                            <input 
                                                type="text" 
                                                name="otp" 
                                                value={formData.otp} 
                                                onChange={handleChange} 
                                                maxLength={6}
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono bg-amber-50"
                                                placeholder="000000"
                                            />
                                        </Field>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || otpLoading}
                                                className="text-sm text-amber-700 hover:text-amber-800 disabled:text-gray-400"
                                            >
                                                {resendCooldown > 0 
                                                    ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) 
                                                    : t('resendOtp', 'Resend OTP')
                                                }
                                            </button>
                                            <span className="text-sm text-gray-500">
                                                {formData.otp.length}/6
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(3)} // Go back to confirmation step
                                        className="border border-amber-300 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otp.length !== 6}
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('processing', 'Processing...')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                {updateId ? t('updateTransfer', 'Update Transfer') : t('verifyAndSubmit', 'Verify & Submit')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}