import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../../components/ui/button";

interface TransactionDetailModalProps {
  txn: any;
  onClose: () => void;
  branchId: string;
}

interface Maker {
  id: string;
  firstName: string;
  lastName: string;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  txn,
  onClose,
  branchId,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSpecial, setIsSpecial] = useState<boolean>(txn.isSpecialNeed ?? false);
  const [showSpecialPopup, setShowSpecialPopup] = useState(false);

  const [makers, setMakers] = useState<Maker[]>([]);
  const [selectedMakerId, setSelectedMakerId] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Fetch makers in this branch
  useEffect(() => {
    const fetchMakers = async () => {
      try {
        const res = await axios.get(`/api/users/by-branch/${branchId}`);
        if (res.data.success) setMakers(res.data.data);
        console.log("Makers loaded:", res.data.data);
      } catch (err) {
        console.error("Error loading makers:", err);
      }
    };
    fetchMakers();
  }, [branchId]);

  // Badge color for status
  const statusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-1 rounded bg-red-600 text-white">Canceled</span>;
      case 1:
        return <span className="px-2 py-1 rounded bg-yellow-500 text-white">On Queue</span>;
      case 2:
        return <span className="px-2 py-1 rounded bg-blue-500 text-white">On Progress</span>;
      case 3:
        return <span className="px-2 py-1 rounded bg-green-500 text-white">Completed</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-400 text-white">Unknown</span>;
    }
  };

  const handleConfirmSpecial = async () => {
    if (!selectedMakerId || !reason) {
      setMessage("⚠️ Please select both reason and maker.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await axios.post(
        `/api/QueueManager/markSpecialNeed`,
        {
          branchId,
          makerId: selectedMakerId,
          formReferenceId: txn.formReferenceId,
          reason,
        }
      );

      if (res.data.success) {
        setIsSpecial(true);
        setMessage("✅ Customer marked as Special Need successfully!");
        setShowSpecialPopup(false);
      } else {
        setMessage(`⚠️ ${res.data.message}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg">Transaction Details</h3>
            <button onClick={onClose} className="text-white text-xl font-bold hover:text-gray-200">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold">Queue #:</span>
              <span>#{txn.queueNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Type:</span>
              <span>{txn.transactionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Account Holder:</span>
              <span>{txn.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Amount:</span>
              <span>${txn.amount?.toFixed(2) ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Status:</span>
              {statusBadge(txn.status)}
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Submitted At:</span>
              <span>{new Date(txn.submittedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Form Reference ID:</span>
              <span>{txn.formReferenceId}</span>
            </div>

            {/* Special Need */}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Special Need:</span>
              {isSpecial ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded-lg shadow-sm">
                  ✅ Yes
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg shadow-sm">
                  No
                </span>
              )}
            </div>

            {message && (
              <div className="mt-3 text-sm text-center text-purple-700 font-semibold bg-purple-100 rounded-md p-2">
                {message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {!isSpecial && (
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => setShowSpecialPopup(true)}
              >
                Mark as Special Need
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Popup for selecting reason + maker */}
      {showSpecialPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-purple-700">Mark as Special Need</h2>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-sm text-gray-700">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 mt-1"
                >
                  <option value="">Select reason...</option>
                  <option value="Elder">Elder</option>
                  <option value="Disabled">Disabled</option>
                  <option value="PublicFigure">Public Figure</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-sm text-gray-700">Assign Maker</label>



                <select
                  value={selectedMakerId}
                  onChange={(e) => setSelectedMakerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 mt-1"
                >
                  <option value="">Select maker...</option>
                  {makers.map((m) => (<option key={m.id} value={m.id}
                    className="font-semibold text-sm text-gray-700">
                    {m.firstName + m.lastName}
                  </option>)
                  )}
                </select>


              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setShowSpecialPopup(false)}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={handleConfirmSpecial}
                disabled={loading}
              >
                {loading ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
