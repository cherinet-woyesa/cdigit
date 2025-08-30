import React, { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

interface AdUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  branchId?: string;
}

interface AppUser {
  id: string;
  email: string;
}

export default function CreateStaff({
  branchId,
  reload,
}: {
  branchId: string;
  reload: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    branchId: branchId,
    roleName: "Maker",
  });

  const [adUsers, setAdUsers] = useState<AdUser[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  // ✅ Fetch AD + system users
  const fetchData = async () => {
    try {
      const adRes = await managerService.getAdUsersByBranch(branchId);
      const sysUsers = await managerService.getUsersByBranch(branchId);
      setAdUsers(adRes || []);
      setAppUsers(sysUsers || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch staff data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // ✅ Check if AD user is already in system
  const isAlreadyInSystem = (email: string) =>
    appUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());

  // ✅ Add AD user into form
  const handleAddFromAd = (adUser: AdUser) => {
    setForm({
      email: adUser.email,
      firstName: adUser.firstName,
      lastName: adUser.lastName,
      phoneNumber: adUser.phoneNumber || "",
      branchId: branchId,
      roleName: "Maker",
    });
    toast.success(`Loaded ${adUser.email} into form`);
  };

  // ✅ Submit staff creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.createStaff(form);
      toast.success("Staff created successfully!");

      // Reset form
      setForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        branchId: branchId,
        roleName: "Maker",
      });

      // Refresh AD + system users to update status immediately
      await fetchData();

      // Also trigger parent reload (if dashboard needs refresh)
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to create staff");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <Toaster position="top-right" />

      {/* Staff Creation Form */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-800">Create Staff</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />

          <Button
            type="submit"
            className="w-full bg-purple-900 text-white hover:bg-purple-800"
          >
            Add Staff
          </Button>
        </form>
      </div>

      {/* AD Users Table */}
      <h3 className="text-lg font-bold mb-2 text-purple-700">Available AD Users</h3>
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
                <td className="px-4 py-2 border">
                  {ad.firstName} {ad.lastName}
                </td>
                <td className="px-4 py-2 border">
                  {exists ? (
                    <span className="text-green-600 font-semibold">Added to System</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Not Added</span>
                  )}
                </td>
                <td className="px-4 py-2 border">
                  {!exists && (
                    <Button
                      onClick={() => handleAddFromAd(ad)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Add
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}