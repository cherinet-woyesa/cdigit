import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";

interface Props {
  open: boolean;
  onClose: () => void;
  branch: any; // The branch object to edit
  branches: any[];
  setBranches: React.Dispatch<React.SetStateAction<any[]>>;
}


const EditBranchModal: React.FC<Props> = ({ open, onClose, branch, branches, setBranches }) => {

  console.log("Editing branch:", branch);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [status, setStatus] = useState("active");
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (branch) {
      setName(branch.name || "");
      setCode(branch.code || "");
      setLocation(branch.location || "");
      setLatitude(branch.latitude ?? "");
      setLongitude(branch.longitude ?? "");
      setStatus(branch.status || "active");
      setManagerId(branch.managerId || null);
      setIsApproved(branch.isApproved || false);
    }
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch?.id) return;

    try {
      const res = await adminService.updateBranch(branch.id, {
        name,
        code,
        location,
        latitude: latitude === "" ? undefined : latitude,
        longitude: longitude === "" ? undefined : longitude,
        status,
        managerId,
        isApproved,
      });
      toast.success(res.message || "Branch updated!");

      // Update the branch in the local list
      const updatedBranches = branches.map(b => (b.id === branch.id ? res.data : b));
      setBranches(updatedBranches);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update branch.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 font-bold text-gray-500 hover:text-gray-800">✕</button>
        <h3 className="text-xl font-semibold mb-4 text-fuchsia-700">Edit Branch</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Branch Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm p-2"
          />
          <input
            type="text"
            placeholder="Branch Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm p-2"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm p-2"
          />
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Latitude"
              value={latitude}
              onChange={e => setLatitude(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-1/2 rounded-md border-gray-300 shadow-sm p-2"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={longitude}
              onChange={e => setLongitude(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-1/2 rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
          <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2">
            Update Branch
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditBranchModal;
