import React, { useEffect, useState, useMemo } from "react";
import managerService from "@services/managerService";
import CreateCorporateCustomerModal from "@features/manager/CreateCorporateCustomerModal";


interface CorporateCustomer {
  id: string;
  accountNumber: string;
  phoneNumber: string;
  description?: string;
  status: string;
  creatorUserId?: string;
}

interface Props {
  managerId: string;
}

const statusOptions = ["Active", "Inactive", "Pending"];

export default function CorporateCustomers({ managerId }: Props) {
  const [customers, setCustomers] = useState<CorporateCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // --- search, sort, pagination, filters ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortColumn, setSortColumn] = useState<keyof CorporateCustomer>("accountNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // --- edit & status states ---
  const [editingCustomer, setEditingCustomer] = useState<CorporateCustomer | null>(null);
  const [formData, setFormData] = useState<Partial<CorporateCustomer>>({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CorporateCustomer | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);


  // --- fetch customers ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await managerService.getCorporateCustomers();
      setCustomers(res?.data || []);
    } catch (err) {
      console.error("Error fetching corporate customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- derived data ---
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = [c.accountNumber, c.phoneNumber, c.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const sorted = useMemo(() => {
    const sortedData = [...filtered].sort((a, b) => {
      const valA = (a[sortColumn] || "").toString().toLowerCase();
      const valB = (b[sortColumn] || "").toString().toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sortedData;
  }, [filtered, sortColumn, sortDirection]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const totalPages = Math.ceil(sorted.length / pageSize);

  // --- actions ---
  const handleEditClick = (customer: CorporateCustomer) => {
    setEditingCustomer(customer);
    setFormData({
      accountNumber: customer.accountNumber,
      phoneNumber: customer.phoneNumber,
      description: customer.description,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    try {
      await managerService.updateCorporateCustomer(editingCustomer.id, formData);
      // Update state instantly
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...formData } : c
        )
      );
      setEditingCustomer(null);
      setFormData({});
    } catch (err) {
      console.error("Error updating customer:", err);
    }
  };

  const openStatusModal = (customer: CorporateCustomer) => {
    setSelectedCustomer(customer);
    setNewStatus(customer.status);
    setStatusModalOpen(true);
  };

  const handleStatusSave = async () => {
    if (!selectedCustomer) return;
    try {
      await managerService.changeCorporateCustomerStatus(selectedCustomer.id, newStatus);
      // Update state instantly
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, status: newStatus } : c
        )
      );
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Error changing status:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const handleSort = (column: keyof CorporateCustomer) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      {/* Create Customer Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-800">🏢 Corporate Customers</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-purple-500 transition-all"
        >
          ➕ Create Customer
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="🔍 Search customers..."
          className="w-full md:w-1/3 border rounded px-3 py-2"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="flex gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="All">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-3 py-2"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gradient-to-r from-purple-700 to-purple-500 text-white">
            <tr>
              {["accountNumber", "phoneNumber", "description", "status"].map((col) => (
                <th
                  key={col}
                  className="p-3 cursor-pointer select-none"
                  onClick={() => handleSort(col as keyof CorporateCustomer)}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortColumn === col && (sortDirection === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((c) => (
                <tr key={c.id} className="border-b hover:bg-purple-50 transition">
                  <td className="p-3">{c.accountNumber}</td>
                  <td className="p-3">{c.phoneNumber}</td>
                  <td className="p-3">{c.description || "-"}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleEditClick(c)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      onClick={() => openStatusModal(c)}
                    >
                      Change Status
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No corporate customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>



      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Edit Customer</h2>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                value={formData.accountNumber || ""}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Account Number"
              />
              <input
                className="w-full border rounded px-3 py-2"
                value={formData.phoneNumber || ""}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Phone Number"
              />
              <input
                className="w-full border rounded px-3 py-2"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setEditingCustomer(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={handleSaveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModalOpen && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4 text-purple-900">Change Status</h2>
            <div className="flex flex-col gap-2 mb-4">
              {statusOptions.map((s) => {
                const color = getStatusColor(s);
                return (
                  <button
                    key={s}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${newStatus === s ? "bg-gray-200" : "bg-white"}`}
                    onClick={() => setNewStatus(s)}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full ${color}`}></span>
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={handleStatusSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateCorporateCustomerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchCustomers}
        managerId={managerId}
      />

    </div>
  );
}