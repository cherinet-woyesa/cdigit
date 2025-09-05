import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import DataTable from "react-data-table-component";

type WindowsProps = { branchId: string };

interface Window {
  windowId: string;
  description: string;
  windowType: string;
  windowNumber: number;
  status: string;
}

export default function Windows({ branchId }: WindowsProps) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [form, setForm] = useState({
    description: "",
    windowType: "Transaction",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const data = await managerService.getWindowsByBranch(branchId);
      setWindows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        setForm({ description: "", windowType: "Transaction" });
        load();
      } else {
        setMessage({ type: "error", text: res?.message || "Failed to create window." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Unexpected error." });
    }
  };

  const columns = [
    {
      name: "Description",
      selector: (row: Window) => row.description,
      sortable: true,
    },
    {
      name: "Type",
      selector: (row: Window) => row.windowType,
      sortable: true,
    },
    {
      name: "Number",
      selector: (row: Window) => row.windowNumber,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Window) => row.status,
      cell: (row: Window) => {
        const bgColor =
          row.status.toLowerCase() === "active"
            ? "bg-green-500"
            : row.status.toLowerCase() === "inactive"
            ? "bg-red-500"
            : "bg-gray-500";
        return (
          <span className={`px-2 py-1 rounded text-white font-semibold text-sm ${bgColor}`}>
            {row.status}
          </span>
        );
      },
      sortable: true,
    },
  ];

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

      {/* DataTable for windows */}
      <DataTable
        title="Branch Windows"
        columns={columns}
        data={windows}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        persistTableHead
        customStyles={{
          table: {
            style: {
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            },
          },
          headCells: {
            style: {
              fontWeight: "bold",
              fontSize: "14px",
              background: "linear-gradient(90deg, #6B21A8, #9333EA)",
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
          },
          rows: {
            style: {
              minHeight: "55px",
              borderRadius: "8px",
              margin: "4px 0",
              transition: "all 0.3s",
            },
          },
          cells: {
            style: {
              paddingLeft: "16px",
              paddingRight: "16px",
            },
          },
        }}
        conditionalRowStyles={[
          {
            when: () => true,
            style: {
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: "#A78BFA",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transform: "translateY(-2px)",
              },
            } as any,
          },
        ]}
      />
    </div>
  );
}
