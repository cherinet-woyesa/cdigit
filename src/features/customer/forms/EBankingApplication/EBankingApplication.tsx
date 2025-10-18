import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { applyEBankingApplication, getEBankingApplicationById, updateEBankingApplication } from '../../../../services/eBankingApplicationService';
import authService from '../../../../services/authService';
import Field from '../../../../components/Field';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    User,
    Shield,
    FileText,
    Home,
    Wifi,
    MapPin
} from 'lucide-react';
import { getRegions, getZones, getWoredas } from '../../../../services/addressService';

// Error message component (consistent with other forms)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

// Success message component
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

type FormData = {
    accountNumber: string;
    customerName: string;
    mobileNumber: string;
    nationalId: string;
    idType: string;
    idNumber: string;
    issuingAuthority: string;
    idIssueDate: string;
    idExpiryDate: string;
    region: string;
    zone: string;
    wereda: string;
    houseNumber: string;
    ebankingChannels: string[];
    termsAccepted: boolean;
    idCopyAttached: boolean;
    otpCode: string;
};

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

const E_BANKING_OPTIONS = [
    { id: 'mobile_banking', label: 'Mobile Banking', icon: '📱' },
    { id: 'internet_banking', label: 'Internet Banking', icon: '💻' },
    { id: 'ussd', label: 'USSD Banking', icon: '*️⃣' },
    { id: 'card_banking', label: 'Card Banking', icon: '💳' },
];

export default function EBankingApplication() {
    const { t } = useTranslation();
    const { phone, user, token } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const { accounts, loadingAccounts, errorAccounts, refreshAccounts } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        customerName: '',
        mobileNumber: phone || '',
        nationalId: '',
        idType: 'national_id',
        idNumber: '',
        issuingAuthority: 'NIRA',
        idIssueDate: '',
        idExpiryDate: '',
        region: '',
        zone: '',
        wereda: '',
        houseNumber: '',
        ebankingChannels: [],
        termsAccepted: false,
        idCopyAttached: false,
        otpCode: '',
    });

    // Address dropdown states
    const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
    const [zones, setZones] = useState<{ id: number; name: string; regionId: number }[]>([]);
    const [woredas, setWoredas] = useState<{ id: number; name: string; zoneId: number }[]>([]);
    const [regionLoading, setRegionLoading] = useState(false);
    const [zoneLoading, setZoneLoading] = useState(false);
    const [woredaLoading, setWoredaLoading] = useState(false);

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Initialize form data from accounts
    useEffect(() => {
        if (loadingAccounts) return;

        if (!accounts || accounts.length === 0) {
            setFormData(prev => ({ ...prev, accountNumber: '', customerName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const account = accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                customerName: account.accountHolderName || prev.customerName,
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedEBankingAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                customerName: selectedAccount.accountHolderName || prev.customerName,
            }));
        }
    }, [accounts, loadingAccounts]);

    // Handle cleanup of timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    // Update mode detection
    useEffect(() => {
        const id = location.state?.updateId as string | undefined;
        if (!id) return;
        
        setUpdateId(id);
        (async () => {
            try {
                const res = await getEBankingApplicationById(id);
                const d: any = res?.data || {};
                const services: string[] = d.ServicesRequested 
                    ? String(d.ServicesRequested).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];

                setFormData(prev => ({
                    ...prev,
                    accountNumber: d.AccountNumber || d.accountNumber || prev.accountNumber,
                    customerName: d.AccountHolderName || d.accountHolderName || prev.customerName,
                    mobileNumber: d.PhoneNumber || d.phoneNumber || prev.mobileNumber,
                    ebankingChannels: services,
                }));
                setStep(4); // Start at review step for updates
            } catch (e) {
                console.error('Failed to load e-banking application for update:', e);
            }
        })();
    }, [location.state]);

    // Load regions on component mount
    useEffect(() => {
        setRegionLoading(true);
        getRegions()
            .then(res => setRegions(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load regions"))
            .finally(() => setRegionLoading(false));
    }, []);

    // Load zones when region changes
    useEffect(() => {
        if (!formData.region) {
            setZones([]);
            setFormData(prev => ({ ...prev, zone: '', wereda: '' }));
            return;
        }
        setZoneLoading(true);
        const selectedRegion = regions.find(r => r.name === formData.region);
        if (!selectedRegion) {
            setZones([]);
            setZoneLoading(false);
            return;
        }
        getZones(selectedRegion.id)
            .then(res => setZones(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load zones"))
            .finally(() => setZoneLoading(false));
    }, [formData.region, regions]);

    // Load woredas when zone changes
    useEffect(() => {
        if (!formData.zone) {
            setWoredas([]);
            setFormData(prev => ({ ...prev, wereda: '' }));
            return;
        }
        setWoredaLoading(true);
        const selectedZone = zones.find(z => z.name === formData.zone);
        if (!selectedZone) {
            setWoredas([]);
            setWoredaLoading(false);
            return;
        }
        getWoredas(selectedZone.id)
            .then(res => setWoredas(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load woredas"))
            .finally(() => setWoredaLoading(false));
    }, [formData.zone, zones]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Reset dependent fields when parent field changes
        if (name === "region") {
            setFormData(prev => ({ ...prev, region: value, zone: '', wereda: '' }));
        } else if (name === "zone") {
            setFormData(prev => ({ ...prev, zone: value, wereda: '' }));
        } else if (name === "wereda") {
            setFormData(prev => ({ ...prev, wereda: value }));
        } else if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            
            if (name === 'termsAccepted') {
                setFormData(prev => ({ ...prev, [name]: checked }));
                // Clear error when checkbox is checked
                if (checked) {
                    setErrors(prev => ({ ...prev, termsAccepted: undefined }));
                }
            } else if (name === 'idCopyAttached') {
                setFormData(prev => ({ ...prev, [name]: checked }));
            } else {
                const channel = (e.target as HTMLInputElement).value;
                setFormData(prev => ({
                    ...prev,
                    ebankingChannels: checked
                        ? [...prev.ebankingChannels, channel]
                        : prev.ebankingChannels.filter(c => c !== channel)
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Real-time validation feedback
        if (step === 1) {
            if (name === 'accountNumber') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, accountNumber: t('accountNumberRequired', 'Account number is required') }));
                } else if (value.length < 10) {
                    setErrors(prev => ({ ...prev, accountNumber: t('accountNumberTooShort', 'Account number is too short') }));
                } else if (value.length > 16) {
                    setErrors(prev => ({ ...prev, accountNumber: t('accountNumberTooLong', 'Account number is too long') }));
                } else if (!/^\d+$/.test(value)) {
                    setErrors(prev => ({ ...prev, accountNumber: t('accountNumberInvalid', 'Account number must contain only digits') }));
                } else {
                    setErrors(prev => ({ ...prev, accountNumber: undefined }));
                }
            }
            
            if (name === 'customerName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, customerName: t('customerNameRequired', 'Customer name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, customerName: t('customerNameTooShort', 'Customer name is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, customerName: undefined }));
                }
            }
            
            if (name === 'mobileNumber') {
                const cleanPhone = value.replace(/[^\d]/g, '');
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, mobileNumber: t('mobileNumberRequired', 'Mobile number is required') }));
                } else if (cleanPhone.length < 9) {
                    setErrors(prev => ({ ...prev, mobileNumber: t('mobileNumberTooShort', 'Mobile number is too short') }));
                } else if (cleanPhone.length > 12) {
                    setErrors(prev => ({ ...prev, mobileNumber: t('mobileNumberTooLong', 'Mobile number is too long') }));
                } else if (!/^(\+251|0)?[97]\d{8}$/.test(cleanPhone)) {
                    setErrors(prev => ({ ...prev, mobileNumber: t('mobileNumberInvalid', 'Invalid mobile number format') }));
                } else {
                    setErrors(prev => ({ ...prev, mobileNumber: undefined }));
                }
            }
        }
        
        if (step === 2) {
            if (name === 'idNumber') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, idNumber: t('idNumberRequired', 'ID number is required') }));
                } else if (value.trim() !== '' && value.length < 5) {
                    setErrors(prev => ({ ...prev, idNumber: t('idNumberTooShort', 'ID number is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, idNumber: undefined }));
                }
            }
            
            if (name === 'issuingAuthority') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, issuingAuthority: t('issuingAuthorityRequired', 'Issuing authority is required') }));
                } else if (value.trim() !== '' && value.length < 2) {
                    setErrors(prev => ({ ...prev, issuingAuthority: t('issuingAuthorityTooShort', 'Issuing authority is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, issuingAuthority: undefined }));
                }
            }
            
            // Date validation
            if (name === 'idIssueDate') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, idIssueDate: t('issueDateRequired', 'Issue date is required') }));
                } else if (value.trim() !== '') {
                    // Check if issue date is in the future
                    const issueDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (issueDate > today) {
                        setErrors(prev => ({ ...prev, idIssueDate: t('issueDateInFuture', 'Issue date cannot be in the future') }));
                    } else if (formData.idExpiryDate) {
                        // Check if issue date is before expiry date
                        const expiryDate = new Date(formData.idExpiryDate);
                        if (issueDate >= expiryDate) {
                            setErrors(prev => ({ ...prev, idIssueDate: t('issueDateAfterExpiry', 'Issue date must be before expiry date') }));
                        } else {
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.idIssueDate;
                                delete newErrors.idExpiryDate; // Also clear expiry date error if it was related
                                return newErrors;
                            });
                        }
                    } else {
                        setErrors(prev => ({ ...prev, idIssueDate: undefined }));
                    }
                } else {
                    setErrors(prev => ({ ...prev, idIssueDate: undefined }));
                }
            }
            
            if (name === 'idExpiryDate') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, idExpiryDate: t('expiryDateRequired', 'Expiry date is required') }));
                } else if (value.trim() !== '') {
                    // Check if expiry date is in the past
                    const expiryDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (expiryDate < today) {
                        setErrors(prev => ({ ...prev, idExpiryDate: t('expiryDateInPast', 'Expiry date cannot be in the past') }));
                    } else if (formData.idIssueDate) {
                        // Check if expiry date is after issue date
                        const issueDate = new Date(formData.idIssueDate);
                        if (expiryDate <= issueDate) {
                            setErrors(prev => ({ ...prev, idExpiryDate: t('expiryDateBeforeIssue', 'Expiry date must be after issue date') }));
                        } else {
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.idExpiryDate;
                                delete newErrors.idIssueDate; // Also clear issue date error if it was related
                                return newErrors;
                            });
                        }
                    } else {
                        setErrors(prev => ({ ...prev, idExpiryDate: undefined }));
                    }
                } else {
                    setErrors(prev => ({ ...prev, idExpiryDate: undefined }));
                }
            }
        }
        
        if (step === 3) {
            if (name === 'region') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, region: t('regionRequired', 'Region is required') }));
                } else if (value.trim() !== '' && value.length < 2) {
                    setErrors(prev => ({ ...prev, region: t('regionTooShort', 'Region is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, region: undefined }));
                }
            }
            
            if (name === 'zone') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, zone: t('zoneRequired', 'Zone is required') }));
                } else if (value.trim() !== '' && value.length < 2) {
                    setErrors(prev => ({ ...prev, zone: t('zoneTooShort', 'Zone is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, zone: undefined }));
                }
            }
            
            if (name === 'wereda') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, wereda: t('weredaRequired', 'Wereda is required') }));
                } else if (value.trim() !== '' && value.length < 2) {
                    setErrors(prev => ({ ...prev, wereda: t('weredaTooShort', 'Wereda is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, wereda: undefined }));
                }
            }
            
            if (name === 'houseNumber') {
                if (value.trim() === '' && !formData.idCopyAttached) {
                    setErrors(prev => ({ ...prev, houseNumber: t('houseNumberRequired', 'House number is required') }));
                } else if (value.trim() !== '' && value.length < 2) {
                    setErrors(prev => ({ ...prev, houseNumber: t('houseNumberTooShort', 'House number is too short') }));
                } else {
                    setErrors(prev => ({ ...prev, houseNumber: undefined }));
                }
            }
        }
        
        if (step === 4) {
            if (name === 'otpCode') {
                const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
                if (sanitizedValue.length === 6 && !/^\d{6}$/.test(sanitizedValue)) {
                    setErrors(prev => ({ ...prev, otp: t('validOtpRequired', 'OTP must be 6 digits') }));
                } else if (sanitizedValue.length > 0 && sanitizedValue.length < 6) {
                    setErrors(prev => ({ ...prev, otp: t('otpIncomplete', 'OTP must be 6 digits') }));
                } else {
                    setErrors(prev => ({ ...prev, otp: undefined }));
                }
            }
        }
    };

    const validateStep = (): boolean => {
        const errs: Errors = {};
        
        if (step === 1) {
            if (!formData.accountNumber.trim()) {
                errs.accountNumber = t('accountNumberRequired', 'Account number is required');
            } else if (formData.accountNumber.length < 10) {
                errs.accountNumber = t('accountNumberTooShort', 'Account number is too short');
            } else if (formData.accountNumber.length > 16) {
                errs.accountNumber = t('accountNumberTooLong', 'Account number is too long');
            } else if (!/^\d+$/.test(formData.accountNumber)) {
                errs.accountNumber = t('accountNumberInvalid', 'Account number must contain only digits');
            }
            
            if (!formData.customerName.trim()) {
                errs.customerName = t('customerNameRequired', 'Customer name is required');
            } else if (formData.customerName.length < 2) {
                errs.customerName = t('customerNameTooShort', 'Customer name is too short');
            }
            
            if (!formData.mobileNumber.trim()) {
                errs.mobileNumber = t('mobileNumberRequired', 'Mobile number is required');
            } else {
                const cleanPhone = formData.mobileNumber.replace(/[^\d]/g, '');
                if (cleanPhone.length < 9) {
                    errs.mobileNumber = t('mobileNumberTooShort', 'Mobile number is too short');
                } else if (cleanPhone.length > 12) {
                    errs.mobileNumber = t('mobileNumberTooLong', 'Mobile number is too long');
                } else if (!/^(\+251|0)?[97]\d{8}$/.test(cleanPhone)) {
                    errs.mobileNumber = t('mobileNumberInvalid', 'Invalid mobile number format');
                }
            }
        }
        
        if (step === 2 && !formData.idCopyAttached) {
            if (!formData.idNumber.trim()) {
                errs.idNumber = t('idNumberRequired', 'ID number is required');
            } else if (formData.idNumber.length < 5) {
                errs.idNumber = t('idNumberTooShort', 'ID number is too short');
            }
            
            if (!formData.issuingAuthority.trim()) {
                errs.issuingAuthority = t('issuingAuthorityRequired', 'Issuing authority is required');
            } else if (formData.issuingAuthority.length < 2) {
                errs.issuingAuthority = t('issuingAuthorityTooShort', 'Issuing authority is too short');
            }
            
            if (!formData.idIssueDate) {
                errs.idIssueDate = t('issueDateRequired', 'Issue date is required');
            } else {
                // Check if issue date is in the future
                const issueDate = new Date(formData.idIssueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (issueDate > today) {
                    errs.idIssueDate = t('issueDateInFuture', 'Issue date cannot be in the future');
                }
            }
            
            if (!formData.idExpiryDate) {
                errs.idExpiryDate = t('expiryDateRequired', 'Expiry date is required');
            } else {
                // Check if expiry date is in the past
                const expiryDate = new Date(formData.idExpiryDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (expiryDate < today) {
                    errs.idExpiryDate = t('expiryDateInPast', 'Expiry date cannot be in the past');
                }
            }
            
            // Check date relationship
            if (formData.idIssueDate && formData.idExpiryDate) {
                const issueDate = new Date(formData.idIssueDate);
                const expiryDate = new Date(formData.idExpiryDate);
                
                if (issueDate >= expiryDate) {
                    errs.idIssueDate = t('issueDateAfterExpiry', 'Issue date must be before expiry date');
                    errs.idExpiryDate = t('expiryDateBeforeIssue', 'Expiry date must be after issue date');
                }
            }
        }
        
        if (step === 3 && !formData.idCopyAttached) {
            if (!formData.region.trim()) {
                errs.region = t('regionRequired', 'Region is required');
            }
            
            if (!formData.zone.trim()) {
                errs.zone = t('zoneRequired', 'Zone is required');
            }
            
            if (!formData.wereda.trim()) {
                errs.wereda = t('weredaRequired', 'Wereda is required');
            }
            
            if (!formData.houseNumber.trim()) {
                errs.houseNumber = t('houseNumberRequired', 'House number is required');
            }
        }
        
        if (step === 5) {
            if (!formData.termsAccepted) {
                errs.termsAccepted = t('termsAcceptanceRequired', 'You must accept the terms and conditions');
            }
        }
        
        if (step === 6) {
            if (!formData.otpCode) {
                errs.otp = t('otpRequired', 'OTP is required');
            } else if (formData.otpCode.length !== 6) {
                errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
            } else if (!/^\d{6}$/.test(formData.otpCode)) {
                errs.otp = t('otpInvalid', 'OTP must contain only digits');
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleRequestOtp = async () => {
        if (!formData.mobileNumber && !phone) {
            setErrors({ submit: t('mobileNumberRequired', 'Mobile number is required') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const phoneNumber = formData.mobileNumber || phone || '';
            await authService.requestOtp(phoneNumber);
            setOtpMessage(t('otpSent', 'OTP sent successfully to your phone'));
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
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!formData.mobileNumber && !phone) return;
        if (resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const phoneNumber = formData.mobileNumber || phone || '';
            await authService.requestOtp(phoneNumber);
            setOtpMessage(t('otpResent', 'OTP resent successfully'));
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
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;

        if (!phone || !branch?.id) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        if (!formData.otpCode || formData.otpCode.length !== 6) {
            setErrors({ otp: t('validOtpRequired', 'Please enter the 6-digit OTP') });
            return;
        }

        setIsSubmitting(true);
        try {
            const isNationalId = formData.idType === 'national_id';
            
            // Submit with OTP directly (like withdrawal form)
            const payload = {
                PhoneNumber: formData.mobileNumber || phone,
                BranchId: branch.id,
                AccountNumber: formData.accountNumber,
                AccountHolderName: formData.customerName,
                OtpCode: formData.otpCode, // Send OTP directly with request
                NationalIdNumber: isNationalId ? formData.idNumber : undefined,
                AltIdNumber: !isNationalId ? formData.idNumber : undefined,
                AltIdIssuer: !isNationalId ? formData.issuingAuthority : undefined,
                ServicesSelected: formData.ebankingChannels, // This can be empty array now
                Region: !formData.idCopyAttached ? formData.region : undefined,
                City: !formData.idCopyAttached ? formData.zone : undefined,
                SubCity: !formData.idCopyAttached ? formData.zone : undefined,
                Wereda: !formData.idCopyAttached ? formData.wereda : undefined,
                HouseNumber: !formData.idCopyAttached ? formData.houseNumber : undefined,
                IdIssueDate: formData.idIssueDate ? new Date(formData.idIssueDate).toISOString() : undefined,
                IdExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate).toISOString() : undefined,
            };

            console.log('Submitting E-Banking application with payload:', payload);

            const response = updateId 
                ? await updateEBankingApplication(updateId, { ...payload, Id: updateId })
                : await applyEBankingApplication(payload as any);

            // Handle response like withdrawal form
            if (response && response.success) {
                navigate('/form/ebanking/confirmation', {
                    state: {
                        serverData: response,
                        branchName: branch.name,
                        ui: {
                            accountNumber: formData.accountNumber,
                            accountHolderName: formData.customerName,
                            mobileNumber: formData.mobileNumber,
                            ebankingChannels: formData.ebankingChannels,
                        }
                    }
                });
            } else {
                // Handle OTP errors specifically
                const errorMessage = response?.message || t('submissionFailed', 'Submission failed');
                if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                    setErrors({ otp: errorMessage });
                } else {
                    setErrors({ submit: errorMessage });
                }
            }
        } catch (error: any) {
            const errorMessage = error?.message || t('submissionFailed', 'Submission failed. Please try again.');
            if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                setErrors({ otp: errorMessage });
            } else {
                setErrors({ submit: errorMessage });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
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

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            case 5:
                return renderStep5();
            case 6:
                return renderStep6();
            default:
                return null;
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <Field 
                    label={t('accountNumber', 'Account Number')} 
                    required 
                    error={errors.accountNumber}
                >
                    <input
                        name="accountNumber"
                        type="text"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="accountNumber"
                    />
                </Field>
            </div>
            <div>
                <Field 
                    label={t('customerName', 'Customer Name')} 
                    required 
                    error={errors.customerName}
                >
                    <input
                        name="customerName"
                        type="text"
                        value={formData.customerName}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="customerName"
                    />
                </Field>
            </div>
            <div>
                <Field 
                    label={t('mobileNumber', 'Mobile Number')} 
                    required 
                    error={errors.mobileNumber}
                >
                    <input
                        name="mobileNumber"
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="mobileNumber"
                    />
                </Field>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('idType', 'ID Type')} required>
                    <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                    >
                        <option value="national_id">{t('nationalId', 'National ID')}</option>
                        <option value="passport">{t('passport', 'Passport')}</option>
                        <option value="driving_license">{t('drivingLicense', 'Driving License')}</option>
                    </select>
                </Field>
                <Field 
                    label={t('idNumber', 'ID Number')} 
                    required 
                    error={errors.idNumber}
                >
                    <input
                        name="idNumber"
                        type="text"
                        value={formData.idNumber}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="idNumber"
                    />
                </Field>
                <Field 
                    label={t('issuingAuthority', 'Issuing Authority')} 
                    required 
                    error={errors.issuingAuthority}
                >
                    <input
                        name="issuingAuthority"
                        type="text"
                        value={formData.issuingAuthority}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="issuingAuthority"
                    />
                </Field>
                <Field 
                    label={t('issueDate', 'Issue Date')} 
                    required 
                    error={errors.idIssueDate}
                >
                    <input
                        name="idIssueDate"
                        type="date"
                        value={formData.idIssueDate}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="idIssueDate"
                    />
                </Field>
                <Field 
                    label={t('expiryDate', 'Expiry Date')} 
                    required 
                    error={errors.idExpiryDate}
                >
                    <input
                        name="idExpiryDate"
                        type="date"
                        value={formData.idExpiryDate}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="idExpiryDate"
                    />
                </Field>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Region */}
                <Field 
                    label={t('region', 'Region')} 
                    required 
                    error={errors.region}
                >
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {regionLoading ? (
                            <div className="flex items-center gap-2 text-gray-500 pl-10 p-3 bg-amber-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">{t('loadingRegions', 'Loading regions...')}</span>
                            </div>
                        ) : (
                            <select
                                name="region"
                                value={formData.region || ""}
                                onChange={handleChange}
                                className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                id="region"
                            >
                                <option value="">{t('selectRegion', 'Select your region')}</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </Field>

                {/* Zone */}
                <Field 
                    label={t('zone', 'Zone')} 
                    required 
                    error={errors.zone}
                >
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {zoneLoading ? (
                            <div className="flex items-center gap-2 text-gray-500 pl-10 p-3 bg-amber-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">{t('loadingZones', 'Loading zones...')}</span>
                            </div>
                        ) : (
                            <select
                                name="zone"
                                value={formData.zone || ""}
                                onChange={handleChange}
                                disabled={!formData.region || zoneLoading}
                                className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                id="zone"
                            >
                                <option value="">{t('selectZone', 'Select your zone')}</option>
                                {zones.map(z => (
                                    <option key={z.id} value={z.name}>{z.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </Field>

                {/* Wereda */}
                <Field 
                    label={t('wereda', 'Wereda')} 
                    required 
                    error={errors.wereda}
                >
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {woredaLoading ? (
                            <div className="flex items-center gap-2 text-gray-500 pl-10 p-3 bg-amber-50 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">{t('loadingWoredas', 'Loading woredas...')}</span>
                            </div>
                        ) : (
                            <select
                                name="wereda"
                                value={formData.wereda || ""}
                                onChange={handleChange}
                                disabled={!formData.zone || woredaLoading}
                                className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                id="wereda"
                            >
                                <option value="">{t('selectWereda', 'Select your woreda')}</option>
                                {woredas.map(w => (
                                    <option key={w.id} value={w.name}>{w.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </Field>

                {/* House Number */}
                <Field 
                    label={t('houseNumber', 'House Number')} 
                    required 
                    error={errors.houseNumber}
                >
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            name="houseNumber"
                            type="text"
                            value={formData.houseNumber}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="houseNumber"
                            placeholder={t('enterHouseNumber', 'Enter house number')}
                        />
                    </div>
                </Field>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">{t('selectServices', 'Select the services you would like to apply for:')} <span className="text-gray-400">({t('optional', 'Optional')})</span></p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {E_BANKING_OPTIONS.map(option => (
                        <label key={option.id} className="flex items-center p-3 border border-amber-200 rounded-lg hover:bg-amber-50 cursor-pointer bg-amber-50">
                            <input
                                type="checkbox"
                                name="ebankingChannels"
                                value={option.id}
                                checked={formData.ebankingChannels.includes(option.id)}
                                onChange={handleChange}
                                className="h-4 w-4 text-amber-700 focus:ring-amber-500 border-amber-300 rounded"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                                <span className="mr-2">{option.icon}</span>
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
                
                {formData.ebankingChannels.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                            {t('noServicesSelected', 'You have not selected any e-banking services. You can proceed without selecting services.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="idCopyAttached"
                            name="idCopyAttached"
                            type="checkbox"
                            checked={formData.idCopyAttached}
                            onChange={handleChange}
                            className="h-4 w-4 text-amber-700 focus:ring-amber-500 border-amber-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="idCopyAttached" className="font-medium text-gray-700">
                            {t('idCopyAttached', 'I have attached a copy of my ID')}
                        </label>
                        <p className="text-gray-500 mt-1">
                            {t('idCopyExplanation', 'If checked, address information becomes optional')}
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="termsAccepted"
                            name="termsAccepted"
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={handleChange}
                            className="h-4 w-4 text-amber-700 focus:ring-amber-500 border-amber-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                            {t('agreeToTerms', 'I agree to the')}{' '}
                            <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-amber-700 hover:text-amber-800 underline"
                            >
                                {t('termsAndConditions', 'Terms and Conditions')}
                            </button>{' '}
                            *
                        </label>
                        {errors.termsAccepted && (
                            <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
                        )}
                    </div>
                </div>

                {showTerms && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
                            <h3 className="text-lg font-bold text-amber-700 mb-4">{t('termsAndConditions', 'Terms and Conditions')}</h3>
                            <div className="max-h-96 overflow-y-auto text-sm text-gray-700 space-y-3">
                                <p>{t('termsIntroduction', 'By applying for E-Banking services, you agree to abide by the bank\'s policies and procedures.')}</p>
                                
                                <h4 className="font-semibold text-gray-900">{t('responsibilities', 'Your Responsibilities:')}</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{t('term1', 'Do not share your PIN or password with anyone')}</li>
                                    <li>{t('term2', 'Report suspicious activity immediately')}</li>
                                    <li>{t('term3', 'Keep your contact information updated')}</li>
                                    <li>{t('term4', 'Use secure networks when accessing banking services')}</li>
                                </ul>

                                <h4 className="font-semibold text-gray-900">{t('importantNotes', 'Important Notes:')}</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{t('note1', 'Service availability is subject to bank approval')}</li>
                                    <li>{t('note2', 'Fees and charges may apply for certain services')}</li>
                                    <li>{t('note3', 'The bank reserves the right to modify terms and conditions')}</li>
                                    <li>{t('note4', 'Transactions are subject to verification and approval')}</li>
                                </ul>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowTerms(false)}
                                    className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                                >
                                    {t('close', 'Close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-6">
            <div className="bg-amber-50 rounded-lg p-4 space-y-4 border border-amber-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium text-amber-700 mb-2">{t('customerDetails', 'Customer Details')}</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Account:</span> {formData.accountNumber}</p>
                            <p><span className="font-medium">Name:</span> {formData.customerName}</p>
                            <p><span className="font-medium">Mobile:</span> {formData.mobileNumber}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-amber-700 mb-2">{t('selectedServices', 'Selected Services')}</h4>
                        {formData.ebankingChannels.length > 0 ? (
                            <ul className="text-sm space-y-1">
                            {formData.ebankingChannels.map(channel => {
                                    const option = E_BANKING_OPTIONS.find(opt => opt.id === channel);
                                    return (
                                        <li key={channel} className="flex items-center gap-2">
                                            <span>{option?.icon}</span>
                                            <span>{option?.label}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">{t('noServicesSelected', 'No services selected')}</p>
                        )}
                    </div>
                </div>
                
                {!formData.idCopyAttached && (
                    <div>
                        <h4 className="font-medium text-amber-700 mb-2">{t('addressInformation', 'Address Information')}</h4>
                        <div className="text-sm">
                            <p>{formData.region}, {formData.zone}</p>
                            <p>{formData.wereda}, {t('houseNumber', 'House')} {formData.houseNumber}</p>
                        </div>
                    </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                        {t('reviewInstructions', 'Please review your information carefully. Click "Continue" to proceed with OTP verification.')}
                    </p>
                </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                    {t('otpInstructions', 'An OTP will be sent to your phone number:')} 
                    <strong className="text-amber-900"> {formData.mobileNumber || phone}</strong>
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
                        name="otpCode" 
                        value={formData.otpCode} 
                        onChange={handleChange} 
                        maxLength={6}
                        className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono bg-amber-50"
                        placeholder="000000"
                        id="otpCode"
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
                        {formData.otpCode.length}/6
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with consistent styling */}
                     <header className="bg-gradient-to-r from-fuchsia-700 to-amber-400 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-lg font-bold">{t('forms.eBankingApplication', 'E-Banking Application')}</h1>
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
                        {successMessage && (
                            <div className="mb-6">
                                <SuccessMessage message={successMessage} />
                            </div>
                        )}

                        <form onSubmit={step === 6 ? handleSubmit : handleNext} className="space-y-6">
                            <div className="border border-amber-200 rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    {step === 1 && <User className="h-5 w-5 text-amber-700" />}
                                    {step === 2 && <FileText className="h-5 w-5 text-amber-700" />}
                                    {step === 3 && <Home className="h-5 w-5 text-amber-700" />}
                                    {step === 4 && <Wifi className="h-5 w-5 text-amber-700" />}
                                    {step === 5 && <FileText className="h-5 w-5 text-amber-700" />}
                                    {step === 6 && <Shield className="h-5 w-5 text-amber-700" />}
                                    {t(`step${step}Title`, `Step ${step}`)}
                                </h2>
                                
                                {renderStepContent()}
                            </div>

                            {errors.submit && <ErrorMessage message={errors.submit} />}

                            <div className="flex justify-between pt-4">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="border border-amber-300 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-2"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                ) : (
                                    <div></div> // Spacer for alignment
                                )}
                                
                                {step < 5 ? (
                                    <button
                                        type="submit"
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium flex items-center gap-2"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                ) : step === 5 ? (
                                    <button
                                        type="submit"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleRequestOtp();
                                            setStep(6);
                                        }}
                                        className="bg-amber-400 text-amber-900 px-6 py-3 rounded-lg hover:bg-amber-500 font-medium flex items-center gap-2"
                                    >
                                        <Shield className="h-4 w-4" />
                                        <span>{t('requestOtp', 'Request OTP')}</span>
                                    </button>
                                ) : (
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otpCode.length !== 6}
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
                                                {t('verifyAndSubmit', 'Verify & Submit')}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}