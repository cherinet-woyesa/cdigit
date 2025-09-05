import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  setAccountTypes: React.Dispatch<React.SetStateAction<any[]>>;
}

const ManageAccountTypesModal: React.FC<Props> = ({ open, onClose, setAccountTypes }) => {
  const [newType, setNewType] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.addAccountType(newType);
      toast.success(res.message || "Added!");
      setAccountTypes(prev => [...prev, res.data]);
      setNewType("");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 font-bold text-gray-500 hover:text-gray-800">✕</button>
        <h3 className="text-xl font-semibold mb-4 text-fuchsia-700">Add Account Type</h3>

        <form className="flex gap-2" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Type name"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm p-2"
            required
          />
          <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2 px-4">Add</Button>
        </form>
      </div>
    </div>
  );
};

export default ManageAccountTypesModal;
