import React from "react";

interface Props {
  isOpen: boolean;
  windows: WindowDto[];
  message?: ActionMessage | null;
  selectedWindowId: string;
  onSelect: (id: string) => void;
  onAssign: () => void;
  onClose: () => void;
}

type WindowDto = {
  id: string;
  branchId: string;
  windowNumber: number;
  description?: string | null;
};

type ActionMessage = {
    type: 'success' | 'error';
    content: string;
};

const WindowSelectionModal: React.FC<Props> = ({
  isOpen,
  windows,
  message,
  selectedWindowId,
  onSelect,
  onAssign,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Select Your Window</h2>
        <p className="text-gray-500 mb-4">
          Choose an available window to start serving customers.
        </p>

        <select
          className="w-full border rounded-xl p-3 mb-5 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
          value={selectedWindowId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">-- Choose a window --</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>
              {`Window ${w.windowNumber} — ${w.description || "Transaction"}`}
            </option>
          ))}
        </select>

       

        {/* Display message inline after selection */}
                {message && (
                    <p className={`mb-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.content}
                    </p>
                )}



        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedWindowId}
            className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-60 shadow"
          >
            Assign & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowSelectionModal;