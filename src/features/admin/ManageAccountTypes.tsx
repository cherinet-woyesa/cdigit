import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";

const ManageAccountTypes: React.FC = () => {
  const [accountTypeName, setAccountTypeName] = useState("");
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const response = await adminService.getAccountTypes();
        setAccountTypes(response.data || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to fetch account types.");
      }
    };
    fetchAccountTypes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminService.addAccountType(accountTypeName);
      toast.success(response.message || "Account type added successfully!");
      setAccountTypes([...accountTypes, response.data]);
      setAccountTypeName("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add account type.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminService.deleteAccountType(id);
      toast.success(res.message || "Account type deleted successfully!");
      setAccountTypes(accountTypes.filter((type) => type.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account type.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-6">
          Manage Account Types
        </h1>

        <form onSubmit={handleAdd} className="space-y-6">
          <input
            type="text"
            value={accountTypeName}
            onChange={(e) => setAccountTypeName(e.target.value)}
            placeholder="Account Type Name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
          />
          <button
            type="submit"
            className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700"
          >
            Add Account Type
          </button>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Existing Account Types
          </h2>
          <ul className="space-y-4">
            {accountTypes.map((type) => (
              <li
                key={type.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <span>{type.name}</span>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManageAccountTypes;