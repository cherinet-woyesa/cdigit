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
  branchId?: string;
}

export default function CreateCorporateCustomerModal({ open, onClose, onCreated, managerId, branchId }: Props) {
  const [form, setForm] = useState({
    accountNumber: "",
    phoneNumber: "",
    vipType: "",
    description: "",
    companyName: "", // ✅ Add this new field
  });

  const [vipType, setVipType] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await managerService.createVipCustomer({ ...form, creatorUserId: managerId, branchId: branchId ?? "" });
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Customer created successfully!" });
        setForm({ accountNumber: "", phoneNumber: "", vipType: "", description: "", companyName: "" });
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


        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 bg-white rounded-xl shadow-md">
          {/* Account Number */}
          <div>
            <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700">
              Account Number
            </Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border-2 border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-200"
            />
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border-2 border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-200"
            />
          </div>

          {/* VIP Type */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Reason</label>
            <select
              id="vipType"
              value={form.vipType}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, vipType: value, companyName: value === "Corporate" ? form.companyName : "" });
              }}
              className="mt-1 w-full rounded-lg border-2 border-purple-400 bg-white text-gray-800 p-2 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-200"
            >
              <option value="">Select VIP Type...</option>
              <option value="Premium">Premium</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>


          {/* Business name */}
          {form.vipType === "Corporate" && (
            <div>
              <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">
                Business / Company Name
              </Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border-2 border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-200"
              />
            </div>
          )}




          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border-2 border-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-4 py-2 font-semibold transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 rounded-lg px-5 py-2 font-semibold shadow-sm transition-all duration-200"
            >
              {loading ? "Creating..." : "💾 Create"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}