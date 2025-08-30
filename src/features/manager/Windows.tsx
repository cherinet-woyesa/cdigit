import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast"; // Importing react-hot-toast directly
import { Label } from "../../components/ui/label";

type WindowsProps = { branchId: string };

export default function Windows({ branchId }: WindowsProps) {

  const [windows, setWindows] = useState<any[]>([]);
  const [form, setForm] = useState({
    description: "",
    windowType: "Transaction",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    if (!branchId) return;
    const data = await managerService.getWindowsByBranch(branchId);
    setWindows(data);
  };

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!branchId) return;

    try {
      const res = await managerService.createWindow({ ...form, branchId });
      if (res?.success) {
        setMessage({ type: "success", text: res.message || "Window created successfully." });
        toast.success(res.message || "Window added.");
        setForm({ description: "", windowType: "Transaction" });
        load();
      } else {
        setMessage({ type: "error", text: res?.message || "Failed to create window." });
        toast.error(res?.message || "Something went wrong.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Unexpected error." });
      toast.error(err.message || "Unexpected error.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-bank">🪟 Windows</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <div className="flex flex-col">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="windowType">Window Type</Label>
          <select
            id="windowType"
            value={form.windowType}
            onChange={(e) => setForm({ ...form, windowType: e.target.value })}
            className="border rounded px-2 py-2"
          >
            <option>Transaction</option>
            <option>Service</option>
          </select>
        </div>

        <Button type="submit" className="bg-bank text-white hover:bg-bank-dark">
          Add Window
        </Button>
      </form>

      {/* Inline message */}
      {message && (
        <p className={`mb-4 text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-2">
        {windows.map((w) => (
          <Card key={w.windowId} className="bg-blackbase text-gold">
            <CardContent className="p-2 flex justify-between">
              <span>
                {w.description} ({w.windowType})
              </span>
              <span className="text-sm text-gray-300">
                #{w.windowNumber} -- {w.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}