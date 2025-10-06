import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import managerService from "../../services/managerService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  managerId: string;
}

export default function CreateCorporateCustomerModal({ open, onClose, onCreated, managerId }: Props) {
  const [form, setForm] = useState({ accountNumber: "", phoneNumber: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await managerService.createCorporateCustomer({ ...form, creatorUserId: managerId });
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Customer created successfully!" });
        setForm({ accountNumber: "", phoneNumber: "", description: "" });
        onCreated();
        setTimeout(() => onClose(), 1200);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to create customer." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Unexpected error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-800">➕ Create Corporate Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✖</button>
        </div>

        {/* Inline message */}
        {message && (
          <p className={`mb-4 text-sm font-medium ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500">
              {loading ? "Creating..." : "💾 Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}