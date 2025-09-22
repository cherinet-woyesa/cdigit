import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pettyCashService } from '../../../../services/pettyCashService';
import Field from '../../../../components/Field';

// Foreign currency options
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'DJF', name: 'Djiboutian Franc' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'XAF', name: 'CFA Franc' },
];

const PettyCashForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Denomination quantities
    etb200Qty: 0,
    etb100Qty: 0,
    etb50Qty: 0,
    etb10Qty: 0,
    etb5Qty: 0,
    totalCoins: 0,
    
    // Cash movements
    previousDayBalance: 0,
    cashFromVault: 0,
    cashToVault: 0,
    cashFromCustomers: 0,
    cashToCustomers: 0,
    
    // Foreign currencies
    foreignCurrencies: {} as Record<string, number>,
    
    // Auto-filled fields (readonly)
    branchName: user?.branchName || 'Head Office',
    makerName: user?.name || 'System User',
  });  
  
  // Calculate derived values
  const subtotal = (formData.etb200Qty * 200) + 
                  (formData.etb100Qty * 100) + 
                  (formData.etb50Qty * 50) + 
                  (formData.etb10Qty * 10) + 
                  (formData.etb5Qty * 5);
  
  const totalPettyCash = subtotal + (formData.totalCoins || 0);
  
  const todaysBalance = 
    (formData.previousDayBalance || 0) + 
    (formData.cashFromVault || 0) + 
    (formData.cashFromCustomers || 0) - 
    (formData.cashToCustomers || 0) - 
    (formData.cashToVault || 0);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // Handle foreign currency changes
  const handleCurrencyChange = (currency: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      foreignCurrencies: {
        ...prev.foreignCurrencies,
        [currency]: parseFloat(value) || 0
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await pettyCashService.submitPettyCashRecord({
        ...formData,
        branchName: formData.branchName,
        makerName: formData.makerName,
      });
      
      if (result.success) {
        toast.success('Petty cash record submitted successfully');
        navigate('/internal/petty-cash/confirmation', { 
          state: { record: result.data } 
        });
      }
    } catch (error) {
      console.error('Error submitting petty cash record:', error);
      toast.error('Failed to submit petty cash record');
    } finally {
      setLoading(false);
    }
  };
  
  // Render denomination input row
  const renderDenominationRow = (denomination: number, qtyName: string) => (
    <div key={denomination} className="grid grid-cols-3 gap-4 mb-2">
      <div className="col-span-1 font-medium">ETB {denomination} × Qty</div>
      <div className="col-span-1">
        <input
          type="number"
          min="0"
          name={qtyName}
          value={formData[qtyName as keyof typeof formData]}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="col-span-1">
        <input
          type="text"
          readOnly
          value={denomination * (formData[qtyName as keyof typeof formData] as number)}
          className="w-full p-2 border rounded bg-gray-50"
        />
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Petty Cash Record</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-filled information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Record Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Branch Name"
              value={formData.branchName}
              readOnly
            />
            <Field
              label="Maker (CSO Name)"
              value={formData.makerName}
              readOnly
            />
            <Field
              label="Date"
              value={new Date().toLocaleDateString()}
              readOnly
            />
          </div>
        </div>
        
        {/* Denomination Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Petty Cash by Denomination</h2>
          
          {renderDenominationRow(200, 'etb200Qty')}
          {renderDenominationRow(100, 'etb100Qty')}
          {renderDenominationRow(50, 'etb50Qty')}
          {renderDenominationRow(10, 'etb10Qty')}
          {renderDenominationRow(5, 'etb5Qty')}
          
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="col-span-1 font-bold">Subtotal (ETB)</div>
            <div className="col-span-2">
              <input
                type="text"
                readOnly
                value={subtotal.toFixed(2)}
                className="w-full p-2 border rounded bg-gray-50 font-semibold"
              />
            </div>
            
            <div className="col-span-1 font-medium">Total Coins (ETB)</div>
            <div className="col-span-2">
              <input
                type="number"
                min="0"
                step="0.01"
                name="totalCoins"
                value={formData.totalCoins}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="col-span-1 font-bold">Total Petty Cash (ETB)</div>
            <div className="col-span-2">
              <input
                type="text"
                readOnly
                value={totalPettyCash.toFixed(2)}
                className="w-full p-2 border rounded bg-gray-50 font-semibold"
              />
            </div>
          </div>
        </div>
        
        {/* Cash Movements */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Cash Movements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              type="number"
              label="Previous Day Petty Cash Balance (ETB)"
              name="previousDayBalance"
              value={formData.previousDayBalance}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            
            <Field
              type="number"
              label="Today's Petty Cash Balance (ETB)"
              value={todaysBalance.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
            
            <Field
              type="number"
              label="Today Cash Received from Vault (ETB)"
              name="cashFromVault"
              value={formData.cashFromVault}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            
            <Field
              type="number"
              label="Today Cash Surrendered to Vault (ETB)"
              name="cashToVault"
              value={formData.cashToVault}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            
            <Field
              type="number"
              label="Cash Received from Customers (ETB)"
              name="cashFromCustomers"
              value={formData.cashFromCustomers}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            
            <Field
              type="number"
              label="Cash Paid to Customers (ETB)"
              name="cashToCustomers"
              value={formData.cashToCustomers}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
        
        {/* Foreign Currency Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Foreign Currency Received/Surrendered (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRENCIES.map(currency => (
              <div key={currency.code} className="flex items-center">
                <label className="w-20 mr-2">{currency.code}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.foreignCurrencies[currency.code] || ''}
                  onChange={(e) => handleCurrencyChange(currency.code, e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              'Submit Record'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PettyCashForm;
