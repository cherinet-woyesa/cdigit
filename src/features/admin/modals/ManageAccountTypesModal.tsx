import React, { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import adminService from "@services/adminService";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  setAccountTypes: React.Dispatch<React.SetStateAction<any[]>>;
  editItem?: { id: number; name: string; description?: string } | null;
}

const ManageAccountTypesModal: React.FC<Props> = ({
  open,
  onClose,
  setAccountTypes,
  editItem,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [editItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      let res: { message?: string; data: any };
      if (editItem) {
        res = await adminService.updateAccountType(editItem.id, name, description);
        toast.success(res.message || "Updated successfully");
        setAccountTypes((prev) =>
          prev.map((t) => (t.id === editItem.id ? res.data : t))
        );
      } else {
        res = await adminService.addAccountType(name, description);
        toast.success(res.message || "Added successfully");
        setAccountTypes((prev) => [...prev, res.data]);
      }
      setMessage({ type: "success", text: res.message || "Success" });
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save";
      setMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 font-bold text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold mb-4 text-fuchsia-700">
          {editItem ? "Edit Account Type" : "Add Account Type"}
        </h3>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-fuchsia-500 resize-none"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2 rounded-md"
            >
              {loading ? "Saving..." : editItem ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageAccountTypesModal;