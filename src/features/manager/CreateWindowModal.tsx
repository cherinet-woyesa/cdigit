import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import managerService from "../../services/managerService";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  onCreated: () => void;
}

export default function CreateWindowModal({ open, onClose, branchId, onCreated }: Props) {
  const [form, setForm] = useState({ description: "", windowType: "Transaction" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await managerService.createWindow({ ...form, branchId });
      if (res?.success) {
        setMessage({ type: "success", text: res.message || "Window created successfully!" });
        setForm({ description: "", windowType: "Transaction" });
        onCreated();
        // Optionally keep modal open to show message for a moment
        // setTimeout(() => onClose(), 1500); 
      } else {
        setMessage({ type: "error", text: res?.message || "Failed to create window." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Unexpected error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn scale-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
            ➕ Create Window
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-lg transition-colors">✖</button>
        </div>

        {/* Inline message */}
        {message && (
          <p className={`mb-4 text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col">
            <Label htmlFor="windowType">Window Type</Label>
            <select
              id="windowType"
              value={form.windowType}
              onChange={(e) => setForm({ ...form, windowType: e.target.value })}
              className="border rounded px-2 py-2"
            >
              <option>Transaction</option>
              <option>IFB</option>
              <option>Corporate</option>
              <option>E-Banking</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500 transition-all"
              disabled={loading}
            >
              {loading ? "Creating..." : "💾 Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}