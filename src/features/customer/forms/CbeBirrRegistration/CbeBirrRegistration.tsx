// features/customer/forms/CbeBirrRegistration/CbeBirrRegistrationForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { cbeBirrRegistrationValidationSchema } from '@features/customer/utils/validationSchemas';
import { cbeBirrRegistrationService } from '@services/forms/cbeBirrRegistrationService';
import { MapPin, IdCard, Users, Heart, Mail, Home } from 'lucide-react';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  phoneNumber: string;
  fullName: string;
  fatherName: string;
  grandfatherName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  city: string;
  wereda: string;
  kebele: string;
  email: string;
  idNumber: string;
  issuedBy: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widow';
  educationLevel: string;
  motherName: string;
  motherFatherName: string;
  motherGrandfatherName: string;
}

const educationLevels = [
  'Primary School',
  'Secondary School',
  'High School',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other'
];

const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

export default function CbeBirrRegistrationForm() {
  const { phone } = useAuth();
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  // Custom Hooks
  const { step, next, prev, isFirst } = useFormSteps(6); // 6 steps without OTP
  const { errors, validateField, clearFieldError } = useFormValidation(cbeBirrRegistrationValidationSchema);

  // State
  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    phoneNumber: phone || '',
    fullName: '',
    fatherName: '',
    grandfatherName: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: 'Male',
    city: '',
    wereda: '',
    kebele: '',
    email: '',
    idNumber: '',
    issuedBy: '',
    maritalStatus: 'Single',
    educationLevel: educationLevels[0],
    motherName: '',
    motherFatherName: '',
    motherGrandfatherName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const validateCurrentStep = () => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      1: ['phoneNumber'],
      2: ['fullName', 'fatherName', 'grandfatherName', 'placeOfBirth', 'dateOfBirth', 'gender'],
      3: ['city', 'wereda', 'kebele', 'email'],
      4: ['idNumber', 'issuedBy', 'maritalStatus', 'educationLevel'],
      5: ['motherName', 'motherFatherName', 'motherGrandfatherName'],
      6: [], // Review step - no validation needed
    };

    const fieldsToValidate = stepFields[step] || [];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      const fieldValue = formData[field];
      const fieldIsValid = validateField(field, fieldValue, formData);
      if (!fieldIsValid) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      next();
    }
  };

  const handleSubmit = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number is required');
      return;
    }

    // Validate all required fields before submission
    const allRequiredFields: (keyof FormData)[] = [
      'phoneNumber', 'fullName', 'fatherName', 'grandfatherName', 
      'placeOfBirth', 'dateOfBirth', 'gender', 'city', 'wereda', 
      'kebele', 'idNumber', 'issuedBy', 'maritalStatus', 
      'educationLevel', 'motherName', 'motherFatherName', 'motherGrandfatherName'
    ];

    let isValid = true;
    allRequiredFields.forEach(field => {
      const fieldValue = formData[field];
      const fieldIsValid = validateField(field, fieldValue, formData);
      if (!fieldIsValid) {
        isValid = false;
      }
    });

    if (!isValid) {
      showError('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullNameCombined = `${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`.trim();
      const mothersFullName = `${formData.motherName} ${formData.motherFatherName} ${formData.motherGrandfatherName}`.trim();

      const registrationData = {
        customerPhoneNumber: formData.phoneNumber,
        fullName: fullNameCombined,
        branchId: ABIY_BRANCH_ID,
        placeOfBirth: formData.placeOfBirth,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        city: formData.city,
        wereda: formData.wereda,
        kebele: formData.kebele,
        email: formData.email,
        idNumber: formData.idNumber,
        issuedBy: formData.issuedBy,
        maritalStatus: formData.maritalStatus,
        educationLevel: formData.educationLevel,
        mothersFullName: mothersFullName,
      };

      const response = await cbeBirrRegistrationService.createRegistration(registrationData);

      showSuccess('CBE Birr registration submitted successfully!');
      
      navigate('/form/cbe-birr/confirmation', { 
        state: { api: response.data }
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit the form. Please try again.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="Enter your phone number"
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-white transition-colors duration-200"
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          This phone number will be used for your CBE Birr account
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel" 
            value={formData.phoneNumber} 
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            disabled
            className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={formData.fullName} 
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Father's Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={formData.fatherName} 
            onChange={(e) => handleChange('fatherName', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.fatherName && <p className="mt-1 text-sm text-red-600">{errors.fatherName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grandfather's Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={formData.grandfatherName} 
            onChange={(e) => handleChange('grandfatherName', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.grandfatherName && <p className="mt-1 text-sm text-red-600">{errors.grandfatherName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Place of Birth <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={formData.placeOfBirth} 
            onChange={(e) => handleChange('placeOfBirth', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.placeOfBirth && <p className="mt-1 text-sm text-red-600">{errors.placeOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input 
            type="date" 
            value={formData.dateOfBirth} 
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
          <div className="flex space-x-6">
            <label className="inline-flex items-center">
              <input 
                type="radio" 
                name="gender"
                value="Male" 
                checked={formData.gender === 'Male'} 
                onChange={(e) => handleChange('gender', e.target.value as 'Male' | 'Female')}
                className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500" 
              />
              <span className="ml-2">Male</span>
            </label>
            <label className="inline-flex items-center">
              <input 
                type="radio" 
                name="gender"
                value="Female" 
                checked={formData.gender === 'Female'} 
                onChange={(e) => handleChange('gender', e.target.value as 'Male' | 'Female')}
                className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500" 
              />
              <span className="ml-2">Female</span>
            </label>
          </div>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.city} 
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wereda <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.wereda} 
              onChange={(e) => handleChange('wereda', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.wereda && <p className="mt-1 text-sm text-red-600">{errors.wereda}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kebele <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.kebele} 
              onChange={(e) => handleChange('kebele', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.kebele && <p className="mt-1 text-sm text-red-600">{errors.kebele}</p>}
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="example@domain.com"
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.idNumber} 
              onChange={(e) => handleChange('idNumber', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.idNumber && <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issued By <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={formData.issuedBy} 
            onChange={(e) => handleChange('issuedBy', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.issuedBy && <p className="mt-1 text-sm text-red-600">{errors.issuedBy}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marital Status <span className="text-red-500">*</span>
          </label>
          <select 
            value={formData.maritalStatus} 
            onChange={(e) => handleChange('maritalStatus', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widow">Widow</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level <span className="text-red-500">*</span>
          </label>
          <select 
            value={formData.educationLevel} 
            onChange={(e) => handleChange('educationLevel', e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          >
            {educationLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mother's Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.motherName} 
              onChange={(e) => handleChange('motherName', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.motherName && <p className="mt-1 text-sm text-red-600">{errors.motherName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mother's Father Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.motherFatherName} 
              onChange={(e) => handleChange('motherFatherName', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.motherFatherName && <p className="mt-1 text-sm text-red-600">{errors.motherFatherName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mother's Grandfather Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={formData.motherGrandfatherName} 
              onChange={(e) => handleChange('motherGrandfatherName', e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
          </div>
          {errors.motherGrandfatherName && <p className="mt-1 text-sm text-red-600">{errors.motherGrandfatherName}</p>}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          You are registering for CBE Birr mobile money service. After registration, you will be able to use mobile money transfer services.
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="border border-fuchsia-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Application</h2>
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Full Name:</span>
          <span className="font-semibold text-fuchsia-900">{`${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Phone Number:</span>
          <span className="font-mono font-semibold text-fuchsia-900">{formData.phoneNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">ID Number:</span>
          <span className="font-semibold text-fuchsia-900">{formData.idNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Email:</span>
          <span className="font-semibold text-fuchsia-900">{formData.email || 'N/A'}</span>
        </div>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 1: return renderStep0(); // Phone number
      case 2: return renderStep1(); // Personal info
      case 3: return renderStep2(); // Address
      case 4: return renderStep3(); // ID & Education
      case 5: return renderStep4(); // Mother's info
      case 6: return renderStep5(); // Review
      default: return null;
    }
  };

  const getNextHandler = () => {
    if (step === 6) return handleSubmit;
    return handleNext;
  };

  const getNextLabel = () => {
    if (step === 6) return 'Submit Registration';
    return 'Continue';
  };

  return (
    <FormLayout
      title="CBE Birr Registration"
      phone={phone}
      branchName={branch?.name}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {getStepContent()}

        <StepNavigation
          currentStep={step}
          totalSteps={6}
          onNext={getNextHandler()}
          onBack={prev}
          nextLabel={getNextLabel()}
          nextDisabled={isSubmitting}
          nextLoading={isSubmitting}
          hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}