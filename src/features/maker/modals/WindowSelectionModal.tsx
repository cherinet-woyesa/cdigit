import React from "react";
import type { WindowDto } from "@services/makerService";
import type { ActionMessage } from "@types";

interface Props {
  isOpen: boolean;
  windows: WindowDto[];
  message?: ActionMessage | null;
  selectedWindowId: string;
  onSelect: (id: string) => void;
  onAssign: () => void;
  onClose: () => void;
  isLoading?: boolean; // Add this line
  title?: string; // Add these if you're using them
  description?: string;
}

const WindowSelectionModal: React.FC<Props> = ({
  isOpen,
  windows,
  message,
  selectedWindowId,
  onSelect,
  onAssign,
  onClose,
  isLoading = false, // Add with default value
  title = "Select Your Window", // Add with default values
  description = "Choose an available window to start serving customers."
}) => {
  if (!isOpen) return null;

  const getMessageColor = (type: ActionMessage['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
        <p className="text-gray-500 mb-4">
          {description}
        </p>

        <select
          className="w-full border rounded-xl p-3 mb-5 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
          value={selectedWindowId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isLoading} // Disable when loading
        >
          <option value="">-- Choose a window --</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>
              {`Window ${w.windowNumber} — ${w.description || "Transaction"}`}
            </option>
          ))}
        </select>

        {message && (
          <p className={`mb-4 ${getMessageColor(message.type)}`}>
            {message.content}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading} // Disable when loading
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedWindowId || isLoading} // Disable when loading or no selection
            className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-60 shadow flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assigning...
              </>
            ) : (
              'Assign & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowSelectionModal;