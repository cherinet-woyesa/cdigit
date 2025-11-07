import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import chequeReturnSlipService from '@services/transactions/chequeReturnSlipService';
import { Checkbox } from '@headlessui/react';

interface FormData {
  chequeNumber: string;
  amount: number;
  returnedReason: string;
  endorsementMissing: boolean;
  payeeEndorsementRequired: boolean;
  payeeEndorsementIrregular: boolean;
  drawerSignatureDiffers: boolean;
  alterationRequiresDrawerSignature: boolean;
  accountClosed: boolean;
  chequePostDated: boolean;
  chequeOutdated: boolean;
  amountWordsFiguresDiffer: boolean;
  paymentStoppedByDrawer: boolean;
  depositItemsNotCleared: boolean;
  chequeMutilated: boolean;
  drawerSignatureMissing: boolean;
  additionalSignatureRequired: boolean;
  accountTransferred: boolean;
  insufficientFund: boolean;
  signatures: { signatureData: string }[];
  phoneNumber: string;
  otpCode: string;
  authorizedSignature: string;
}

const returnReasons = [
  { name: 'endorsementMissing', label: 'Endorsement Missing' },
  { name: 'payeeEndorsementRequired', label: 'Payee Endorsement Required' },
  { name: 'payeeEndorsementIrregular', label: 'Payee Endorsement Irregular' },
  { name: 'drawerSignatureDiffers', label: 'Drawer’s Signature Differs' },
  { name: 'alterationRequiresDrawerSignature', label: 'Alteration Requires Drawer’s Full Signature' },
  { name: 'accountClosed', label: 'Account Closed' },
  { name: 'chequePostDated', label: 'Post-Dated Cheque' },
  { name: 'chequeOutdated', label: 'Outdated Cheque' },
  { name: 'amountWordsFiguresDiffer', label: 'Amount in Words and Figures Differ' },
  { name: 'paymentStoppedByDrawer', label: 'Payment Stopped by Drawer' },
  { name: 'depositItemsNotCleared', label: 'Effects Not Cleared / Uncleared Effects' },
  { name: 'chequeMutilated', label: 'Cheque Mutilated' },
  { name: 'drawerSignatureMissing', label: 'Drawer’s Signature Missing' },
  { name: 'additionalSignatureRequired', label: 'Additional Signature Required' },
  { name: 'accountTransferred', label: 'Account Transferred to Another Branch' },
  { name: 'insufficientFund', label: 'Insufficient Funds' },
];

export default function ChequeReturnSlipForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    chequeNumber: '',
    amount: 0,
    returnedReason: '',
    endorsementMissing: false,
    payeeEndorsementRequired: false,
    payeeEndorsementIrregular: false,
    drawerSignatureDiffers: false,
    alterationRequiresDrawerSignature: false,
    accountClosed: false,
    chequePostDated: false,
    chequeOutdated: false,
    amountWordsFiguresDiffer: false,
    paymentStoppedByDrawer: false,
    depositItemsNotCleared: false,
    chequeMutilated: false,
    drawerSignatureMissing: false,
    additionalSignatureRequired: false,
    accountTransferred: false,
    insufficientFund: false,
    signatures: [],
    phoneNumber: '',
    otpCode: '',
    authorizedSignature: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }));
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signatures: [...prev.signatures, { signatureData }] }));
  };

  const handleSignatureClear = (index: number) => {
    setFormData(prev => ({ ...prev, signatures: prev.signatures.filter((_, i) => i !== index) }));
  };

  const handleAuthorizedSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, authorizedSignature: signatureData }));
  };

  const handleAuthorizedSignatureClear = () => {
    setFormData(prev => ({ ...prev, authorizedSignature: '' }));
  };

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedReasons = returnReasons
        .filter(reason => formData[reason.name as keyof FormData])
        .map(reason => reason.label);

      const requestData = {
        ...formData,
        branchId: branch.id,
        returnedReason: selectedReasons.join(', '),
      };

      await chequeReturnSlipService.submitRequest(requestData);
      showSuccess('Request submitted successfully!');
      navigate('/customer/dashboard');
    } catch (error: any) {
      showError(error?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Cheque Details',
      fields: ['chequeNumber', 'amount'],
    },
    {
      title: 'Reason for Return',
      fields: returnReasons.map(r => r.name),
    },
    {
      title: 'Authorization',
      fields: ['authorizedSignature', 'signatures', 'phoneNumber', 'otpCode'],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-6">
            <label className="block">
              <span className="text-gray-700">Cheque Number</span>
              <input
                type="text"
                name="chequeNumber"
                value={formData.chequeNumber}
                onChange={handleChange}
                placeholder="Enter Cheque Number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Amount</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="Enter Amount"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </label>
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {returnReasons.map(reason => (
              <label key={reason.name} className="flex items-center space-x-2">
                <Checkbox
                  checked={!!formData[reason.name as keyof FormData]}
                  onChange={() => setFormData(prev => ({ ...prev, [reason.name]: !prev[reason.name as keyof FormData] }))}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">{reason.label}</span>
              </label>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Authorized Signature</h3>
              <SignatureStep
                onSignatureComplete={handleAuthorizedSignatureComplete}
                onSignatureClear={handleAuthorizedSignatureClear}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Customer Signatures</h3>
              <SignatureStep
                onSignatureComplete={handleSignatureComplete}
                onSignatureClear={() => handleSignatureClear(formData.signatures.length - 1)}
              />
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.signatures.map((sig, index) => (
                  <div key={index} className="relative">
                    <img src={sig.signatureData} alt="signature" className="h-16 border" />
                    <button
                      onClick={() => handleSignatureClear(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-gray-700">Phone Number for OTP</span>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter Phone Number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </label>
              <label className="block">
                <span className="text-gray-700">OTP Code</span>
                <input
                  type="text"
                  name="otpCode"
                  value={formData.otpCode}
                  onChange={handleChange}
                  placeholder="Enter OTP"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <FormLayout title="Cheque Return Slip" branchName={branch?.name} phone={null}>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {renderStep()}
        </form>
      </div>
      <StepNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onBack={handleBack}
        nextLabel={currentStep === steps.length - 1 ? 'Submit' : 'Next'}
        nextLoading={isSubmitting}
      />
    </FormLayout>
  );
}