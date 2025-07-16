import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

// ----------- Types -----------
type PersonalDetail = {
  accountType: "Savings" | "Current" | "IFB" | ""
  title: "Mr." | "Mrs." | "Miss" | "Ms." | "Dr." | ""
  name: string
  fatherName: string
  grandfatherName: string
  motherFullName: string
  sex: "Male" | "Female" | ""
  dob: string
  placeOfBirth: string
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | ""
  education: string
  nationality: "Ethiopian" | "Foreign National" | ""
}

type AccountOpeningFormData = {
  personal: PersonalDetail
  address: AddressDetail
  financial: FinancialDetail
  // other: OtherDetail
  // document: DocumentDetail
  // epayment: EPaymentServices
  // passbookMuday: PassbookMuday
  // signature: SignatureSubmit
}

type Errors<T> = Partial<Record<keyof T, string>>

// ----------- API Stubs (Replace with actual API calls) -----------
async function postAccountOpening(data: Partial<AccountOpeningFormData>): Promise<{ referenceId: string }> {
  // Replace with actual API call
  console.log("Submitting account opening data:", data)
  await new Promise((res) => setTimeout(res, 1000))
  return { referenceId: "AO-20250716-00123" }
}

// ----------- Reusable Field -----------
type FieldProps = {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}
function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  )
}

// ----------- Step 1: Personal Details -----------
type StepPersonalProps = {
  data: PersonalDetail
  setData: (d: PersonalDetail) => void
  errors: Errors<PersonalDetail>
  onNext: () => void
  submitting: boolean
}
function StepPersonal({ data, setData, errors, onNext, submitting }: StepPersonalProps) {
  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Personal Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account Type" required error={errors.accountType}>
          <select
            className="form-select w-full p-2 rounded border"
            value={data.accountType}
            onChange={e => setData({ ...data, accountType: e.target.value as PersonalDetail["accountType"] })}
          >
            <option value="">Select</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
            <option value="IFB">IFB</option>
          </select>
        </Field>
        <Field label="Title" required error={errors.title}>
          <div className="flex gap-3">
            {["Mr.", "Mrs.", "Miss", "Ms.", "Dr."].map(t => (
              <label key={t} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="title"
                  value={t}
                  checked={data.title === t}
                  onChange={e =>
                    setData({ ...data, title: e.target.value as PersonalDetail["title"] })
                  }
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Your Name" required error={errors.name}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
            placeholder="Full name"
          />
        </Field>
        <Field label="Father's Name" required error={errors.fatherName}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.fatherName}
            onChange={e => setData({ ...data, fatherName: e.target.value })}
          />
        </Field>
        <Field label="Grandfather's Name" required error={errors.grandfatherName}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.grandfatherName}
            onChange={e => setData({ ...data, grandfatherName: e.target.value })}
          />
        </Field>
        <Field label="Mother's Full Name" error={errors.motherFullName}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.motherFullName}
            onChange={e => setData({ ...data, motherFullName: e.target.value })}
          />
        </Field>
        <Field label="Sex" required error={errors.sex}>
          <div className="flex gap-3">
            {["Male", "Female"].map(s => (
              <label key={s} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="sex"
                  value={s}
                  checked={data.sex === s}
                  onChange={e =>
                    setData({ ...data, sex: e.target.value as PersonalDetail["sex"] })
                  }
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Date of Birth" required error={errors.dob}>
          <input
            type="date"
            className="form-input w-full p-2 rounded border"
            value={data.dob}
            onChange={e => setData({ ...data, dob: e.target.value })}
          />
        </Field>
        <Field label="Place of Birth" error={errors.placeOfBirth}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.placeOfBirth}
            onChange={e => setData({ ...data, placeOfBirth: e.target.value })}
          />
        </Field>
        <Field label="Marital Status" required error={errors.maritalStatus}>
          <div className="flex gap-3">
            {["Single", "Married", "Divorced", "Widowed"].map(m => (
              <label key={m} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="maritalStatus"
                  value={m}
                  checked={data.maritalStatus === m}
                  onChange={e =>
                    setData({ ...data, maritalStatus: e.target.value as PersonalDetail["maritalStatus"] })
                  }
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Education Qualification" error={errors.education}>
          <select
            className="form-select w-full p-2 rounded border"
            value={data.education}
            onChange={e => setData({ ...data, education: e.target.value })}
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
        <Field label="Nationality" required error={errors.nationality}>
          <div className="flex gap-3">
            {["Ethiopian", "Foreign National"].map(n => (
              <label key={n} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="nationality"
                  value={n}
                  checked={data.nationality === n}
                  onChange={e =>
                    setData({ ...data, nationality: e.target.value as PersonalDetail["nationality"] })
                  }
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
  )
}

// --- Types ---
type AddressDetail = {
  region: string
  zone: string
  subCity: string
  wereda: string
  houseNumber: string
  mobilePhone: string
  officePhone?: string
  email?: string
}

type FinancialDetail = {
  workType: "Private" | "Employee" | ""
  businessSector?: string
  incomeFrequency?: "Annual" | "Monthly" | "Daily"
  incomeAmount?: string
  otherIncome?: string
  employerSector?: string
  jobPosition?: string
}

// --- Step 2: Address Details ---
type StepAddressProps = {
  data: AddressDetail
  setData: (d: AddressDetail) => void
  errors: Errors<AddressDetail>
  onNext: () => void
  onBack: () => void
  submitting: boolean
}
function StepAddress({ data, setData, errors, onNext, onBack, submitting }: StepAddressProps) {
  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Address Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Region / City Administration" required error={errors.region}>
          <select
            className="form-select w-full p-2 rounded border"
            value={data.region}
            onChange={e => setData({ ...data, region: e.target.value })}
          >
            <option value="">Select</option>
            <option value="Addis Ababa">Addis Ababa</option>
            <option value="Oromia">Oromia</option>
            <option value="Amhara">Amhara</option>
            {/* Add more regions */}
          </select>
        </Field>
        <Field label="Zone" error={errors.zone}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.zone}
            onChange={e => setData({ ...data, zone: e.target.value })}
          />
        </Field>
        <Field label="Sub-City" error={errors.subCity}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.subCity}
            onChange={e => setData({ ...data, subCity: e.target.value })}
          />
        </Field>
        <Field label="Wereda / Kebele" error={errors.wereda}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.wereda}
            onChange={e => setData({ ...data, wereda: e.target.value })}
          />
        </Field>
        <Field label="House Number" error={errors.houseNumber}>
          <input
            type="text"
            className="form-input w-full p-2 rounded border"
            value={data.houseNumber}
            onChange={e => setData({ ...data, houseNumber: e.target.value })}
          />
        </Field>
        <Field label="Mobile Phone" required error={errors.mobilePhone}>
          <input
            type="tel"
            className="form-input w-full p-2 rounded border"
            value={data.mobilePhone}
            onChange={e => setData({ ...data, mobilePhone: e.target.value })}
          />
        </Field>
        <Field label="Office Phone" error={errors.officePhone}>
          <input
            type="tel"
            className="form-input w-full p-2 rounded border"
            value={data.officePhone || ""}
            onChange={e => setData({ ...data, officePhone: e.target.value })}
          />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input
            type="email"
            className="form-input w-full p-2 rounded border"
            value={data.email || ""}
            onChange={e => setData({ ...data, email: e.target.value })}
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
  )
}

// --- Step 3: Financial Details ---
type StepFinancialProps = {
  data: FinancialDetail
  setData: (d: FinancialDetail) => void
  errors: Errors<FinancialDetail>
  onNext: () => void
  onBack: () => void
  submitting: boolean
}
function StepFinancial({ data, setData, errors, onNext, onBack, submitting }: StepFinancialProps) {
  return (
    <>
      <div className="text-xl font-bold mb-3 text-purple-800">Financial Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Type of Work" required error={errors.workType}>
          <div className="flex gap-3">
            {["Private", "Employee"].map(type => (
              <label key={type} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="workType"
                  value={type}
                  checked={data.workType === type}
                  onChange={e => setData({ ...data, workType: e.target.value as FinancialDetail["workType"] })}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </Field>
        {/* Private Worker Fields */}
        {data.workType === "Private" && (
          <>
            <Field label="Business Sector" error={errors.businessSector}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.businessSector || ""}
                onChange={e => setData({ ...data, businessSector: e.target.value })}
              />
            </Field>
            <Field label="Income Frequency" error={errors.incomeFrequency}>
              <div className="flex gap-3">
                {["Annual", "Monthly", "Daily"].map(freq => (
                  <label key={freq} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="incomeFrequency"
                      value={freq}
                      checked={data.incomeFrequency === freq}
                      onChange={e => setData({ ...data, incomeFrequency: e.target.value as FinancialDetail["incomeFrequency"] })}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Income Amount" error={errors.incomeAmount}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.incomeAmount || ""}
                onChange={e => setData({ ...data, incomeAmount: e.target.value })}
              />
            </Field>
            <Field label="Other Income (if any)" error={errors.otherIncome}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.otherIncome || ""}
                onChange={e => setData({ ...data, otherIncome: e.target.value })}
              />
            </Field>
          </>
        )}
        {/* Employee Fields */}
        {data.workType === "Employee" && (
          <>
            <Field label="Sector of Employer" error={errors.employerSector}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.employerSector || ""}
                onChange={e => setData({ ...data, employerSector: e.target.value })}
              />
            </Field>
            <Field label="Job Position" error={errors.jobPosition}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.jobPosition || ""}
                onChange={e => setData({ ...data, jobPosition: e.target.value })}
              />
            </Field>
            <Field label="Income Frequency" error={errors.incomeFrequency}>
              <div className="flex gap-3">
                {["Annual", "Monthly", "Daily"].map(freq => (
                  <label key={freq} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="incomeFrequency"
                      value={freq}
                      checked={data.incomeFrequency === freq}
                      onChange={e => setData({ ...data, incomeFrequency: e.target.value as FinancialDetail["incomeFrequency"] })}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Income Amount" error={errors.incomeAmount}>
              <input
                type="text"
                className="form-input w-full p-2 rounded border"
                value={data.incomeAmount || ""}
                onChange={e => setData({ ...data, incomeAmount: e.target.value })}
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
  )
}

// ----------- Main Multi-Step Form -----------
function AccountOpening() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(0)
  const [personal, setPersonal] = useState<PersonalDetail>({
    accountType: "",
    title: "",
    name: "",
    fatherName: "",
    grandfatherName: "",
    motherFullName: "",
    sex: "",
    dob: "",
    placeOfBirth: "",
    maritalStatus: "",
    education: "",
    nationality: "",
  })
  const [personalErrors, setPersonalErrors] = useState<Errors<PersonalDetail>>({})
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [address, setAddress] = useState<AddressDetail>({
    region: "",
    zone: "",
    subCity: "",
    wereda: "",
    houseNumber: "",
    mobilePhone: "",
    officePhone: "",
    email: "",
  })
  const [addressErrors, setAddressErrors] = useState<Errors<AddressDetail>>({})
  const [financial, setFinancial] = useState<FinancialDetail>({
    workType: "",
    businessSector: "",
    incomeFrequency: undefined,
    incomeAmount: "",
    otherIncome: "",
    employerSector: "",
    jobPosition: "",
  })
  const [financialErrors, setFinancialErrors] = useState<Errors<FinancialDetail>>({})

  function validatePersonal(): boolean {
    let err: Errors<PersonalDetail> = {}
    if (!personal.accountType) err.accountType = "Required"
    if (!personal.title) err.title = "Required"
    if (!personal.name) err.name = "Required"
    if (!personal.fatherName) err.fatherName = "Required"
    if (!personal.grandfatherName) err.grandfatherName = "Required"
    if (!personal.sex) err.sex = "Required"
    if (!personal.dob) err.dob = "Required"
    if (!personal.maritalStatus) err.maritalStatus = "Required"
    if (!personal.nationality) err.nationality = "Required"
    setPersonalErrors(err)
    return Object.keys(err).length === 0
  }

  function validateAddress(): boolean {
    let err: Errors<AddressDetail> = {}
    if (!address.region) err.region = "Required"
    if (!address.mobilePhone) err.mobilePhone = "Required"
    setAddressErrors(err)
    return Object.keys(err).length === 0
  }

  function validateFinancial(): boolean {
    let err: Errors<FinancialDetail> = {}
    if (!financial.workType) err.workType = "Required"
    if (financial.workType === "Private") {
      if (!financial.businessSector) err.businessSector = "Required"
      if (!financial.incomeFrequency) err.incomeFrequency = "Required"
      if (!financial.incomeAmount) err.incomeAmount = "Required"
    }
    if (financial.workType === "Employee") {
      if (!financial.employerSector) err.employerSector = "Required"
      if (!financial.jobPosition) err.jobPosition = "Required"
      if (!financial.incomeFrequency) err.incomeFrequency = "Required"
      if (!financial.incomeAmount) err.incomeAmount = "Required"
    }
    setFinancialErrors(err)
    return Object.keys(err).length === 0
  }

  async function handleNext() {
    if (step === 0) {
      if (!validatePersonal()) return
      setStep(1)
    } else if (step === 1) {
      if (!validateAddress()) return
      setStep(2)
    } else if (step === 2) {
      if (!validateFinancial()) return
      setStep(3)
    }
    // Add similar logic for other steps
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const resp = await postAccountOpening({ personal, address, financial })
      setReferenceId(resp.referenceId)
    } catch (e) {
      alert("Submission failed. Please try again.")
    }
    setSubmitting(false)
  }

  // For demo, only Step 1 implemented.
  return (
    <div className="min-h-screen bg-[#f5f0ff] p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl border border-purple-200">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-6 text-white rounded-t-xl">
          <h1 className="text-2xl font-bold tracking-tight">Account Opening Form</h1>
          <div className="text-sm text-purple-100 mt-1">Step {step + 1} of 8</div>
        </div>
        <form
          className="p-8"
          onSubmit={e => {
            e.preventDefault()
            if (step === 0) handleNext()
            else if (step === 2) handleSubmit()
          }}
        >
          {step === 0 && (
            <StepPersonal
              data={personal}
              setData={setPersonal}
              errors={personalErrors}
              onNext={handleNext}
              submitting={submitting}
            />
          )}
          {step === 1 && (
            <StepAddress
              data={address}
              setData={setAddress}
              errors={addressErrors}
              onNext={handleNext}
              onBack={() => setStep(0)}
              submitting={submitting}
            />
          )}
          {step === 2 && (
            <StepFinancial
              data={financial}
              setData={setFinancial}
              errors={financialErrors}
              onNext={handleNext}
              onBack={() => setStep(1)}
              submitting={submitting}
            />
          )}
          {/* {step === 3 && <StepOther .../>} */}
          {/* {step === 4 && <StepDocument .../>} */}
          {/* {step === 5 && <StepEPayment .../>} */}
          {/* {step === 6 && <StepPassbookMuday .../>} */}
          {/* {step === 7 && <StepSignature .../>} */}
          {referenceId && (
            <div className="p-6 bg-green-100 text-green-700 rounded-lg text-center text-lg font-bold mt-8">
              Submitted! Your Reference ID: <span className="font-mono">{referenceId}</span>
              <div className="mt-4">
                <button
                  className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 mt-2"
                  onClick={() => navigate("/")}
                  type="button"
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
export default AccountOpening