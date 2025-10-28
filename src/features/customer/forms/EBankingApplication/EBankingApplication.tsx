// features/customer/forms/EBankingApplication/EBankingApplication.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useAddressManagement } from '../../hooks/useAddressManagement';
import { eBankingApplicationValidationSchema } from '../../utils/eBankingApplicationValidationSchema';
import { applyEBankingApplication, getEBankingApplicationById, updateEBankingApplication } from '../../../../services/eBankingApplicationService';
import authService from '../../../../services/authService';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { AccountSelector } from '../../components/AccountSelector';
import IDDetailsStep from '../../components/ebanking/IDDetailsStep';
import AddressDetailsStep from '../../components/ebanking/AddressDetailsStep';
import ServiceSelectionStep from '../../components/ebanking/ServiceSelectionStep';
import TermsAndConditionsStep from '../../components/ebanking/TermsAndConditionsStep';
import OTPStep from '../../components/stoppayment/OTPStep';
import { Shield } from 'lucide-react';

export default function EBankingApplication() {
    const navigate = useNavigate();
    const location = useLocation();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError, info } = useToast();
    const { step, next, prev, isFirst, isLast } = useFormSteps(6);
    const { errors, validateForm } = useFormValidation(eBankingApplicationValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [accountValidated, setAccountValidated] = useState(false);
    const [idCopy, setIdCopy] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        accountNumber: '',
        customerName: '',
        mobileNumber: '',
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
        otpCode: '',
    });

    const { regions, zones, woredas, regionLoading, zoneLoading, woredaLoading } = useAddressManagement(formData);

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
                    setAccountValidated(true);
                }
            });
        }
    }, [location.state]);

    const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
        setFormData(prev => ({
            ...prev,
            accountNumber,
            customerName: accountHolderName || '',
        }));
        if (!accountNumber) {
            setAccountValidated(false);
        }
    };

    const handleAccountValidation = (account: any | null) => {
        setAccountValidated(!!account);
        if (account) {
            setFormData(prev => ({
                ...prev,
                customerName: account.accountHolderName || '',
                mobileNumber: account.phoneNumber || '',
            }));
        }
    };

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

    const handleFileChange = (file: File | null) => {
        setIdCopy(file);
    };

    const handleRequestOTP = async () => {
        const fieldsToValidate = ['accountNumber', 'customerName', 'mobileNumber', 'idType', 'idNumber', 'issuingAuthority', 'idIssueDate', 'idExpiryDate', 'termsAccepted'];
        if (!idCopy) {
            fieldsToValidate.push('region', 'zone', 'wereda', 'houseNumber');
        }
        if (!validateForm(formData, fieldsToValidate)) return;

        try {
            await requestOTP(() => authService.requestOTP(formData.mobileNumber || phone!));
            info('OTP sent to your phone');
            next();
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        }
    };

    const handleResendOTP = async () => {
        try {
            await resendOTP(() => authService.requestOTP(formData.mobileNumber || phone!));
            info('OTP resent successfully');
        } catch (error: any) {
            showError(error.message || 'Failed to resend OTP');
        }
    }

    const handleSubmit = async () => {
        if (!validateForm(formData) || !branch?.id) return;

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append('PhoneNumber', formData.mobileNumber || phone!);
        payload.append('BranchId', branch.id);
        payload.append('AccountNumber', formData.accountNumber);
        payload.append('AccountHolderName', formData.customerName);
        payload.append('OtpCode', formData.otpCode);
        if (formData.idType === 'national_id') {
            payload.append('NationalIdNumber', formData.idNumber);
        } else {
            payload.append('AltIdNumber', formData.idNumber);
            payload.append('AltIdIssuer', formData.issuingAuthority);
        }
        formData.ebankingChannels.forEach(service => payload.append('ServicesSelected', service));
        if (!idCopy) {
            payload.append('Region', formData.region);
            payload.append('City', formData.zone);
            payload.append('SubCity', formData.zone);
            payload.append('Wereda', formData.wereda);
            payload.append('HouseNumber', formData.houseNumber);
        }
        if (formData.idIssueDate) payload.append('IdIssueDate', new Date(formData.idIssueDate).toISOString());
        if (formData.idExpiryDate) payload.append('IdExpiryDate', new Date(formData.idExpiryDate).toISOString());
        if (idCopy) {
            payload.append('IdCopy', idCopy);
        }

        try {
            const response = updateId 
                ? await updateEBankingApplication(updateId, payload)
                : await applyEBankingApplication(payload);

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
            case 1: return <AccountSelector accounts={[]} selectedAccount={formData.accountNumber} onAccountChange={handleAccountChange} onAccountValidation={handleAccountValidation} error={errors.accountNumber} allowManualEntry={true} />;
            case 2: return <IDDetailsStep formData={formData} onChange={handleChange} errors={errors} />;
            case 3: return <AddressDetailsStep formData={formData} onChange={handleChange} errors={errors} addressProps={{ regions, zones, woredas, regionLoading, zoneLoading, woredaLoading }} />;
            case 4: return <ServiceSelectionStep formData={formData} onChange={handleChange} />;
            case 5: return <TermsAndConditionsStep formData={formData} onChange={handleChange} errors={errors} onFileChange={handleFileChange} idCopy={idCopy} />;
            case 6: return <OTPStep otpCode={formData.otpCode} onOtpChange={(e) => setFormData({...formData, otpCode: e.target.value})} onResend={handleResendOTP} resendCooldown={resendCooldown} otpMessage={otpMessage} error={errors.otpCode} />;
            default: return null;
        }
    };

    const renderCustomNavigation = () => {
        if (step === 5) {
          return (
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={!formData.termsAccepted || otpLoading}
                className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
              >
                {otpLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Request OTP
                  </>
                )}
              </button>
            </div>
          );
        }
    
        return (
          <StepNavigation
            currentStep={step}
            totalSteps={6}
            onNext={step === 6 ? handleSubmit : next}
            onBack={prev}
            nextLabel={step === 6 ? 'Submit' : 'Continue'}
            nextDisabled={isSubmitting || otpLoading || (step === 1 && !accountValidated)}
            nextLoading={isSubmitting || otpLoading}
            hideBack={isFirst}
          />
        );
      };

    return (
        <FormLayout title="E-Banking Application" phone={phone} branchName={branch?.name}>
            <div className="space-y-6">
                {renderStep()}
                {renderCustomNavigation()}
            </div>
        </FormLayout>
    );
}