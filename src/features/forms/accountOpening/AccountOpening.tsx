
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import accountOpeningService from "../../../services/accountOpeningService";

// Import all types
import type {
  PersonalDetail,
  AddressDetail,
  FinancialDetail,
  OtherDetail,
  DocumentDetail,
  EPaymentService,
  PassbookMudayRequest,
  DigitalSignature,
  AccountOpeningFormData,
  Errors,
} from "../../../types/formTypes";

// -----------------------------------------------------------------------------
// Reusable Components (Field, ProgressBar)
// Utility functions for session storage (avoid code repetition)
const FORM_SESSION_KEY = "accountOpeningFormData";
const STEP_SESSION_KEY = "accountOpeningCurrentStep";

// Save ONLY serializable data (skip files!)
function saveSession(formData: AccountOpeningFormData, step: number) {
  const { DocumentDetails, DigitalSignature, ...rest } = formData;
  // Remove files from storage (keep in-memory)
  const storageData = {
    ...rest,
    DocumentDetails: { ...DocumentDetails, PhotoIdFile: null },
    DigitalSignature: { ...DigitalSignature, PhotoFile: null },
  };
  sessionStorage.setItem(FORM_SESSION_KEY, JSON.stringify(storageData));
  sessionStorage.setItem(STEP_SESSION_KEY, String(step));
}

function loadSession(initial: AccountOpeningFormData, setFiles: (files: { doc: File | null, sig: File | null }) => void) {
  const saved = sessionStorage.getItem(FORM_SESSION_KEY);
  const savedStep = sessionStorage.getItem(STEP_SESSION_KEY);
  if (!saved) return { data: initial, step: 0 };
  let parsed = JSON.parse(saved);
  // Always restore without files; files must be re-uploaded (privacy best practice)
  setFiles({ doc: null, sig: null });
  return {
    data: {
      ...initial,
      ...parsed,
      DocumentDetails: { ...initial.DocumentDetails, ...parsed.DocumentDetails, PhotoIdFile: null },
      DigitalSignature: { ...initial.DigitalSignature, ...parsed.DigitalSignature, PhotoFile: null },
    },
    step: savedStep ? parseInt(savedStep, 10) : 0,
  };
}

function clearSession() {
  sessionStorage.removeItem(FORM_SESSION_KEY);
  sessionStorage.removeItem(STEP_SESSION_KEY);
}
// -----------------------------------------------------------------------------

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
};

function ProgressBar({ currentStep, totalSteps, stepTitles }: ProgressBarProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                index <= currentStep
                  ? "bg-purple-600"
                  : "bg-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-xs mt-1 text-center ${
                index <= currentStep ? "text-purple-700" : "text-gray-500"
              }`}
            >
              {stepTitles[index]}
            </div>
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`flex-1 h-1 ${
                index < currentStep ? "bg-purple-600" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step Components (All 8 Steps)
// -----------------------------------------------------------------------------

// --- Step 1: Personal Details ---
type StepPersonalProps = {
  data: PersonalDetail;
  setData: (d: PersonalDetail) => void;
  errors: Errors<PersonalDetail>;
  onNext: () => void;
  submitting: boolean;
};

function StepPersonal({ data, setData, errors, onNext, submitting }: StepPersonalProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Personal Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account Type" required error={errors.AccountType}>
          <select
            className="form-select w-full p-2 rounded border"
            name="AccountType"
            value={data.AccountType}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
            <option value="IFB">IFB</option>
          </select>
        </Field>
        <Field label="Title" required error={errors.Title}>
          <div className="flex gap-3">
            {["Mr.", "Mrs.", "Miss", "Ms.", "Dr."].map((t) => (
              <label key={t} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="Title"
                  value={t}
                  checked={data.Title === t}
                  onChange={handleChange}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Your Name" required error={errors.YourName}>
          <input
            type="text"
            name="YourName"
            className="form-input w-full p-2 rounded border"
            value={data.YourName}
            onChange={handleChange}
            placeholder="Full name"
          />
        </Field>
        <Field label="Father's Name" required error={errors.FatherName}>
          <input
            type="text"
            name="FatherName"
            className="form-input w-full p-2 rounded border"
            value={data.FatherName}
            onChange={handleChange}
          />
        </Field>
        <Field label="Grandfather's Name" required error={errors.GrandfatherName}>
          <input
            type="text"
            name="GrandfatherName"
            className="form-input w-full p-2 rounded border"
            value={data.GrandfatherName}
            onChange={handleChange}
          />
        </Field>
        <Field label="Mother's Full Name" error={errors.MotherFullName}>
          <input
            type="text"
            name="MotherFullName"
            className="form-input w-full p-2 rounded border"
            value={data.MotherFullName || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Sex" required error={errors.Sex}>
          <div className="flex gap-3">
            {["Male", "Female"].map((s) => (
              <label key={s} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="Sex"
                  value={s}
                  checked={data.Sex === s}
                  onChange={handleChange}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Date of Birth" required error={errors.DateOfBirth}>
          <input
            type="date"
            name="DateOfBirth"
            className="form-input w-full p-2 rounded border"
            value={data.DateOfBirth}
            onChange={handleChange}
          />
        </Field>
        <Field label="Place of Birth" error={errors.PlaceOfBirth}>
          <input
            type="text"
            name="PlaceOfBirth"
            className="form-input w-full p-2 rounded border"
            value={data.PlaceOfBirth || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Marital Status" required error={errors.MaritalStatus}>
          <div className="flex gap-3">
            {["Single", "Married", "Divorced", "Widowed"].map((m) => (
              <label key={m} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="MaritalStatus"
                  value={m}
                  checked={data.MaritalStatus === m}
                  onChange={handleChange}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Education Qualification" error={errors.EducationQualification}>
          <select
            className="form-select w-full p-2 rounded border"
            name="EducationQualification"
            value={data.EducationQualification || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="None">None</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Diploma">Diploma</option>
            <option value="Degree">Degree</option>
            <option value="Masters">Masters</option>
            <option value="PhD">PhD</option>
          </select>
        </Field>
        <Field label="Nationality" required error={errors.Nationality}>
          <div className="flex gap-3">
            {["Ethiopian", "Foreign National"].map((n) => (
              <label key={n} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="Nationality"
                  value={n}
                  checked={data.Nationality === n}
                  onChange={handleChange}
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 2: Address Details ---
type StepAddressProps = {
  data: AddressDetail;
  setData: (d: AddressDetail) => void;
  errors: Errors<AddressDetail>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepAddress({ data, setData, errors, onNext, onBack, submitting }: StepAddressProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Address Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Region / City Administration" required error={errors.RegionCityAdministration}>
          <select
            className="form-select w-full p-2 rounded border"
            name="RegionCityAdministration"
            value={data.RegionCityAdministration}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Addis Ababa">Addis Ababa</option>
            <option value="Oromia">Oromia</option>
            <option value="Amhara">Amhara</option>
            <option value="Tigray">Tigray</option>
            <option value="Sidama">Sidama</option>
            <option value="Southern Nations">Southern Nations</option>
            <option value="Gambella">Gambella</option>
            <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
            <option value="Afar">Afar</option>
            <option value="Somali">Somali</option>
            <option value="Harari">Harari</option>
            <option value="Dire Dawa">Dire Dawa</option>
          </select>
        </Field>
        <Field label="Zone" error={errors.Zone}>
          <input
            type="text"
            name="Zone"
            className="form-input w-full p-2 rounded border"
            value={data.Zone || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Sub-City" error={errors.SubCity}>
          <input
            type="text"
            name="SubCity"
            className="form-input w-full p-2 rounded border"
            value={data.SubCity || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Wereda / Kebele" error={errors.WeredaKebele}>
          <input
            type="text"
            name="WeredaKebele"
            className="form-input w-full p-2 rounded border"
            value={data.WeredaKebele || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="House Number" error={errors.HouseNumber}>
          <input
            type="text"
            name="HouseNumber"
            className="form-input w-full p-2 rounded border"
            value={data.HouseNumber || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Mobile Phone" required error={errors.MobilePhone}>
          <input
            type="tel"
            name="MobilePhone"
            className="form-input w-full p-2 rounded border"
            value={data.MobilePhone}
            onChange={handleChange}
          />
        </Field>
        <Field label="Office Phone" error={errors.OfficePhone}>
          <input
            type="tel"
            name="OfficePhone"
            className="form-input w-full p-2 rounded border"
            value={data.OfficePhone || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Email Address" error={errors.EmailAddress}>
          <input
            type="email"
            name="EmailAddress"
            className="form-input w-full p-2 rounded border"
            value={data.EmailAddress || ""}
            onChange={handleChange}
          />
        </Field>
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 3: Financial Details ---
type StepFinancialProps = {
  data: FinancialDetail;
  setData: (d: FinancialDetail) => void;
  errors: Errors<FinancialDetail>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepFinancial({ data, setData, errors, onNext, onBack, submitting }: StepFinancialProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Financial Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Type of Work" required error={errors.TypeOfWork}>
          <div className="flex gap-3">
            {["Private", "Employee"].map((type) => (
              <label key={type} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="TypeOfWork"
                  value={type}
                  checked={data.TypeOfWork === type}
                  onChange={handleChange}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </Field>
        {/* Private Worker Fields */}
        {data.TypeOfWork === "Private" && (
          <>
            <Field label="Business Sector" required error={errors.BusinessSector}>
              <input
                type="text"
                name="BusinessSector"
                className="form-input w-full p-2 rounded border"
                value={data.BusinessSector || ""}
                onChange={handleChange}
              />
            </Field>
            <Field label="Income Frequency" required error={errors.IncomeFrequency}>
              <div className="flex gap-3">
                {["Annual", "Monthly", "Daily"].map((freq) => (
                  <label key={freq} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="IncomeFrequency"
                      value={freq}
                      checked={data.IncomeFrequency === freq}
                      onChange={handleChange}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Income Amount" required error={errors.IncomeAmount}>
              <input
                type="text"
                name="IncomeAmount"
                className="form-input w-full p-2 rounded border"
                value={data.IncomeAmount || ""}
                onChange={handleChange}
              />
            </Field>
            <Field label="Other Income (if any)" error={errors.OtherIncome}>
              <input
                type="text"
                name="OtherIncome"
                className="form-input w-full p-2 rounded border"
                value={data.OtherIncome || ""}
                onChange={handleChange}
              />
            </Field>
          </>
        )}
        {/* Employee Fields */}
        {data.TypeOfWork === "Employee" && (
          <>
            <Field label="Sector of Employer" required error={errors.SectorOfEmployer}>
              <input
                type="text"
                name="SectorOfEmployer"
                className="form-input w-full p-2 rounded border"
                value={data.SectorOfEmployer || ""}
                onChange={handleChange}
              />
            </Field>
            <Field label="Job Position" required error={errors.JobPosition}>
              <input
                type="text"
                name="JobPosition"
                className="form-input w-full p-2 rounded border"
                value={data.JobPosition || ""}
                onChange={handleChange}
              />
            </Field>
            <Field label="Income Frequency" required error={errors.IncomeFrequency}>
              <div className="flex gap-3">
                {["Annual", "Monthly", "Daily"].map((freq) => (
                  <label key={freq} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="IncomeFrequency"
                      value={freq}
                      checked={data.IncomeFrequency === freq}
                      onChange={handleChange}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Income Amount" required error={errors.IncomeAmount}>
              <input
                type="text"
                name="IncomeAmount"
                className="form-input w-full p-2 rounded border"
                value={data.IncomeAmount || ""}
                onChange={handleChange}
              />
            </Field>
          </>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 4: Other Details ---
type StepOtherProps = {
  data: OtherDetail;
  setData: (d: OtherDetail) => void;
  errors: Errors<OtherDetail>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepOther({ data, setData, errors, onNext, onBack, submitting }: StepOtherProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // const { name, value, type, checked } = e.target;
    // setData({ ...data, [name]: type === "checkbox" ? checked : value });

     const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setData({ ...data, [name]: type === "checkbox" ? checked : value });
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Other Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Have you ever been convicted of a crime?" error={errors.HasBeenConvicted}>
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="HasBeenConvicted"
                checked={data.HasBeenConvicted === true}
                onChange={() => setData({ ...data, HasBeenConvicted: true })}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="HasBeenConvicted"
                checked={data.HasBeenConvicted === false}
                onChange={() => setData({ ...data, HasBeenConvicted: false })}
              />
              <span>No</span>
            </label>
          </div>
        </Field>
        {data.HasBeenConvicted && (
          <Field label="Reason for Conviction" required error={errors.ConvictionReason}>
            <input
              type="text"
              name="ConvictionReason"
              className="form-input w-full p-2 rounded border"
              value={data.ConvictionReason || ""}
              onChange={handleChange}
            />
          </Field>
        )}
        <Field label="Are you a Politically Exposed Person (PEP)?" error={errors.IsPoliticallyExposed}>
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="IsPoliticallyExposed"
                checked={data.IsPoliticallyExposed === true}
                onChange={() => setData({ ...data, IsPoliticallyExposed: true })}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                name="IsPoliticallyExposed"
                checked={data.IsPoliticallyExposed === false}
                onChange={() => setData({ ...data, IsPoliticallyExposed: false })}
              />
              <span>No</span>
            </label>
          </div>
        </Field>
        {data.IsPoliticallyExposed && (
          <Field label="PEP Position" required error={errors.PepPosition}>
            <input
              type="text"
              name="PepPosition"
              className="form-input w-full p-2 rounded border"
              value={data.PepPosition || ""}
              onChange={handleChange}
            />
          </Field>
        )}
        <Field label="Source of Fund" required error={errors.SourceOfFund}>
          <select
            className="form-select w-full p-2 rounded border"
            name="SourceOfFund"
            value={data.SourceOfFund}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Salary">Salary</option>
            <option value="Business Income">Business Income</option>
            <option value="Gift">Gift</option>
            <option value="Inheritance">Inheritance</option>
            <option value="Loan">Loan</option>
            <option value="Pension">Pension</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        {data.SourceOfFund === "Other" && (
          <Field label="Specify Other Source of Fund" required error={errors.OtherSourceOfFund}>
            <input
              type="text"
              name="OtherSourceOfFund"
              className="form-input w-full p-2 rounded border"
              value={data.OtherSourceOfFund || ""}
              onChange={handleChange}
            />
          </Field>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 5: Document Details ---
type StepDocumentProps = {
  data: DocumentDetail;
  setData: (d: DocumentDetail) => void;
  errors: Errors<DocumentDetail>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepDocument({ data, setData, errors, onNext, onBack, submitting }: StepDocumentProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setData({ ...data, PhotoIdFile: e.target.files[0] }); // Changed to PhotoIdFile
    } else {
      setData({ ...data, PhotoIdFile: null }); // Changed to PhotoIdFile
    }
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Document Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ID Type" required error={errors.IdType}>
          <select
            className="form-select w-full p-2 rounded border"
            name="IdType"
            value={data.IdType}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="National ID">National ID</option>
            <option value="Passport">Passport</option>
            <option value="Driver's License">Driver's License</option>
            <option value="Resident Permit">Resident Permit</option>
          </select>
        </Field>
        <Field label="ID / Passport No." required error={errors.IdPassportNo}>
          <input
            type="text"
            name="IdPassportNo"
            className="form-input w-full p-2 rounded border"
            value={data.IdPassportNo}
            onChange={handleChange}
          />
        </Field>
        <Field label="ID Issue Date" required error={errors.IdIssueDate}>
          <input
            type="date"
            name="IdIssueDate"
            className="form-input w-full p-2 rounded border"
            value={data.IdIssueDate}
            onChange={handleChange}
          />
        </Field>
        <Field label="ID Expiry Date" required error={errors.IdExpiryDate}>
          <input
            type="date"
            name="IdExpiryDate"
            className="form-input w-full p-2 rounded border"
            value={data.IdExpiryDate}
            onChange={handleChange}
          />
        </Field>
        <Field label="ID Issue Place" error={errors.IdIssuePlace}>
          <input
            type="text"
            name="IdIssuePlace"
            className="form-input w-full p-2 rounded border"
            value={data.IdIssuePlace || ""}
            onChange={handleChange}
          />
        </Field>
        <Field label="Upload Photo of ID" required error={errors.PhotoIdFile}>
          <input
            type="file"
            name="PhotoIdFile" // Changed to PhotoIdFile
            className="form-input w-full p-2 rounded border"
            onChange={handleFileChange}
            accept="image/*"
          />
          {data.PhotoIdFile && <p className="text-sm text-gray-500 mt-1">Selected: {data.PhotoIdFile.name}</p>}
        </Field>
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 6: E-Payment Services ---
type StepEPaymentProps = {
  data: EPaymentService;
  setData: (d: EPaymentService) => void;
  errors: Errors<EPaymentService>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepEPayment({ data, setData, errors, onNext, onBack, submitting }: StepEPaymentProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // const { name, value, type, checked } = e.target;
    // setData({ ...data, [name]: type === "checkbox" ? checked : value });
     const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setData({ ...data, [name]: type === "checkbox" ? checked : value });


  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">E-Payment Services</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Do you need an ATM Card?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="HasAtmCard"
                checked={data.HasAtmCard}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
        {data.HasAtmCard && (
          <>
            <Field label="ATM Card Type" required error={errors.AtmCardType}>
              <select
                className="form-select w-full p-2 rounded border"
                name="AtmCardType"
                value={data.AtmCardType}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Visa">Visa</option>
                <option value="MasterCard">MasterCard</option>
                <option value="UnionPay">UnionPay</option>
              </select>
            </Field>
            <Field label="ATM Card Delivery Branch" required error={errors.AtmCardDeliveryBranch}>
              <input
                type="text"
                name="AtmCardDeliveryBranch"
                className="form-input w-full p-2 rounded border"
                value={data.AtmCardDeliveryBranch || ""}
                onChange={handleChange}
                placeholder="e.g., Main Branch"
              />
            </Field>
          </>
        )}
        <Field label="Do you need Mobile Banking?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="HasMobileBanking"
                checked={data.HasMobileBanking}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
        <Field label="Do you need Internet Banking?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="HasInternetBanking"
                checked={data.HasInternetBanking}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
        <Field label="Do you need SMS Banking?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="HasSmsBanking"
                checked={data.HasSmsBanking}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 7: Passbook & Muday Box Request ---
type StepPassbookMudayProps = {
  data: PassbookMudayRequest;
  setData: (d: PassbookMudayRequest) => void;
  errors: Errors<PassbookMudayRequest>;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
};

function StepPassbookMuday({ data, setData, errors, onNext, onBack, submitting }: StepPassbookMudayProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setData({ ...data, [name]: checked });
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, MudayBoxDeliveryBranch: e.target.value }); // Changed to MudayBoxDeliveryBranch
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Passbook & Muday Box Request</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Do you need a Passbook?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="NeedsPassbook"
                checked={data.NeedsPassbook}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
        <Field label="Do you need a Muday Box?">
          <div className="flex gap-3">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="NeedsMudayBox"
                checked={data.NeedsMudayBox}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
        {data.NeedsMudayBox && (
          <Field label="Muday Box Delivery Branch" required={data.NeedsMudayBox} error={errors.MudayBoxDeliveryBranch}>
            <input
              type="text"
              name="MudayBoxDeliveryBranch" // Changed to MudayBoxDeliveryBranch
              className="form-input w-full p-2 rounded border"
              value={data.MudayBoxDeliveryBranch || ""}
              onChange={handleBranchChange}
              placeholder="e.g., Bole Branch"
            />
          </Field>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onNext}
          disabled={submitting}
        >
          Next
        </button>
      </div>
    </>
  );
}

// --- Step 8: Digital Signature & Submission ---
type StepSignatureProps = {
  data: DigitalSignature;
  setData: (d: DigitalSignature) => void;
  errors: Errors<DigitalSignature>;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  submitting: boolean;
  submitError: string | null;
};

function StepSignature({ data, setData, errors, onSubmit, onBack, submitting, submitError }: StepSignatureProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setData({ ...data, PhotoFile: e.target.files[0] }); // Changed to PhotoFile
    } else {
      setData({ ...data, PhotoFile: null }); // Changed to PhotoFile
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, TermsAccepted: e.target.checked }); // Changed to TermsAccepted
  };

  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Digital Signature & Submission</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Upload Your Photo/Signature" required error={errors.PhotoFile}>
          <input
            type="file"
            name="PhotoFile" // Changed to PhotoFile
            className="form-input w-full p-2 rounded border"
            onChange={handleFileChange}
            accept="image/*"
          />
          {data.PhotoFile && <p className="text-sm text-gray-500 mt-1">Selected: {data.PhotoFile.name}</p>}
        </Field>
        <Field label="Agree to Terms & Conditions" required error={errors.TermsAccepted}>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="TermsAccepted" // Changed to TermsAccepted
              checked={data.TermsAccepted}
              onChange={handleTermsChange}
              className="form-checkbox"
            />
            <span>I agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms and Conditions</a></span>
          </label>
        </Field>
      </div>
      {submitError && (
        <div className="bg-red-100 text-red-700 p-3 rounded mt-4 text-center">
          {submitError}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// Main Multi-Step Form Component
// -----------------------------------------------------------------------------

function AccountOpening() {
  const navigate = useNavigate();
  const totalSteps = 8;
  const stepTitles = [
    "Personal",
    "Address",
    "Financial",
    "Other",
    "Document",
    "E-Payment",
    "Passbook",
    "Signature",
  ];
  
// Initial state setup
  const initialState: AccountOpeningFormData = {
    PersonalDetails: {
      AccountType: "",
      Title: "",
      YourName: "",
      FatherName: "",
      GrandfatherName: "",
      MotherFullName: "",
      Sex: "",
      DateOfBirth: "",
      PlaceOfBirth: "",
      MaritalStatus: "",
      EducationQualification: "",
      Nationality: "",
    },
    AddressDetails: {
      RegionCityAdministration: "",
      Zone: "",
      SubCity: "",
      WeredaKebele: "",
      HouseNumber: "",
      MobilePhone: "",
      OfficePhone: "",
      EmailAddress: "",
    },
    FinancialDetails: {
      TypeOfWork: "",
      BusinessSector: "",
      IncomeFrequency: "",
      IncomeAmount: "",
      OtherIncome: "",
      SectorOfEmployer: "",
      JobPosition: "",
    },
    OtherDetails: {
      HasBeenConvicted: false,
      ConvictionReason: "",
      IsPoliticallyExposed: false,
      PepPosition: "",
      SourceOfFund: "",
      OtherSourceOfFund: "",
    },
    DocumentDetails: {
      IdType: "",
      IdPassportNo: "",
      IdIssueDate: "",
      IdExpiryDate: "",
      IdIssuePlace: "",
      PhotoIdFile: null,
    },
    EPaymentServices: {
      HasAtmCard: false,
      AtmCardType: "",
      AtmCardDeliveryBranch: "",
      HasMobileBanking: false,
      HasInternetBanking: false,
      HasSmsBanking: false,
    },
    PassbookMudayRequest: {
      NeedsPassbook: false,
      NeedsMudayBox: false,
      MudayBoxDeliveryBranch: "",
    },
    DigitalSignature: {
      TermsAccepted: false,
      PhotoFile: null,
    },
  };

  // Global form data state (NOW uses PascalCase keys for nested DTOs and their properties)
 const [formData, setFormData] = useState<AccountOpeningFormData>(initialState);
 const [currentStep, setCurrentStep] = useState<number>(0);
 const [files, setFiles] = useState<{ doc: File | null, sig: File | null }>({ doc: null, sig: null });
 const [autoSaved, setAutoSaved] = useState<boolean>(false);

 // Restore from session storage on mount
  useEffect(() => {
    const { data, step } = loadSession(initialState, setFiles);
    setFormData(data);
    setCurrentStep(step);
  }, []);

  // Save on every major change (debounced for performance)
  const saveTimeout = useRef<number | null>(null);

useEffect(() => {
  if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
  saveTimeout.current = window.setTimeout(() => {
    saveSession(formData, currentStep);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1200);
  }, 400);
  return () => {
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
  };
}, [formData, currentStep]);
  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("accountOpeningFormData", JSON.stringify(formData));
  }, [formData]);

  // Function to update nested form data
  const updateFormData = <K extends keyof AccountOpeningFormData>(
    key: K,
    data: AccountOpeningFormData[K]
  ) => {
    if (key === "DocumentDetails" && (data as any).PhotoIdFile !== undefined) {
      setFiles(f => ({ ...f, doc: (data as any).PhotoIdFile }));
      setFormData(prev => ({
        ...prev,
        [key]: { ...(data as any), PhotoIdFile: null }, // keep file input in memory, not in state
      }));
    } else if (key === "DigitalSignature" && (data as any).PhotoFile !== undefined) {
      setFiles(f => ({ ...f, sig: (data as any).PhotoFile }));
      setFormData(prev => ({
        ...prev,
        [key]: { ...(data as any), PhotoFile: null },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: data,
      }));
    }
  };
  // Clear session storage after submit/cancel
  const handleClearAndExit = () => {
    clearSession();
    navigate("/dashboard");
  };

  // State for errors (keys now match PascalCase properties)
  const [personalErrors, setPersonalErrors] = useState<Errors<PersonalDetail>>({});
  const [addressErrors, setAddressErrors] = useState<Errors<AddressDetail>>({});
  const [financialErrors, setFinancialErrors] = useState<Errors<FinancialDetail>>({});
  const [otherErrors, setOtherErrors] = useState<Errors<OtherDetail>>({});
  const [documentErrors, setDocumentErrors] = useState<Errors<DocumentDetail>>({});
  const [epaymentErrors, setEPaymentErrors] = useState<Errors<EPaymentService>>({});
  const [passbookMudayErrors, setPassbookMudayErrors] = useState<Errors<PassbookMudayRequest>>({});
  const [digitalSignatureErrors, setDigitalSignatureErrors] = useState<Errors<DigitalSignature>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);


  // --- Validation Functions (Updated to use PascalCase properties) ---
  const validatePersonal = (): boolean => {
    let err: Errors<PersonalDetail> = {};
    if (!formData.PersonalDetails.AccountType) err.AccountType = "Account type is required.";
    if (!formData.PersonalDetails.Title) err.Title = "Title is required.";
    if (!formData.PersonalDetails.YourName) err.YourName = "Your name is required.";
    if (!formData.PersonalDetails.FatherName) err.FatherName = "Father's name is required.";
    if (!formData.PersonalDetails.GrandfatherName) err.GrandfatherName = "Grandfather's name is required.";
    if (!formData.PersonalDetails.Sex) err.Sex = "Sex is required.";
    if (!formData.PersonalDetails.DateOfBirth) err.DateOfBirth = "Date of Birth is required.";
    else {
      const dobDate = new Date(formData.PersonalDetails.DateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        err.DateOfBirth = "Applicant must be at least 18 years old.";
      }
    }
    if (!formData.PersonalDetails.MaritalStatus) err.MaritalStatus = "Marital Status is required.";
    if (!formData.PersonalDetails.Nationality) err.Nationality = "Nationality is required.";
    setPersonalErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateAddress = (): boolean => {
    let err: Errors<AddressDetail> = {};
    if (!formData.AddressDetails.RegionCityAdministration) err.RegionCityAdministration = "Region/City Administration is required.";
    if (!formData.AddressDetails.MobilePhone) err.MobilePhone = "Mobile Phone is required.";
    else if (!/^\d{10}$/.test(formData.AddressDetails.MobilePhone)) err.MobilePhone = "Mobile Phone must be 10 digits.";
    if (formData.AddressDetails.EmailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.AddressDetails.EmailAddress)) {
      err.EmailAddress = "Invalid email format.";
    }
    setAddressErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateFinancial = (): boolean => {
    let err: Errors<FinancialDetail> = {};
    if (!formData.FinancialDetails.TypeOfWork) err.TypeOfWork = "Type of Work is required.";

    if (formData.FinancialDetails.TypeOfWork === "Private") {
      if (!formData.FinancialDetails.BusinessSector) err.BusinessSector = "Business Sector is required for Private Workers.";
      if (!formData.FinancialDetails.IncomeFrequency) err.IncomeFrequency = "Income Frequency is required.";
      if (!formData.FinancialDetails.IncomeAmount) err.IncomeAmount = "Income Amount is required.";
      else if (isNaN(Number(formData.FinancialDetails.IncomeAmount)) || Number(formData.FinancialDetails.IncomeAmount) <= 0) err.IncomeAmount = "Income Amount must be a positive number.";
    }
    if (formData.FinancialDetails.TypeOfWork === "Employee") {
      if (!formData.FinancialDetails.SectorOfEmployer) err.SectorOfEmployer = "Sector of Employer is required for Employees.";
      if (!formData.FinancialDetails.JobPosition) err.JobPosition = "Job Position is required for Employees.";
      if (!formData.FinancialDetails.IncomeFrequency) err.IncomeFrequency = "Income Frequency is required.";
      if (!formData.FinancialDetails.IncomeAmount) err.IncomeAmount = "Income Amount is required.";
      else if (isNaN(Number(formData.FinancialDetails.IncomeAmount)) || Number(formData.FinancialDetails.IncomeAmount) <= 0) err.IncomeAmount = "Income Amount must be a positive number.";
    }
    setFinancialErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateOther = (): boolean => {
    let err: Errors<OtherDetail> = {};
    if (formData.OtherDetails.HasBeenConvicted === undefined) {
      err.HasBeenConvicted = "Please specify if you have been convicted.";
    } else if (formData.OtherDetails.HasBeenConvicted && !formData.OtherDetails.ConvictionReason) {
      err.ConvictionReason = "Reason for conviction is required.";
    }

    if (formData.OtherDetails.IsPoliticallyExposed === undefined) {
      err.IsPoliticallyExposed = "Please specify if you are a PEP.";
    } else if (formData.OtherDetails.IsPoliticallyExposed && !formData.OtherDetails.PepPosition) {
      err.PepPosition = "PEP Position is required.";
    }

    if (!formData.OtherDetails.SourceOfFund) err.SourceOfFund = "Source of Fund is required.";
    if (formData.OtherDetails.SourceOfFund === "Other" && !formData.OtherDetails.OtherSourceOfFund) {
      err.OtherSourceOfFund = "Please specify other source of fund.";
    }
    setOtherErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateDocument = (): boolean => {
    let err: Errors<DocumentDetail> = {};
    if (!formData.DocumentDetails.IdType) err.IdType = "ID Type is required.";
    if (!formData.DocumentDetails.IdPassportNo) err.IdPassportNo = "ID/Passport No. is required.";
    if (!formData.DocumentDetails.IdIssueDate) err.IdIssueDate = "Issue Date is required.";
    if (!formData.DocumentDetails.IdExpiryDate) err.IdExpiryDate = "Expiry Date is required.";
    if (formData.DocumentDetails.IdIssueDate && formData.DocumentDetails.IdExpiryDate &&
        new Date(formData.DocumentDetails.IdIssueDate) >= new Date(formData.DocumentDetails.IdExpiryDate)) {
        err.IdExpiryDate = "Expiry Date must be after Issue Date.";
    }
    if (!formData.DocumentDetails.PhotoIdFile) err.PhotoIdFile = "ID Photo is required.";
    else if (formData.DocumentDetails.PhotoIdFile.size > 5 * 1024 * 1024) { // 5MB limit
      err.PhotoIdFile = "File size must be less than 5MB.";
    }
    setDocumentErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateEPayment = (): boolean => {
    let err: Errors<EPaymentService> = {};
    if (formData.EPaymentServices.HasAtmCard) {
      if (!formData.EPaymentServices.AtmCardType) err.AtmCardType = "ATM Card Type is required.";
      if (!formData.EPaymentServices.AtmCardDeliveryBranch) err.AtmCardDeliveryBranch = "ATM Card Delivery Branch is required.";
    }
    setEPaymentErrors(err);
    return Object.keys(err).length === 0;
  };

  const validatePassbookMuday = (): boolean => {
    let err: Errors<PassbookMudayRequest> = {};
    if (formData.PassbookMudayRequest.NeedsMudayBox && !formData.PassbookMudayRequest.MudayBoxDeliveryBranch) {
      err.MudayBoxDeliveryBranch = "Muday Box Delivery Branch is required.";
    }
    setPassbookMudayErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateDigitalSignature = (): boolean => {
    let err: Errors<DigitalSignature> = {};
    if (!formData.DigitalSignature.PhotoFile) err.PhotoFile = "Photo/Signature file is required.";
    else if (formData.DigitalSignature.PhotoFile.size > 5 * 1024 * 1024) { // 5MB limit
      err.PhotoFile = "File size must be less than 5MB.";
    }
    if (!formData.DigitalSignature.TermsAccepted) err.TermsAccepted = "You must accept the Terms & Conditions.";
    setDigitalSignatureErrors(err);
    return Object.keys(err).length === 0;
  };

  // --- Navigation Handlers ---
  const handleNext = async () => {
    setSubmitError(null);
    let isValid = false;
    switch (currentStep) {
      case 0:
        isValid = validatePersonal();
        break;
      case 1:
        isValid = validateAddress();
        break;
      case 2:
        isValid = validateFinancial();
        break;
      case 3:
        isValid = validateOther();
        break;
      case 4:
        isValid = validateDocument();
        break;
      case 5:
        isValid = validateEPayment();
        break;
      case 6:
        isValid = validatePassbookMuday();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((prev) => prev - 1);
  };

// Final submission: include files from refs
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validateDigitalSignature()) return;
    // Run all validation
    const allValid =
      validatePersonal() &&
      validateAddress() &&
      validateFinancial() &&
      validateOther() &&
      validateDocument() &&
      validateEPayment() &&
      validatePassbookMuday() &&
      validateDigitalSignature();
    if (!allValid) {
      setSubmitError("Please correct all errors in previous steps before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      // Compose full payload with files from refs
      const fullData = {
        ...formData,
        DocumentDetails: { ...formData.DocumentDetails, PhotoIdFile: files.doc },
        DigitalSignature: { ...formData.DigitalSignature, PhotoFile: files.sig },
      };
      const resp = await accountOpeningService.submitAccountOpening(fullData);
      clearSession();
      setReferenceId(resp.referenceId || null);
      setCustomerId(resp.customerId || null);
      setCurrentStep(totalSteps);
    } catch (e: any) {
      setSubmitError(e.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Main Render Logic ---
   return (
    <div className="min-h-screen bg-[#f5f0ff] p-2 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-purple-200">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-6 text-white rounded-t-xl flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Account Opening Form</h1>
          <div className="text-sm text-purple-100 mt-1 md:mt-0">
            Step {currentStep + 1} of {totalSteps}
            {autoSaved && (
              <span className="ml-3 text-green-200 animate-pulse font-medium">
                <svg className="inline w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-7V6a1 1 0 112 0v5a1 1 0 01-2 0zm2 3a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                Saved!
              </span>
            )}
          </div>
        </div>
        <div className="p-4 md:p-8">
          <div className="sticky top-0 z-10 bg-white pb-4">
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} stepTitles={stepTitles} />
          </div>
          {/* Render Steps */}
          {currentStep === 0 && (
            <StepPersonal
              data={formData.PersonalDetails}
              setData={d => updateFormData('PersonalDetails', d)}
              errors={personalErrors}
              onNext={handleNext}
              submitting={submitting}
            />
          )}
          {currentStep === 1 && (
            <StepAddress
              data={formData.AddressDetails}
              setData={d => updateFormData('AddressDetails', d)}
              errors={addressErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 2 && (
            <StepFinancial
              data={formData.FinancialDetails}
              setData={d => updateFormData('FinancialDetails', d)}
              errors={financialErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 3 && (
            <StepOther
              data={formData.OtherDetails}
              setData={d => updateFormData('OtherDetails', d)}
              errors={otherErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 4 && (
            <StepDocument
              data={{ ...formData.DocumentDetails, PhotoIdFile: files.doc }}
              setData={d => updateFormData('DocumentDetails', d)}
              errors={documentErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 5 && (
            <StepEPayment
              data={formData.EPaymentServices}
              setData={d => updateFormData('EPaymentServices', d)}
              errors={epaymentErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 6 && (
            <StepPassbookMuday
              data={formData.PassbookMudayRequest}
              setData={d => updateFormData('PassbookMudayRequest', d)}
              errors={passbookMudayErrors}
              onNext={handleNext}
              onBack={handleBack}
              submitting={submitting}
            />
          )}
          {currentStep === 7 && (
            <StepSignature
              data={{ ...formData.DigitalSignature, PhotoFile: files.sig }}
              setData={d => updateFormData('DigitalSignature', d)}
              errors={digitalSignatureErrors}
              onSubmit={handleSubmit}
              onBack={handleBack}
              submitting={submitting}
              submitError={submitError}
            />
          )}

          {currentStep === totalSteps && (
            <div className="p-6 bg-green-100 text-green-700 rounded-lg text-center text-lg font-bold mt-8">
              Submitted! Your Reference ID: <span className="font-mono">{referenceId || "N/A"}</span>
              <br/>
              Customer ID: <span className="font-mono">{customerId || "N/A"}</span>
              <div className="mt-4 flex gap-4 justify-center">
                <button
                  className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 mt-2"
                  onClick={handleClearAndExit}
                  type="button"
                >
                  Go to Home
                </button>
                <button
                  className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 mt-2"
                  onClick={() => {
                    clearSession();
                    navigate("/account-opening");
                  }}
                  type="button"
                >
                  Start New Application
                </button>
              </div>
            </div>
          )}
          {/* Cancel button for user control */}
          {currentStep < totalSteps && (
            <div className="mt-8 flex justify-end">
              <button
                className="text-sm text-purple-500 hover:underline"
                onClick={handleClearAndExit}
                type="button"
              >
                Cancel and Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountOpening;