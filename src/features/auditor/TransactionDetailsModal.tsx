import { Button } from "@components/ui/button";
import { type AuditableItem } from "@services/auditor/auditorService";

interface TransactionDetailsModalProps {
  deposit: AuditableItem;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  deposit,
  onClose,
}: TransactionDetailsModalProps) {
  if (!deposit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Account Holder:</p>
            <p>{deposit.accountHolderName}</p>
          </div>
          <div>
            <p className="font-semibold">Account Number:</p>
            <p>{deposit.accountNumber}</p>
          </div>
          <div>
            <p className="font-semibold">Amount:</p>
            <p>{deposit.amount.toFixed(2)} ETB</p>
          </div>
          <div>
            <p className="font-semibold">Date:</p>
            <p>{new Date(deposit.submittedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Branch:</p>
            <p>{deposit.branchName}</p>
          </div>
          <div>
            <p className="font-semibold">Maker:</p>
            <p>{deposit.makerName}</p>
          </div>
          <div>
            <p className="font-semibold">Signature/Photo:</p>
            {/* Placeholder for signature/photo */}
            <div className="w-full h-32 bg-gray-200 rounded-lg mt-2">
              <img
                src={deposit.signatureUrl}
                alt="Signature"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-gray-500 text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
