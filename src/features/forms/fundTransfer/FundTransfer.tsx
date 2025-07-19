import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline'

export default function FundTransfer() {
  const [formData, setFormData] = useState({
    debitAccountNumber: '',
    debitAccountName: '',
    amount: '',
    creditAccountNumber: '',
    creditAccountName: '',
    remark: '',
    otp: '',
    selfie: null
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = Account, 2 = OTP, 3 = Selfie, 4 = Confirm
  const navigate = useNavigate()

  // Auto-fill branch info from QR/link (as per FSD)
  const branchInfo = {
    name: 'Main Branch',
    id: 'BR1001',
    date: new Date().toLocaleDateString()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateDebitAccount = () => {
    // TODO: Implement CBS validation as per FSD
    if (formData.debitAccountNumber.length < 5) {
      setErrors({ debitAccountNumber: 'Invalid account number' })
      return false
    }
    // Mock successful validation
    setFormData(prev => ({
      ...prev,
      debitAccountName: 'Sample Customer Name'
    }))
    setErrors({})
    return true
  }

  const validateCreditAccount = () => {
    // TODO: Implement CBS validation as per FSD
    if (formData.creditAccountNumber.length < 5) {
      setErrors({ creditAccountNumber: 'Invalid account number' })
      return false
    }
    // Mock successful validation
    setFormData(prev => ({
      ...prev,
      creditAccountName: 'Beneficiary Customer Name'
    }))
    setErrors({})
    return true
  }

  const sendOTP = () => {
    // TODO: Implement OTP sending logic
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep(2)
    }, 1500)
  }

  const verifyOTP = () => {
    if (formData.otp.length !== 4) {
      setErrors({ otp: 'OTP must be 4 digits' })
      return
    }
    setStep(3)
  }

  const handleSelfieCapture = () => {
    // TODO: Implement camera capture
    setFormData(prev => ({ ...prev, selfie: 'selfie-data-uri' }))
    setStep(4)
  }

  const submitTransfer = () => {
    setIsLoading(true)
    // TODO: Implement form submission
    setTimeout(() => {
      navigate('/fund-transfer-confirmation', {
        state: {
          referenceId: `FT-${Date.now()}`,
          debitAccount: formData.debitAccountNumber,
          creditAccount: formData.creditAccountNumber,
          amount: formData.amount,
          branch: branchInfo.name,
          token: Math.floor(1000 + Math.random() * 9000),
          window: Math.floor(1 + Math.random() * 5)
        }
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Fund Transfer</h1>
          <div className="flex justify-between items-center mt-3 text-purple-100 text-sm">
            <span>Branch: {branchInfo.name}</span>
            <span>{branchInfo.date}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex justify-between relative">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${step >= stepNum ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'} 
                  ${step === stepNum ? 'ring-4 ring-purple-300' : ''}`}>
                  {stepNum}
                </div>
                <div className={`text-xs mt-1 ${step >= stepNum ? 'text-purple-700 font-medium' : 'text-gray-400'}`}>
                  {['Details', 'OTP', 'Selfie', 'Confirm'][stepNum - 1]}
                </div>
              </div>
            ))}
            <div className="absolute h-1 bg-purple-100 top-4 left-8 right-8">
              <div 
                className="h-1 bg-purple-600 transition-all duration-500" 
                style={{ width: `${(step - 1) * 33.33}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Debit Account Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h2 className="text-lg font-semibold text-purple-800 mb-3">From Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Account Number *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="debitAccountNumber"
                      value={formData.debitAccountNumber}
                      onChange={handleChange}
                      className="flex-1 rounded-l-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                      placeholder="Enter account number"
                    />
                    <button
                      type="button"
                      onClick={validateDebitAccount}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg transition flex items-center"
                    >
                      {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  {errors.debitAccountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.debitAccountNumber}</p>
                  )}
                </div>

                {formData.debitAccountName && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="debitAccountName"
                      value={formData.debitAccountName}
                      readOnly
                      className="w-full rounded-lg border border-purple-300 bg-purple-50 p-2"
                    />
                  </div>
                )}
              </div>

              {/* Credit Account Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h2 className="text-lg font-semibold text-purple-800 mb-3">To Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Beneficiary Account Number *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="creditAccountNumber"
                      value={formData.creditAccountNumber}
                      onChange={handleChange}
                      className="flex-1 rounded-l-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                      placeholder="Enter account number"
                    />
                    <button
                      type="button"
                      onClick={validateCreditAccount}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg transition flex items-center"
                    >
                      {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  {errors.creditAccountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.creditAccountNumber}</p>
                  )}
                </div>

                {formData.creditAccountName && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      Beneficiary Name
                    </label>
                    <input
                      type="text"
                      name="creditAccountName"
                      value={formData.creditAccountName}
                      readOnly
                      className="w-full rounded-lg border border-purple-300 bg-purple-50 p-2"
                    />
                  </div>
                )}
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Remark (Optional)
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                    placeholder="Purpose of transfer"
                  />
                </div>
              </div>

              <button
                onClick={sendOTP}
                disabled={!formData.debitAccountName || !formData.creditAccountName || !formData.amount}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : 'Continue to Verification'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600">OTP Sent to your registered phone</p>
                <p className="font-medium">•••••••••••</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Enter 4-digit OTP *
                </label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength={4}
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-3 text-center text-xl tracking-widest"
                  placeholder="----"
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={formData.otp.length !== 4}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600">Identity Verification</p>
                <p className="font-medium">Please take a live selfie for security</p>
              </div>

              <div className="border-2 border-dashed border-purple-300 rounded-xl h-64 bg-purple-50 flex flex-col items-center justify-center">
                {formData.selfie ? (
                  <img src={formData.selfie} alt="Selfie preview" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <CameraIcon className="h-12 w-12 text-purple-400 mb-3" />
                    <p className="text-purple-500 text-sm">Camera will open for live capture</p>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(2)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSelfieCapture}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition"
                >
                  {formData.selfie ? 'Retake Photo' : 'Take Selfie'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600">Review Your Transfer</p>
                <p className="font-medium">Please confirm details before submission</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">From Account:</span>
                  <span className="font-medium">{formData.debitAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-medium">{formData.debitAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Account:</span>
                  <span className="font-medium">{formData.creditAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Beneficiary:</span>
                  <span className="font-medium">{formData.creditAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formData.amount} ETB</span>
                </div>
                {formData.remark && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remark:</span>
                    <span className="font-medium">{formData.remark}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  Note: You will need to present valid ID at the counter to complete this transfer.
                </p>
              </div>

              <button
                onClick={submitTransfer}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Transfer Request'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}