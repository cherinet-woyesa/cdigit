import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { cancelEBankingApplicationByCustomer } from '../../../../services/eBankingApplicationService';

type FormData = {
  formReferenceId: string;
  branchName: string;
  accountNumber: string;
  customerName: string;
  mobileNumber: string;
  ebankingChannels: string[];
  submittedAt: string;
};

const E_BANKING_OPTIONS = [
  { id: 'mobile_banking', label: 'Mobile Banking' },
  { id: 'internet_banking', label: 'Internet Banking' },
  { id: 'ussd', label: 'USSD Banking' },
  { id: 'card_banking', label: 'Card Banking' },
];

export default function EBankingConfirmation() {
  const location = useLocation() as { state?: any };
  const navigate = useNavigate();
  const [data, setData] = useState<FormData | null>(null);
  const [windowNumber, setWindowNumber] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefer inner data payload if API response wrapped: { success, message, data }
  const apiData = useMemo(() => {
    const api = location.state?.api;
    if (!api) return undefined;
    return api?.data ?? api;
  }, [location.state]);

  useEffect(() => {
    const state = location.state;
    if (!state) {
      setData(null);
      return;
    }
    // Prefer backend API response if present
    if (state.api) {
      const api = (state.api?.data ?? state.api) as any;
      const servicesRaw = api?.ServicesRequested ?? api?.servicesRequested;
      let services: string[] = [];
      if (typeof servicesRaw === 'string') {
        const parsed = String(servicesRaw).split(',').map((s: string) => s.trim()).filter(Boolean);
        // If backend says 'None' or empty, fallback to UI-selected channels
        if (parsed.length === 1 && parsed[0].toLowerCase() === 'none') {
          services = Array.isArray(state.ui?.ebankingChannels) ? state.ui.ebankingChannels : [];
        } else {
          services = parsed;
        }
      } else if (Array.isArray(api?.ServicesSelected)) {
        services = api.ServicesSelected as string[];
      } else if (Array.isArray(state.ui?.ebankingChannels)) {
        services = state.ui.ebankingChannels as string[];
      }
      setData({
        formReferenceId: api?.FormReferenceId || api?.formReferenceId || 'N/A',
        branchName: state.branchName || api?.BranchName || api?.branchName || 'Ayer Tena Branch',
        accountNumber: api?.AccountNumber || api?.accountNumber || '',
        customerName: api?.AccountHolderName || api?.accountHolderName || '',
        mobileNumber: state.ui?.telephoneNumber || state.ui?.mobileNumber || '',
        ebankingChannels: services,
        submittedAt: new Date().toISOString(),
      });
      setWindowNumber(state.windowNumber);
      return;
    }
    // Fallback to previously used formData flow
    if (state.formData) {
      setData(state.formData as FormData);
      setWindowNumber(state.windowNumber);
      return;
    }
    setData(null);
  }, [location.state]);

  const handlePrint = () => window.print();

  // Actions
  const entityId = useMemo(() => {
    const id = apiData?.Id || apiData?.id || null;
    return id as string | null;
  }, [apiData]);

  const status = (apiData?.Status || apiData?.status) as string | undefined;
  const canUpdateCancel = !!entityId && (!status || status === 'OnQueue');

  const handleUpdate = () => {
    if (!entityId) return;
    navigate('/form/ebanking', { state: { updateId: entityId } });
  };

  const handleCancel = async () => {
    if (!entityId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await cancelEBankingApplicationByCustomer(entityId);
      if (!res?.success) throw new Error(res?.message || 'Failed to cancel');
      navigate('/form/ebanking', { state: { cancelled: true } });
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">No confirmation data</h3>
          <p className="mt-2 text-sm text-gray-500">Please submit the E-Banking application first.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/form/ebanking')}
              className="px-4 py-2 bg-fuchsia-700 text-white rounded-md hover:bg-fuchsia-800"
            >
              Go to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white p-3 sm:p-5 rounded-lg shadow-lg">
        <div className="mb-4 bg-fuchsia-700 text-white p-3 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">E-Banking Application</h1>
        </div>

        <div className="text-center mb-4">
          <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
          <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">Success!</h1>
          <p className="text-gray-600 text-sm">Your E-Banking application has been submitted.</p>
        </div>

        <div className="my-2 grid grid-cols-2 gap-3">
          <div className="bg-fuchsia-700 p-3 rounded-lg shadow text-center">
            <p className="text-xs font-medium text-fuchsia-100">Queue #</p>
            <p className="text-3xl font-bold">{(apiData?.QueueNumber ?? apiData?.queueNumber ?? 'N/A').toString()}</p>
          </div>
          <div className="bg-fuchsia-600 p-3 rounded-lg shadow text-center">
            <p className="text-xs font-medium text-fuchsia-100">Token</p>
            <p className="text-3xl font-bold">{apiData?.TokenNumber || apiData?.tokenNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-3">
          <h3 className="text-base font-bold text-fuchsia-700 mb-2">Details</h3>
          <div className="space-y-2 text-sm sm:text-base text-gray-700">
            <div className="flex justify-between"><strong>Date:</strong> <span>{data.submittedAt ? new Date(data.submittedAt).toLocaleString() : 'N/A'}</span></div>
            <div className="flex justify-between"><strong>Account:</strong> <span>{data.accountNumber || 'N/A'}</span></div>
            <div className="flex justify-between"><strong>Name:</strong> <span>{data.customerName || 'N/A'}</span></div>
            <div className="flex justify-between"><strong>Status:</strong> <span className="font-semibold text-fuchsia-800">{(apiData?.Status || apiData?.status) ?? 'OnQueue'}</span></div>
            <div className="flex justify-between"><strong>Branch:</strong> <span>{data.branchName || apiData?.BranchName || apiData?.branchName || apiData?.BranchId || apiData?.branchId || 'N/A'}</span></div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
          <p className="text-xs sm:text-sm text-blue-700">
            {(apiData?.Message || apiData?.message) ?? 'Please visit your selected or nearest branch if additional verification is required.'}
          </p>
          {windowNumber && (
            <p className="mt-1 text-xs sm:text-sm text-blue-700">Please proceed to window <span className="font-bold">{windowNumber}</span>.</p>
          )}
        </div>

        {data.ebankingChannels.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-3 mb-3">
            <h4 className="text-sm font-semibold text-fuchsia-700 mb-2">Requested Services</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {data.ebankingChannels.map((c) => (
                <li key={c}>{E_BANKING_OPTIONS.find(opt => opt.id === c)?.label || c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => navigate('/form/ebanking')}
            className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition"
          >
            New
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Print
          </button>
          {canUpdateCancel && (
            <button
              onClick={handleUpdate}
              className="flex items-center justify-center gap-1 w-full bg-yellow-500 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-yellow-600 transition"
            >
              Update
            </button>
          )}
          {canUpdateCancel && (
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="flex items-center justify-center gap-1 w-full bg-red-600 disabled:opacity-50 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-red-700 transition"
            >
              Cancel
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
        <p className="text-sm text-gray-500 mt-3 text-center">Thank you for banking with us!</p>
      </div>
    </div>
  );
}
