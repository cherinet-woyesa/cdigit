import React, { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import toast from "react-hot-toast";
import managerService from "@services/managerService";

interface Props {
  open: boolean;
  onClose: () => void;
  setBranch: React.Dispatch<React.SetStateAction<any>>;
}

const CreateManagerBranchModal: React.FC<Props> = ({ open, onClose, setBranch }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Get current position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => toast.error("Failed to get location: " + err.message)
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (latitude === null || longitude === null) return toast.error("Location not available");

  try {
    const res = await managerService.createBranch({
      name,
      code,
      location,
      latitude,
      longitude,
    });

    if (res.success) {
      toast.success(res.message || "Branch created! Pending approval.");
      setBranch(res.data);
      onClose();
    } else {
      toast.error(res.message || "Failed to create branch");
    }
  } catch (err: any) {
    toast.error(err.message || "Error creating branch");
  }
};


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 font-bold text-gray-500 hover:text-gray-800">✕</button>
        <h3 className="text-xl font-semibold mb-4 text-purple-700">Create Your Branch</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Branch Name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border-gray-300 shadow-sm p-2"/>
          <input type="text" placeholder="Branch Code" value={code} onChange={e => setCode(e.target.value)} required className="w-full rounded-md border-gray-300 shadow-sm p-2"/>
          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2"/>
          <p>Latitude: {latitude ?? "Loading..."}, Longitude: {longitude ?? "Loading..."}</p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2">Create Branch</Button>
        </form>
      </div>
    </div>
  );
};

export default CreateManagerBranchModal;