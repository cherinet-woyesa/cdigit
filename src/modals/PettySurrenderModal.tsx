import React, { useState } from "react";

interface PettySurrenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  title: string;
}

const PettySurrenderModal: React.FC<PettySurrenderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [amount, setAmount] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (amount <= 0) return alert("Enter a valid amount");
    onSubmit(amount);
    setAmount(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          placeholder="Enter amount"
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PettySurrenderModal;
