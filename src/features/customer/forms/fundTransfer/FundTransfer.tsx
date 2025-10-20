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
import { exchangeRateService } from '../../../../services/exchangeRateService';
import { isDiasporaAccount } from '../../../../services/accountTypeService';
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
    currency: string; // Add currency field
    // Add a flag to track if credit account has been verified
    isCreditAccountVerified: boolean;
}

// Add signature interface
interface SignatureData {
    signatoryName: string;
    signatureData: string;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string; signatures?: string };

// Define currency types
type Currency = {
    code: string;
    name: string;
    rate: number; // ETB to currency rate
};

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
        currency: 'ETB', // Default to ETB
        isCreditAccountVerified: false, // Initialize as false
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
    const [exchangeRates, setExchangeRates] = useState<Currency[]>([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null); // Track selected account

    // Load exchange rates
    useEffect(() => {
        const loadExchangeRates = async () => {
            try {
                const rates = await exchangeRateService.getRates();
                const currencies: Currency[] = rates.map(rate => ({
                    code: rate.currencyCode,
                    name: rate.currencyName,
                    rate: rate.transactionSelling // Use transaction selling rate for transfers
                }));
                // Add ETB as default currency
                setExchangeRates([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }, ...currencies]);
            } catch (error) {
                console.error('Failed to load exchange rates:', error);
            }
        };
        loadExchangeRates();
    }, []);

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
            setSelectedAccount(account);
            setFormData(prev => ({
                ...prev,
                debitAccountNumber: account.accountNumber,
                debitAccountName: account.accountHolderName || '',
                currency: account.isDiaspora ? 'USD' : 'ETB' // Default to USD for Diaspora accounts
            }));
            if (!selectedAccount) {
                localStorage.setItem('selectedDebitAccount', account.accountNumber);
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
                setSelectedAccount(selected);
                setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: value,
                    debitAccountName: selected.accountHolderName || '',
                    currency: selected.isDiaspora ? 'USD' : 'ETB' // Default to USD for Diaspora accounts
                }));
                localStorage.setItem('selectedDebitAccount', value);
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
            
            // Reset verification status when account number changes
            setFormData(prev => ({ ...prev, [name]: value, creditAccountName: '', isCreditAccountVerified: false }));
            return;
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

    // Modify function to fetch credit account holder name
    const fetchCreditAccountName = async (accountNumber: string) => {
        if (!accountNumber.trim()) {
            setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
            setErrors(prev => ({ ...prev, creditAccountNumber: undefined }));
            return;
        }

        try {
            const response = await fetch(`http://localhost:5268/api/Accounts/AccountNumExist/${accountNumber.trim()}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setFormData(prev => ({ 
                        ...prev, 
                        creditAccountName: result.data.accountHolderName || result.data.name || '',
                        isCreditAccountVerified: true // Set verification flag to true
                    }));
                    setErrors(prev => ({ ...prev, creditAccountNumber: undefined })); // Clear any previous errors
                } else {
                    // Account not found
                    setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
                    setErrors(prev => ({ ...prev, creditAccountNumber: t('accountNotFound', 'Beneficiary account not found.') }));
                }
            } else {
                // HTTP error response
                setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
                setErrors(prev => ({ ...prev, creditAccountNumber: t('accountNotFound', 'Beneficiary account not found.') }));
            }
        } catch (error) {
            console.error('Error fetching credit account name:', error);
            setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
            setErrors(prev => ({ ...prev, creditAccountNumber: t('validationError', 'Error validating account.') }));
        }
    };

    const validateCreditAccount = async (): Promise<boolean> => {
        // Check if account is already verified
        if (formData.isCreditAccountVerified) {
            return true;
        }
        
        // If not verified, check if there's an error message already (account not found)
        if (errors.creditAccountNumber) {
            return false;
        }
        
        // If no error but also not verified, show verification error
        setErrors({ creditAccountNumber: t('accountNotVerified', 'Please verify the beneficiary account by clicking the Verify button.') });
        return false;
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
        
        // Credit account validation - now also checks if it's verified
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
        } else if (!formData.isCreditAccountVerified) {
            errs.creditAccountNumber = t('accountNotVerified', 'Please verify the beneficiary account by clicking the Verify button.');
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
        
        // Check if signatures are required (backend logic - only for Current accounts)
        const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
        if (requiresSignatures) {
            // Initialize with one signature slot for Current accounts
            setSignatures([{ signatoryName: '', signatureData: '' }]);
            setStep(2); // Go to signatures step
        } else {
            setStep(3); // Skip signatures, go to confirmation
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
        
        setStep(3); // Move to confirmation step
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
                setStep(4); // Move to OTP step
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

    // Function to convert amount based on currency
    const convertAmount = (amount: string, fromCurrency: string): string => {
        if (!amount || fromCurrency === 'ETB') return amount;
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) return amount;
        
        const rate = exchangeRates.find(c => c.code === fromCurrency)?.rate;
        if (!rate) return amount;
        
        // Convert to ETB
        return (amountNum * rate).toFixed(2);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return; // This is the OTP validation

        if (!phone || !branch?.id || !token) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if signatures are required for this account
            const requiresSignatures = checkIfAccountRequiresSignatures(formData.debitAccountNumber);
            
            // Convert amount to ETB if needed for backend processing
            const amountInETB = convertAmount(formData.amount, formData.currency);
            
            const payload: any = {
                phoneNumber: phone.trim(),
                branchId: branch.id,
                debitAccountNumber: formData.debitAccountNumber.trim(),
                creditAccountNumber: formData.creditAccountNumber.trim(),
                amount: parseFloat(amountInETB),
                otp: formData.otp.trim(),
                remark: '', // Add if you want to support remarks
            };

            // Add signatures if required
            if (requiresSignatures && signatures.length > 0) {
                payload.signatures = signatures.map(sig => ({
                    signatoryName: sig.signatoryName,
                    signatureData: sig.signatureData
                }));
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
                        amount: parseFloat(amountInETB),
                        currency: 'ETB', // Always use ETB for internal processing
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
                            currency: formData.currency,
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

    // Add function to check if account requires signatures (backend logic only)
    const checkIfAccountRequiresSignatures = (accountNumber: string): boolean => {
        const account = accounts.find(acc => acc.accountNumber === accountNumber);
        // Based on backend logic, only "Current" accounts require signatures
        const accountType = account?.TypeOfAccount || account?.accountType || '';
        const requiresSignatures = accountType === "Current";
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
            Number(convertAmount(formData.amount, formData.currency)), // Convert to ETB for approval check
            'ETB', // Always use ETB for internal processing
            'normal'
        );

        if (approvalCheck.required) {
            return (
                <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 font-medium">
                        ⚠️ {t('approvalRequired', 'This transaction will require manager approval')}
                    </p>
                    <p className="text-sm text-fuchsia-700 mt-1">
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
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 transition-all"
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
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 transition-all"
                        >
                            {t('refresh', 'Refresh')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-fuchsia-200 focus-within:border-fuchsia-700 transition-colors duration-200">
                    {/* Header with brand gradient */}
              <header className="bg-fuchsia-700 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold">{t('fundTransfer', 'Fund Transfer')}</h1>
                                    <div className="flex items-center gap-2 text-amber-100 text-xs mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{branch?.name || t('branch', 'Branch')}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="bg-white text-fuchsia-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 flex items-center gap-1"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </button>
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        {phone}
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
                                                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    id="debitAccountNumber"
                                                >
                                                    <option value="">{t('selectAccount', 'Select account')}</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                                            {acc.accountNumber} - {acc.accountHolderName} {acc.isDiaspora ? '(Diaspora)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    name="debitAccountNumber" 
                                                    value={formData.debitAccountNumber} 
                                                    onChange={handleChange} 
                                                    readOnly={accounts.length === 1}
                                                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    id="debitAccountNumber"
                                                />
                                            )}
                                        </Field>
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
                                                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
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
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    name="creditAccountNumber" 
                                                    value={formData.creditAccountNumber} 
                                                    onChange={handleChange} 
                                                    className="flex-1 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    placeholder={t('enterCreditAccount', 'Enter credit account number')}
                                                    id="creditAccountNumber"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fetchCreditAccountName(formData.creditAccountNumber)}
                                                    disabled={!formData.creditAccountNumber || formData.creditAccountNumber.length < 10 || formData.creditAccountNumber.length > 16 || !/^\d+$/.test(formData.creditAccountNumber)}
                                                    className="bg-fuchsia-700 text-white px-4 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 transition-all"
                                                >
                                                    {t('verify', 'Verify')}
                                                </button>
                                            </div>
                                        </Field>
                                        
                                        {/* Display credit account holder name for verification - only when verified */}
                                        {formData.isCreditAccountVerified && formData.creditAccountName && (
                                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-800">{t('accountHolder', 'Account Holder')}</p>
                                                    <p className="text-green-700 font-semibold">{formData.creditAccountName}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('amount', 'Amount')} 
                                            required 
                                            error={errors.amount}
                                        >
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-fuchsia-700 font-medium">
                                                            {formData.currency}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        name="amount" 
                                                        value={formData.amount} 
                                                        onChange={handleChange} 
                                                        className="w-full p-3 pl-16 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                        placeholder="0.00"
                                                        id="amount"
                                                    />
                                                </div>
                                                
                                                {/* Currency selector for Diaspora accounts */}
                                                {selectedAccount?.isDiaspora && (
                                                    <select
                                                        name="currency"
                                                        value={formData.currency}
                                                        onChange={handleChange}
                                                        className="w-24 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    >
                                                        {exchangeRates.map(currency => (
                                                            <option key={currency.code} value={currency.code}>
                                                                {currency.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            
                                            {/* Display equivalent ETB amount for Diaspora accounts */}
                                            {selectedAccount?.isDiaspora && formData.amount && formData.currency !== 'ETB' && (
                                                <div className="mt-2 text-sm text-fuchsia-700">
                                                    {t('equivalentAmount', 'Equivalent ETB Amount')}: {convertAmount(formData.amount, formData.currency)} ETB
                                                </div>
                                            )}
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium flex items-center gap-2 transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
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
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 border border-fuchsia-200">
                                        <h3 className="text-md font-bold text-fuchsia-700 mb-3 flex items-center gap-2">
                                            <Signature className="h-5 w-5" />
                                            {t('signaturesRequired', 'Signatures Required')}
                                        </h3>
                                        
                                        <p className="text-sm text-fuchsia-700 mb-4">
                                            {t('signatureInstructions', 'Your account requires digital signatures for this transaction. Please provide signatures for all authorized signatories.')}
                                        </p>
                                        
                                        <div className="space-y-4">
                                            {signatures.map((signature, index) => (
                                                <div key={index} className="border border-fuchsia-200 rounded-lg p-4 bg-white">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-medium text-fuchsia-800">
                                                            {t('signatory', 'Signatory')} {index + 1}
                                                        </h4>
                                                        {signatures.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSignature(index)}
                                                                className="text-red-500 hover:text-red-700 text-sm transition-colors"
                                                            >
                                                                {t('remove', 'Remove')}
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                                            {t('signatoryName', 'Signatory Name')}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={signature.signatoryName}
                                                            onChange={(e) => handleSignatoryNameChange(index, e.target.value)}
                                                            className="w-full p-2 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 transition-colors duration-200"
                                                            placeholder={t('enterSignatoryName', 'Enter signatory name')}
                                                        />
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 border border-fuchsia-300 rounded-lg p-3">
                                                        <div className="bg-white rounded-lg p-2 mb-3">
                                                            <SignatureCanvas
                                                                ref={(ref) => {
                                                                    signaturePadRefs.current[index] = ref;
                                                                }}
                                                                onBegin={() => handleSignatureStart(index)}
                                                                onEnd={() => handleSignatureEnd(index)}
                                                                canvasProps={{
                                                                    className: "w-full h-32 bg-white border border-fuchsia-300 rounded-md cursor-crosshair"
                                                                }}
                                                                penColor="black"
                                                                backgroundColor="white"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSignatureClear(index)}
                                                                className="flex items-center gap-1 px-3 py-1 text-sm text-fuchsia-700 border border-dashed border-fuchsia-300 rounded-lg hover:bg-fuchsia-50 transition-all"
                                                            >
                                                                <Eraser className="h-3 w-3" />
                                                                {t('clear', 'Clear')}
                                                            </button>
                                                            
                                                            <div className="text-xs text-gray-500">
                                                                {!signature.signatureData ? (
                                                                    <span className="text-fuchsia-600">
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
                                                className="w-full py-2 text-fuchsia-700 border border-dashed border-fuchsia-300 rounded-lg hover:bg-fuchsia-50 flex items-center justify-center gap-2 transition-all"
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
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        <span>{t('back', 'Back')}</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}
                        
                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <form onSubmit={handleRequestOtp} className="space-y-6">
                                <div className="space-y-4">
                                    {checkApprovalStatus()}
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
                                        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                            <span className="font-medium text-fuchsia-800">{t('fromAccount', 'From Account')}:</span>
                                            <span className="font-mono font-semibold text-fuchsia-900">{formData.debitAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                            <span className="font-medium text-fuchsia-800">{t('toAccount', 'To Account')}:</span>
                                            <span className="font-mono font-semibold text-fuchsia-900">{formData.creditAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                            <span className="font-medium text-fuchsia-800">{t('accountHolder', 'Account Holder')}:</span>
                                            <span className="font-semibold text-fuchsia-900">{formData.debitAccountName}</span>
                                        </div>
                                        {/* Display beneficiary name in confirmation step */}
                                        {formData.isCreditAccountVerified && formData.creditAccountName && (
                                            <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                                <span className="font-medium text-fuchsia-800">{t('beneficiaryName', 'Beneficiary Name')}:</span>
                                                <span className="font-semibold text-fuchsia-900">{formData.creditAccountName}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-medium text-fuchsia-800">{t('amount', 'Amount')}:</span>
                                            <span className="text-lg font-bold text-fuchsia-700">
                                                {Number(formData.amount).toLocaleString()} {formData.currency}
                                                {selectedAccount?.isDiaspora && formData.currency !== 'ETB' && (
                                                    <div className="text-sm font-normal">
                                                        ({convertAmount(formData.amount, formData.currency)} ETB)
                                                    </div>
                                                )}
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
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        <span>{t('back', 'Back')}</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        {otpLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('requestingOtp', 'Requesting OTP...')}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {t('requestOtp', 'Request OTP')}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: OTP Verification */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-fuchsia-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('otpVerification', 'OTP Verification')}
                                    </h2>
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-fuchsia-700">
                                            {t('otpSentMessage', 'An OTP has been sent to your phone number:')} 
                                            <strong className="text-fuchsia-900"> {phone}</strong>
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
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 font-mono bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                placeholder="000000"
                                            />
                                        </Field>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || otpLoading}
                                                className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400 transition-colors"
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
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otp.length !== 6}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('processing', 'Processing...')}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {updateId ? t('updateTransfer', 'Update Transfer') : t('verifyAndSubmit', 'Verify & Submit')}
                                            </div>
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