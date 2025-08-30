import React, { useState, useEffect } from "react";
import adminService from "../../services/adminService";
import toast, { Toaster } from "react-hot-toast";

interface Branch {
  id: string;
  name: string;
}

interface AdUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  branchId?: string;
}

interface AppUser {
  id: string;
  email: string;
}

const CreateUser: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    branchId: "",
    roleName: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [adUsers, setAdUsers] = useState<AdUser[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch branches, AD users, and system users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, adRes, appRes] = await Promise.all([
          adminService.getBranches(),
          adminService.getAdUsers(),
          adminService.getSystemUsers(),
        ]);

        setBranches(branchRes.data || []);
        setAdUsers(adRes.data || []);
        setAppUsers(appRes.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data.");
        toast.error(err.message || "Failed to fetch data.");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.branchId) {
      setError("Please select a branch.");
      toast.error("Please select a branch.");
      return;
    }

    try {
      const res = await adminService.createUser(formData);

      if (res.success) {
        setMessage(res.message || "User created successfully!");
        toast.success(res.message || "User created successfully!");
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          branchId: "",
          roleName: "",
        });
        // Refresh system users list

        try {
          const appRes = await adminService.getSystemUsers();
          setAppUsers(appRes.data || []);
        } catch (err: any) {
          console.error("Failed to refresh system users", err);
        }


      } else {
        setError(res.message || "Failed to create user.");
        toast.error(res.message || "Failed to create user.");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to create user.";
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  // ✅ When admin clicks "Add", pre-fill the form
  const handleAddFromAd = (adUser: AdUser) => {
    setFormData({
      email: adUser.email,
      firstName: adUser.firstName,
      lastName: adUser.lastName,
      phoneNumber: adUser.phoneNumber || "",
      branchId: adUser.branchId || "",
      roleName: "", // let admin choose role manually
    });
    toast.success(`Loaded ${adUser.email} into form`);
  };

  // ✅ Check if AD user exists in our system by email
  const isAlreadyInSystem = (email: string) => {
    return appUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-right" />

      {/* Create Form */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto mb-10">
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-6">Create Manager/Staff</h1>

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="roleName"
              value={formData.roleName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
              <option value="">Select Role</option>
              <option value="Manager">Manager</option>
              <option value="Maker">Staff</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700"
          >
            Create User
          </button>
        </form>
      </div>

      {/* AD Users Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-fuchsia-700">Active Directory Users</h2>
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {adUsers.map((ad) => {
              const exists = isAlreadyInSystem(ad.email);
              return (
                <tr key={ad.id}>
                  <td className="px-4 py-2 border">{ad.email}</td>
                  <td className="px-4 py-2 border">{`${ad.firstName} ${ad.lastName}`}</td>
                  <td className="px-4 py-2 border">
                    {exists ? (
                      <span className="text-green-600">Already Added</span>
                    ) : (
                      <span className="text-red-600">Not Added</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    {!exists && (
                      <button
                        onClick={() => handleAddFromAd(ad)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Add
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreateUser;