import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'


// Helper: simple number to words (English, for demo)
function numberToWords(num: number): string {
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ]
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  if (isNaN(num) || num === 0) return ''
  if (num < 20) return a[num]
  if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '')
  if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
  if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
  return num.toString()
}

type FormData = {
  accountNumber: string
  accountHolderName: string
  accountType: 'Savings' | 'Current' | 'Special Demand'
  amount: string
  amountInWords: string
  sourceOfProceeds: string
  denominations: string
  depositedBy: string
  telephoneNumber: string
}

type Errors = Partial<Record<keyof FormData, string>>

export default function CashDepositForm() {
  // Mocked OTP login (real app: context/auth)
  const OTP_PHONE = "0911000111"
  const OTP_NAME = "Customer Name"

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    accountType: 'Savings',
    amount: '',
    amountInWords: '',
    sourceOfProceeds: '',
    denominations: '',
    depositedBy: OTP_NAME,
    telephoneNumber: OTP_PHONE
  })

  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // Auto-fill branch info from QR/link (as per FSD)
  const branchInfo = {
    name: 'Main Branch',
    id: 'BR1001',
    date: new Date().toLocaleDateString()
  }

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Auto-fill amount in words
    if (name === "amount") {
      setFormData(prev => ({
        ...prev,
        amount: value,
        amountInWords: numberToWords(Number(value))
      }))
    }
  }

  // Simulated CBS validation for account number
  const validateAccount = () => {
    if (!formData.accountNumber || formData.accountNumber.length < 7) {
      setErrors(prev => ({ ...prev, accountNumber: 'Account number must be at least 7 digits.' }))
      setFormData(prev => ({ ...prev, accountHolderName: '' }))
      return false
    }
    setFormData(prev => ({
      ...prev,
      accountHolderName: "Sample Customer Name"
    }))
    setErrors(prev => ({ ...prev, accountNumber: undefined }))
    return true
  }

  // Validate all required fields
  const validateAll = (): boolean => {
    let errs: Errors = {}
    if (!formData.accountNumber) errs.accountNumber = "Account number is required."
    if (!formData.accountHolderName) errs.accountHolderName = "Validate account number."
    if (!formData.amount) errs.amount = "Amount is required."
    if (formData.amount && Number(formData.amount) <= 0) errs.amount = "Amount must be positive."
    if (!formData.sourceOfProceeds) errs.sourceOfProceeds = "Source of proceeds is required."
    if (!formData.depositedBy) errs.depositedBy = "Depositor name required."
    if (!formData.telephoneNumber) errs.telephoneNumber = "Phone number required."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      // ...existing code...
navigate('/form/cash-deposit/cashdepositconfirmation', {
  state: {
    formType: 'Cash Deposit',
    referenceId: `CD-${Date.now()}`,
    accountNumber: formData.accountNumber,
    amount: formData.amount,
    branch: branchInfo.name,
    token: Math.floor(1000 + Math.random() * 9000),
    window: Math.floor(1 + Math.random() * 5)
  }
})
// ...existing code...
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#f5f0ff] p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-purple-200">
        <div className="bg-purple-700 p-6 text-white">
          <h1 className="text-2xl font-bold">Cash Deposit Form</h1>
          <div className="flex justify-between items-center mt-2">
            <p className="text-purple-100">Branch: {branchInfo.name} ({branchInfo.id})</p>
            <p className="text-purple-100">{branchInfo.date}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-7">
          {/* Account Section */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={`flex-1 rounded-l-lg border ${errors.accountNumber ? "border-red-400" : "border-purple-300"} focus:ring-2 focus:ring-purple-500 p-2`}
                    placeholder="Enter account number"
                  />
                  <button
                    type="button"
                    onClick={validateAccount}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg"
                  >
                    Search
                  </button>
                </div>
                {errors.accountNumber &&
                  <p className="mt-1 text-xs text-red-600">{errors.accountNumber}</p>
                }
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  readOnly
                  className="w-full rounded-lg border border-purple-300 bg-purple-50 p-2"
                  placeholder="Auto-filled after CBS validation"
                />
                {errors.accountHolderName &&
                  <p className="mt-1 text-xs text-red-600">{errors.accountHolderName}</p>
                }
              </div>
            </div>
            {/* Account type */}
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">Type of Account <span className="text-red-500">*</span></label>
              <div className="flex space-x-4">
                {(['Savings', 'Current', 'Special Demand'] as const).map((type) => (
                  <label key={type} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="accountType"
                      value={type}
                      checked={formData.accountType === type}
                      onChange={handleChange}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Amount Info */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Amount Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Amount in Figure <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${errors.amount ? "border-red-400" : "border-purple-300"} focus:ring-2 focus:ring-purple-500 p-2`}
                  placeholder="Enter amount"
                />
                {errors.amount &&
                  <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                }
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Amount in Words
                </label>
                <input
                  type="text"
                  name="amountInWords"
                  value={formData.amountInWords}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 p-2"
                  placeholder="Auto-filled"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Source of Proceeds <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sourceOfProceeds"
                value={formData.sourceOfProceeds}
                onChange={handleChange}
                className={`w-full rounded-lg border ${errors.sourceOfProceeds ? "border-red-400" : "border-purple-300"} focus:ring-2 focus:ring-purple-500 p-2`}
                placeholder="Source of funds"
              />
              {errors.sourceOfProceeds &&
                <p className="mt-1 text-xs text-red-600">{errors.sourceOfProceeds}</p>
              }
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Denominations <span className="text-purple-400">(for staff use)</span>
              </label>
              <textarea
                name="denominations"
                value={formData.denominations}
                onChange={handleChange}
                className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 p-2"
                placeholder="To be filled by front maker"
                rows={3}
                disabled
              />
            </div>
          </div>

          {/* Depositor Info */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Depositor Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Deposited By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="depositedBy"
                  value={formData.depositedBy}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${errors.depositedBy ? "border-red-400" : "border-purple-300"} focus:ring-2 focus:ring-purple-500 p-2`}
                  placeholder="Name of depositor"
                />
                {errors.depositedBy &&
                  <p className="mt-1 text-xs text-red-600">{errors.depositedBy}</p>
                }
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Telephone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telephoneNumber"
                  value={formData.telephoneNumber}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${errors.telephoneNumber ? "border-red-400" : "border-purple-300"} focus:ring-2 focus:ring-purple-500 p-2`}
                  placeholder="Phone number"
                />
                {errors.telephoneNumber &&
                  <p className="mt-1 text-xs text-red-600">{errors.telephoneNumber}</p>
                }
              </div>
            </div>
          </div>

          {/* Note & Submit */}
          <div className="pt-4 border-t border-purple-200">
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-purple-700">
                <strong>Note:</strong> This deposit form is not a receipt. Please collect an official receipt or check for digital receipt sent via SMS after transaction processing.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-70"
            >
              {isSubmitting ? 'Processing...' : 'Submit Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}