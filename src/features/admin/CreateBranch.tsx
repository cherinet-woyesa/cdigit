import React, { useState } from "react";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";

const CreateBranch: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminService.createBranch(formData);
      toast.success(response.message || "Branch created successfully!");
      setFormData({ name: "", code: "", location: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create branch.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-6">
          Create Branch
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Name */}
          <div>
            <label className="block text-gray-700 font-medium">Branch Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Enter branch name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Branch Code */}
          <div>
            <label className="block text-gray-700 font-medium">Branch Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              maxLength={20}
              required
              placeholder="Enter branch code"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 font-medium">Location (Optional)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              maxLength={255}
              placeholder="Enter location"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700"
          >
            Create Branch
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBranch;