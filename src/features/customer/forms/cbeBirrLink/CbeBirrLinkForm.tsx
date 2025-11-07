// features/customer/forms/cbeBirrLink/CbeBirrLinkForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useCustomerSearch } from '@features/customer/hooks/useCustomerSearch';
import { useMultiAccountSelection } from '@features/customer/hooks/useMultiAccountSelection';
import { cbeBirrLinkValidationSchema } from '@features/customer/utils/cbeBirrLinkValidationSchema';
import { cbeBirrService } from '@services/cbeBirrService';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import Field from '@components/form/Field';
import CustomerInfoSection from '@features/customer/components/CustomerInfoSection';
import AccountSelection from '@features/customer/components/AccountSelection';
import { Loader2 } from 'lucide-react';

const ACTION_TYPES = [
  { value: 'link', label: 'Link Account' },
  { value: 'unlink', label: 'Unlink Account' },
  { value: 'change_phone', label: 'Change Phone Number' },
  { value: 'modify_end_date', label: 'Modify End Date' },
];

const ID_TYPES = [
    { value: 'NID', label: 'National ID' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
];

export default function CbeBirrLinkForm() {
    const navigate = useNavigate();
    const { user, phone } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const { step, next, prev, isFirst, isLast, goTo } = useFormSteps(2);
    const { customerInfo, searchTerm, setSearchTerm, isSearching, searchCustomer } = useCustomerSearch();
    
    const [formData, setFormData] = useState({
        actionType: 'link' as 'link' | 'unlink' | 'change_phone' | 'modify_end_date',
        idNumber: '',
        idType: 'NID',
        idIssueDate: '',
        idExpiryDate: '',
        newPhoneNumber: '',
        newEndDate: '',
        selectedAccounts: [] as string[],
        termsAccepted: false,
    });

    const { errors, validateForm, clearFieldError } = useFormValidation(cbeBirrLinkValidationSchema);
    const { selectedAccounts, toggleAccount, toggleAllAccounts } = useMultiAccountSelection(customerInfo?.accounts || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (customerInfo) {
            setFormData(prev => ({
                ...prev,
                idNumber: customerInfo.idNumber,
                idType: customerInfo.idType,
                idIssueDate: customerInfo.idIssueDate,
                idExpiryDate: customerInfo.idExpiryDate || '',
            }));
        }
    }, [customerInfo]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, selectedAccounts }));
    }, [selectedAccounts]);

    const handleSearch = async () => {
        const customer = await searchCustomer();
        if (customer) {
            next();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        clearFieldError(name);
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm(formData) || !customerInfo || !user) return;

        setIsSubmitting(true);
        try {
            const requestData = {
                branchName: user.branchId || 'Head Office',
                customerId: customerInfo.customerId,
                fullName: customerInfo.fullName,
                idNumber: formData.idNumber,
                idType: formData.idType,
                idIssueDate: formData.idIssueDate,
                idExpiryDate: formData.idExpiryDate || undefined,
                actionType: formData.actionType,
                accounts: formData.selectedAccounts,
                currentPhoneNumber: customerInfo.phoneNumber,
                newPhoneNumber: formData.newPhoneNumber || undefined,
                newEndDate: formData.newEndDate || undefined,
                termsAccepted: formData.termsAccepted,
                makerId: user.id,
                makerName: `${user.firstName} ${user.lastName}`.trim() || 'System User',
                makerDate: new Date().toISOString(),
            };
            
            const result = await cbeBirrService.submitLinkRequest(requestData);
            
            if (result.success) {
                showSuccess('Request submitted successfully!');
                navigate('/form/cbe-birr-link/confirmation', { state: { request: result.data } });
            } else {
                showError(result.message || 'Failed to submit request.');
            }
        } catch (error: any) {
            showError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSearchStep = () => (
        <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Customer Search</h2>
            <p className="text-gray-600 mb-6">Enter customer's ID, phone, or account number.</p>
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 rounded-lg border"
                    placeholder="Enter search term"
                />
                <button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()} className="px-4 py-2 bg-fuchsia-700 text-white rounded-lg">
                    {isSearching ? <Loader2 className="animate-spin" /> : 'Search'}
                </button>
            </div>
        </div>
    );

    const renderFormStep = () => {
        if (!customerInfo) return null;
        return (
            <div className="space-y-6">
                <CustomerInfoSection customerInfo={customerInfo} />
                <AccountSelection accounts={customerInfo.accounts} selectedAccounts={selectedAccounts} onToggleAccount={toggleAccount} onToggleAll={toggleAllAccounts} actionType={formData.actionType} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Request Type" required>
                        <select name="actionType" value={formData.actionType} onChange={handleChange} className="w-full p-3 rounded-lg border">
                            {ACTION_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                    </Field>
                    {formData.actionType === 'change_phone' && (
                        <Field label="New Phone Number" required error={errors.newPhoneNumber}>
                            <input type="tel" name="newPhoneNumber" value={formData.newPhoneNumber} onChange={handleChange} placeholder="+251XXXXXXXXX" className="w-full p-3 rounded-lg border" />
                        </Field>
                    )}
                    {formData.actionType === 'modify_end_date' && (
                        <Field label="New End Date" required error={errors.newEndDate}>
                            <input type="date" name="newEndDate" value={formData.newEndDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-lg border" />
                        </Field>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t">
                    <div className="flex items-start">
                        <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="h-4 w-4" />
                        <div className="ml-3 text-sm">
                            <label htmlFor="termsAccepted" className="font-medium">I agree to the terms and conditions</label>
                            {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <FormLayout title="CBE-Birr & Bank Account Link" phone={phone} branchName={user?.branchId}>
            <div className="space-y-6">
                {step === 1 ? renderSearchStep() : renderFormStep()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={2} 
                    onNext={isLast ? handleSubmit : handleSearch} 
                    onBack={() => goTo(1)} 
                    nextLabel={isLast ? 'Submit' : 'Search'} 
                    nextDisabled={isSubmitting || (isFirst && !searchTerm.trim())} 
                    nextLoading={isSubmitting || isSearching} 
                    hideBack={isFirst} 
                />
            </div>
        </FormLayout>
    );
}