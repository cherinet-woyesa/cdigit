
// features/customer/forms/EBankingApplication/EBankingApplication.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useAccountSelection } from '../../hooks/useAccountSelection';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useAddressManagement } from '../../hooks/useAddressManagement';
import { eBankingApplicationValidationSchema } from '../../utils/eBankingApplicationValidationSchema';
import { applyEBankingApplication, getEBankingApplicationById, updateEBankingApplication } from '../../../../services/eBankingApplicationService';
import authService from '../../../../services/authService';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import AccountDetailsStep from '../../components/ebanking/AccountDetailsStep';
import IDDetailsStep from '../../components/ebanking/IDDetailsStep';
import AddressDetailsStep from '../../components/ebanking/AddressDetailsStep';
import ServiceSelectionStep from '../../components/ebanking/ServiceSelectionStep';
import TermsAndConditionsStep from '../../components/ebanking/TermsAndConditionsStep';
// import ReviewStep from '../../components/ebanking/ReviewStep';
import OTPStep from '../../components/stoppayment/OTPStep';

export default function EBankingApplication() {
    const navigate = useNavigate();
    const location = useLocation();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
    const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedEBankingAccount');
    const { step, next, prev, isFirst, isLast } = useFormSteps(6);
    const { errors, validateForm } = useFormValidation(eBankingApplicationValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateId, setUpdateId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        accountNumber: selectedAccount?.accountNumber || '',
        customerName: selectedAccount?.accountHolderName || '',
        mobileNumber: phone || '',
        idType: 'national_id',
        idNumber: '',
        issuingAuthority: 'NIRA',
        idIssueDate: '',
        idExpiryDate: '',
        region: '',
        zone: '',
        wereda: '',
        houseNumber: '',
        ebankingChannels: [] as string[],
        termsAccepted: false,
        idCopyAttached: false,
        otpCode: '',
    });

    const { regions, zones, woredas, regionLoading, zoneLoading, woredaLoading } = useAddressManagement(formData);

    useEffect(() => {
        if (selectedAccount) {
            setFormData(prev => ({ ...prev, accountNumber: selectedAccount.accountNumber, customerName: selectedAccount.accountHolderName || '' }));
        }
    }, [selectedAccount]);

    useEffect(() => {
        const id = location.state?.updateId as string | undefined;
        if (id) {
            setUpdateId(id);
            getEBankingApplicationById(id).then(res => {
                if (res.success && res.data) {
                    const d = res.data;
                    setFormData(prev => ({
                        ...prev,
                        accountNumber: d.AccountNumber || d.accountNumber || prev.accountNumber,
                        customerName: d.AccountHolderName || d.accountHolderName || prev.customerName,
                        mobileNumber: d.PhoneNumber || d.phoneNumber || prev.mobileNumber,
                        ebankingChannels: d.ServicesRequested ? String(d.ServicesRequested).split(',').map(s => s.trim()).filter(Boolean) : [],
                    }));
                }
            });
        }
    }, [location.state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        if (type === 'checkbox') {
            if (name === 'ebankingChannels') {
                const channel = value;
                setFormData(prev => ({
                    ...prev,
                    ebankingChannels: checked ? [...prev.ebankingChannels, channel] : prev.ebankingChannels.filter(c => c !== channel)
                }));
            } else {
                setFormData(prev => ({ ...prev, [name]: checked }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRequestOTP = async () => {
        if (!validateForm(formData)) return;
        try {
            await requestOTP(() => authService.requestOTP(formData.mobileNumber || phone!));
            next();
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm(formData) || !branch?.id) return;

        setIsSubmitting(true);
        try {
            const payload = {
                PhoneNumber: formData.mobileNumber || phone!,
                BranchId: branch.id,
                AccountNumber: formData.accountNumber,
                AccountHolderName: formData.customerName,
                OtpCode: formData.otpCode,
                NationalIdNumber: formData.idType === 'national_id' ? formData.idNumber : undefined,
                AltIdNumber: formData.idType !== 'national_id' ? formData.idNumber : undefined,
                AltIdIssuer: formData.idType !== 'national_id' ? formData.issuingAuthority : undefined,
                ServicesSelected: formData.ebankingChannels,
                Region: !formData.idCopyAttached ? formData.region : undefined,
                City: !formData.idCopyAttached ? formData.zone : undefined,
                SubCity: !formData.idCopyAttached ? formData.zone : undefined,
                Wereda: !formData.idCopyAttached ? formData.wereda : undefined,
                HouseNumber: !formData.idCopyAttached ? formData.houseNumber : undefined,
                IdIssueDate: formData.idIssueDate ? new Date(formData.idIssueDate).toISOString() : undefined,
                IdExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate).toISOString() : undefined,
            };

            const response = updateId 
                ? await updateEBankingApplication(updateId, { ...payload, Id: updateId })
                : await applyEBankingApplication(payload as any);

            if (response.success) {
                showSuccess('Application submitted successfully!');
                navigate('/form/ebanking/confirmation', { state: { serverData: response.data } });
            } else {
                showError(response.message || 'Submission failed');
            }
        } catch (error: any) {
            showError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <AccountDetailsStep formData={formData} onChange={handleChange} errors={errors} onAccountChange={selectAccount} accounts={accounts} />;
            case 2: return <IDDetailsStep formData={formData} onChange={handleChange} errors={errors} />;
            case 3: return <AddressDetailsStep formData={formData} onChange={handleChange} errors={errors} addressProps={{ regions, zones, woredas, regionLoading, zoneLoading, woredaLoading }} />;
            case 4: return <ServiceSelectionStep formData={formData} onChange={handleChange} />;
            case 5: return <TermsAndConditionsStep formData={formData} onChange={handleChange} errors={errors} />;
            case 6: return <OTPStep otpCode={formData.otpCode} onOtpChange={handleChange} onResend={() => resendOTP(() => authService.requestOTP(formData.mobileNumber || phone!))} resendCooldown={resendCooldown} otpMessage={otpMessage} error={errors.otpCode} />;
            default: return null;
        }
    };

    return (
        <FormLayout title="E-Banking Application" phone={phone} branchName={branch?.name} loading={loadingAccounts} error={errorAccounts}>
            <div className="space-y-6">
                {renderStep()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={6} 
                    onNext={isLast ? handleSubmit : (step === 5 ? handleRequestOTP : next)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit' : (step === 5 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={isSubmitting || otpLoading} 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst}
                />
            </div>
        </FormLayout>
    );
}
