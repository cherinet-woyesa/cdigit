import React, { useEffect, useState } from "react";
import managerService from "@services/managerService";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";

interface StaffForm {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  branchId: string;
  roleName: string;
}

interface AdUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export default function CreateStaff({
  branchId,
  reload,
  selectedUser,
}: {
  branchId: string;
  reload: () => void;
  selectedUser?: AdUser | null;
}) {
  const [form, setForm] = useState<StaffForm>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    branchId,
    roleName: "Maker",
  });

  const [successMessage, setSuccessMessage] = useState<string>(""); // ✅ inline success message
  const [errorMessage, setErrorMessage] = useState<string>("");     // ✅ inline error message

  // populate form when table row is clicked
  useEffect(() => {
    if (selectedUser) {
      setForm({
        email: selectedUser.email,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        phoneNumber: selectedUser.phoneNumber || "",
        branchId,
        roleName: "Maker",
      });
      setSuccessMessage(""); // clear any previous message
      setErrorMessage("");
    }
  }, [selectedUser, branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await managerService.createStaff(form);
      setSuccessMessage("✅ Staff created successfully!");

      setForm({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        branchId,
        roleName: "Maker",
      });

      reload();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to create staff");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md">
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
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}