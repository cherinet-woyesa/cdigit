import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CashDepositForm() {
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountHolderName: '',
    accountType: 'Savings',
    amount: '',
    amountInWords: '',
    sourceOfProceeds: '',
    denominations: '',
    depositedBy: '',
    telephoneNumber: ''
  })
  
  type Errors = {
    accountNumber?: string
    // add other fields as needed
  }
  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // Auto-fill branch info from QR/link (as per FSD)
  const branchInfo = {
    name: 'Main Branch',
    id: 'BR1001',
    date: new Date().toLocaleDateString()
  }

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateAccount = () => {
    // TODO: Implement CBS validation as per FSD
    // Mock validation for demo
    if (formData.accountNumber.length < 5) {
      setErrors(prev => ({ ...prev, accountNumber: 'Invalid account number' }))
      return false
    }
    // Auto-fill account holder name if valid (as per FSD)
    setFormData(prev => ({
      ...prev,
      accountHolderName: 'Sample Customer Name'
    }))
    setErrors(prev => ({ ...prev, accountNumber: '' }))
    return true
  }

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // TODO: Implement form submission logic as per FSD
    setTimeout(() => {
      setIsSubmitting(false)
      // Generate token and show confirmation (as per FSD)
      navigate('/cashdepositconfirmation', {
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
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#f5f0ff] p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-purple-200">
        {/* Form Header */}
        <div className="bg-purple-700 p-6 text-white">
          <h1 className="text-2xl font-bold">Cash Deposit Form</h1>
          <div className="flex justify-between items-center mt-2">
            <p className="text-purple-100">Branch: {branchInfo.name} ({branchInfo.id})</p>
            <p className="text-purple-100">{branchInfo.date}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Information Section */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Account Number *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="flex-1 rounded-l-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                    placeholder="Enter account number"
                  />
                  <button
                    type="button"
                    onClick={validateAccount}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-r-lg transition"
                  >
                    Search
                  </button>
                </div>
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  readOnly
                  className="w-full rounded-lg border border-purple-300 bg-purple-50 p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Type of Account *
              </label>
              <div className="flex space-x-4">
                {['Savings', 'Current', 'Special Demand'].map((type) => (
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

          {/* Amount Information Section */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Amount Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Amount in Figure *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                  placeholder="Enter amount"
                />
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
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                  placeholder="Amount in words"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Source of Proceeds *
              </label>
              <input
                type="text"
                name="sourceOfProceeds"
                value={formData.sourceOfProceeds}
                onChange={handleChange}
                className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                placeholder="Source of funds"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Denominations
              </label>
              <textarea
                name="denominations"
                value={formData.denominations}
                onChange={handleChange}
                className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                placeholder="Enter denominations"
                rows={3}
              />
            </div>
          </div>

          {/* Depositor Information Section */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800">Depositor Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Deposited By *
                </label>
                <input
                  type="text"
                  name="depositedBy"
                  value={formData.depositedBy}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                  placeholder="Name of depositor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">
                  Telephone Number *
                </label>
                <input
                  type="tel"
                  name="telephoneNumber"
                  value={formData.telephoneNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Form Footer */}
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