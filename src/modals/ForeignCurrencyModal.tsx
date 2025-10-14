
// src/components/modals/DenominationModal.tsx
import React, { useState, useEffect } from 'react';
import makerService from '../services/makerService';
import pettyCashMakerService from '../services/pettyCashMakerService';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface DenominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  form: { makerId: string; formId: string; } | null;
}

const foreignCurrencies = [
  { key: "USD", label: "US Dollar (USD)" },
  { key: "GBP", label: "Pound Sterling (GBP)" },
  { key: "EUR", label: "Euro (EUR)" },
  { key: "CHF", label: "Swiss Franc (CHF)" },
  { key: "KWD", label: "Kuwaiti Dinar (KWD)" },
  { key: "SAR", label: "Saudi Riyal (SAR)" },
];


const denominationsList = ["USD", "EUR", "GBP", "CHF", "KWD", "SAR"];

const ForeignCurrencyModal: React.FC<DenominationModalProps> = ({ isOpen, onClose, onSave, form }) => {
  const [denominations, setDenominations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  // Reset denominations state when modal opens for a new form
  useEffect(() => {
    if (isOpen) {
      setDenominations({});
      setError('');
    }
  }, [isOpen]);



  const handleDenominationChange = (denomination: string, value: string) => {
    const count = parseInt(value, 10) || 0;
    setDenominations(prev => ({
      ...prev,
      [denomination]: count
    }));
  };

  // Inside DenominationModal.tsx, in the handleSave function
  const handleSave = async () => {
  if (!form || !user || !token) {
    setError('User or form data is missing.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const filtered = Object.fromEntries(
      Object.entries(denominations).filter(([_, value]) => value > 0)
    );

    const res = await pettyCashMakerService.submitForeignCurrency(
      form.formId,
      user.id,
      filtered,
      token
    );

    if (!res.success) throw new Error(res.message || "Submission failed");
    onSave();
    onClose();
  } catch (err: any) {
    setError(err.response?.data?.message || err.message);
    console.error('Foreign currency submission error:', err);
  } finally {
    setLoading(false);
  }
};




  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter Denominations for Foreign Currency</h2>
        {/* {form && <p className="mb-4 text-lg">Amount: <span className="font-bold text-green-700">ETB {form.amount.toFixed(2)}</span></p>} */}

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

        <div className="grid grid-cols-1 gap-2 mb-6"> {/* Reduced gap */}
          {denominationsList.map((denom) => (
            <div key={denom}>
              <div key={denom} className="flex items-center space-x-10"> {/* Changed items-left to items-center */}
                <label htmlFor={`denom-${denom}`} className="text-gray-700 flex-1">
                  {denom}
                </label>
                <input
                  id={`denom-${denom}`}
                  type="number"
                  min="0"
                  value={denominations[denom.toString()] || ''}
                  onChange={(e) => handleDenominationChange(denom.toString(), e.target.value)}
                  className="w-24 p-2 border border-purple-500 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-purple-300" // Added purple border and focus styles
                  disabled={loading}
                />

              </div>
              <hr />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          {/* <span className={`text-xl font-bold ${Math.abs(totalAmount - (form?.amount || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        Total: ETB {totalAmount.toFixed(2)}
                    </span> */}
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : 'Save Denominations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForeignCurrencyModal;