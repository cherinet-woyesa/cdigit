import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ArrowLeft } from 'lucide-react';

interface PettyCashRecord {
  formRefId: string;
  date: string;
  branchName: string;
  makerName: string;
  totalPettyCash: number;
  foreignCurrencies: {
    [key: string]: number;
  };
}

const PettyCashConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the record data
  const record = state?.record as PettyCashRecord | undefined;
  
  // Redirect if no record data is found
  useEffect(() => {
    if (!record) {
      navigate('/internal/petty-cash');
    }
  }, [record, navigate]);
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!record) {
    return null;
  }
  
  // Get non-zero foreign currencies
  const nonZeroCurrencies = Object.entries(record.foreignCurrencies || {})
    .filter(([_, amount]) => amount > 0)
    .map(([currency, amount]) => ({ currency, amount }));
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Petty Cash Record Submitted Successfully
          </h1>
          <p className="text-gray-600">
            Your petty cash record has been submitted and logged for daily reconciliation.
          </p>
        </div>
        
        {/* Record Summary */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
            Record Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-medium">{record.formRefId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(record.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch Name</p>
              <p className="font-medium">{record.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maker (CSO Name)</p>
              <p className="font-medium">{record.makerName}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Total Petty Cash</h3>
            <p className="text-2xl font-bold text-blue-600">
              ETB {record.totalPettyCash.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          
          {nonZeroCurrencies.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Foreign Currency Received</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {nonZeroCurrencies.map(({ currency, amount }) => (
                  <div key={currency} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">{currency}</p>
                    <p className="font-medium">
                      {amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 text-sm">
            Your petty cash record has been submitted for reconciliation. 
            The record will be reviewed by the finance team as part of the daily reconciliation process.
            You can view the status of this record in your dashboard.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/internal/dashboard')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </button>
            
            <button
              onClick={() => navigate('/internal/petty-cash')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Another Record
            </button>
          </div>
        </div>
      </div>
      
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-confirmation,
          .print-confirmation * {
            visibility: visible;
          }
          .print-confirmation {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PettyCashConfirmation;
