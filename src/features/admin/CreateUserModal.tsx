import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";

interface Branch { id: string; name: string; }
interface AppUser { id: string; email: string; }
interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  appUsers: AppUser[];
  setAppUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const CreateUserModal: React.FC<Props> = ({ open, onClose, branches, appUsers, setAppUsers }) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    branchId: "",
    roleName: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.createUser(formData);
      toast.success(res.message || "User created!");
      setFormData({ email: "", firstName: "", lastName: "", phoneNumber: "", branchId: "", roleName: "" });
      const updatedUsers = await adminService.getSystemUsers();
      setAppUsers(updatedUsers.data || []);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 font-bold text-gray-500 hover:text-gray-800">✕</button>
        <h3 className="text-xl font-semibold mb-4 text-fuchsia-700">Add User</h3>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="rounded-md border-gray-300 shadow-sm p-2"/>
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="rounded-md border-gray-300 shadow-sm p-2"/>
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="rounded-md border-gray-300 shadow-sm p-2"/>
          <input type="text" name="phoneNumber" placeholder="Phone" value={formData.phoneNumber} onChange={handleChange} className="rounded-md border-gray-300 shadow-sm p-2"/>
          <select name="branchId" value={formData.branchId} onChange={handleChange} required className="rounded-md border-gray-300 shadow-sm p-2">
            <option value="">Select Branch</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select name="roleName" value={formData.roleName} onChange={handleChange} required className="rounded-md border-gray-300 shadow-sm p-2">
            <option value="">Select Role</option>
            <option value="Manager">Manager</option>
            <option value="Maker">Staff</option>
          </select>
          <div className="col-span-2 flex justify-end">
            <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2 px-4">Add User</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
