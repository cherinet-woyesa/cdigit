import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  amount?: string;
  TransactionType?: string;
  QueueNotifyModalWindowNumber?: string;
  QueueNotifyModalTellerName?: string;
}

export default function QueueNotifyModal({
  isOpen,
  onClose,
  title,
  message,
  amount,
  TransactionType,
  QueueNotifyModalWindowNumber,
  QueueNotifyModalTellerName,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-700 mb-4">{message}</p>

        {/* Amount */}
        {amount && (
          <p className="text-2xl font-extrabold text-emerald-600 mb-4 tracking-wide">
            {amount}
          </p>
        )}

        {/* Window Number */}
        {QueueNotifyModalWindowNumber && (
          <div className="mb-4 flex items-center justify-center">
            <span className="px-6 py-3 text-xl font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl shadow-lg animate-pulse">
              Window {QueueNotifyModalWindowNumber}
            </span>
          </div>
        )}

        {/* Teller */}
        {QueueNotifyModalTellerName && (
          <p className="text-md font-medium text-gray-700 mb-2">
            You are going to be served by:{" "}
            <span className="font-semibold text-gray-900">
              {QueueNotifyModalTellerName}
            </span>
          </p>
        )}

        {/* Transaction */}
        {TransactionType && (
          <p className="text-md font-medium text-gray-700 mb-4">
            Transaction:{" "}
            <span className="font-semibold text-purple-700">
              {TransactionType}
            </span>
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
