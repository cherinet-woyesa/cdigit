import React, { useState } from "react";
import managerService from "@services/managerService";
import toast from "react-hot-toast";
import type { Branch } from "@types";



interface Props {
  branch: Branch;
  open: boolean;
  onClose: () => void;
  setBranch: (branch: Branch) => void;
}

const MyBranchModal: React.FC<Props> = ({ branch, open, onClose, setBranch }) => {

  console.log("Branch Data:", branch);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: branch.name,
    code: branch.code,
    location: branch.location || "",
    latitude: branch.latitude?.toString() ?? "",
    longitude: branch.longitude?.toString() ?? "",
    status: branch.status,
  });

  console.log("Branch Data:", branch);
  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        code: form.code,
        location: form.location || undefined,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        status: form.status,
        isApproved: branch.isApproved,
        managerId: branch.managerId,
      };

      const res = await managerService.updateBranch(branch.id, payload);
      if (res.success) {
        toast.success(res.message || "Branch updated successfully!");
        // Refetch updated branch from backend 
        // const branchRes = await managerService.getBranchByManagerId(branch.managerId);
        const branchRes = await managerService.getBranchById(branch.managerId);

        if (branchRes.success && branchRes.data) setBranch(branchRes.data);
        setIsEditing(false);
      } else {
        toast.error(res.message || "Failed to update branch");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating branch");
    }
  };

  const renderField = (label: string, value: string | number | undefined, name?: string, type: string = "text") => {
    return (
      <div className="p-3 bg-purple-50 rounded-lg shadow-sm">
        <p className="font-semibold text-purple-700">{label}</p>
        {isEditing && name ? (
          <input
            type={type}
            name={name}
            value={form[name as keyof typeof form]}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-1"
          />
        ) : (
          <p className="text-gray-900 mt-1">{value ?? "—"}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
            🏦 {isEditing ? "Edit Branch" : branch.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-lg">✖</button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          {renderField("Branch Code", branch.code, "code")}
          {renderField("Location", branch.location, "location")}
          {renderField("Latitude", branch.latitude, "latitude", "number")}
          {renderField("Longitude", branch.longitude, "longitude", "number")}
        </div>

        {/* Status & Edit */}
        <div className="mt-6 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${branch.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
            {branch.isApproved ? "✅ Approved" : "⏳ Pending Approval"}
          </span>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-500 transition-all"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="mt-6 flex justify-end space-x-2">
            <button onClick={() => setIsEditing(false)} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} className="bg-gradient-to-r from-green-600 to-green-400 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-500">💾 Save</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBranchModal;