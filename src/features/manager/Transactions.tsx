import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import DataTable from "react-data-table-component";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { TransactionDetailModal } from "./TransactionDetailModal";

interface Transaction {
  id: string;
  formReferenceId: string;
  queueNumber: number;
  accountHolderName: string;
  amount: number;
  transactionType: string;
  status: number; // 0: Canceled, 1: On Queue, 2: On Progress, 3: Completed
  submittedAt: string;
}

export default function Transactions({ branchId }: { branchId: string }) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({
    OnQueue: 0,
    OnProgress: 0,
    Completed: 0,
    Canceled: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  // const [selectedTxn, setSelectedTxn] = useState<any | null>(null);


  const load = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await managerService.getTodaysTransactions(branchId);
      if (res?.success) {
        setTxns(res.data);
        calculateSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (transactions: Transaction[]) => {
    const newSummary = { OnQueue: 0, OnProgress: 0, Completed: 0, Canceled: 0 };
    transactions.forEach((txn) => {
      switch (txn.status) {
        case 0: newSummary.Canceled++; break;
        case 1: newSummary.OnQueue++; break;
        case 2: newSummary.OnProgress++; break;
        case 3: newSummary.Completed++; break;
      }
    });
    setSummary(newSummary);
  };

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const filteredTxns = txns.filter((t) => {
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "OnQueue" && t.status === 1) ||
      (statusFilter === "OnProgress" && t.status === 2) ||
      (statusFilter === "Completed" && t.status === 3) ||
      (statusFilter === "Canceled" && t.status === 0);

    const typeMatch = typeFilter === "All" || t.transactionType === typeFilter;

    return statusMatch && typeMatch;
  });

  const totalCount = summary.OnQueue + summary.OnProgress + summary.Completed + summary.Canceled;

  const statusBadge = (status: number) => {
    switch (status) {
      case 0: return <span className="px-2 py-1 rounded bg-red-500 text-white text-sm font-semibold">Canceled</span>;
      case 1: return <span className="px-2 py-1 rounded bg-yellow-500 text-white text-sm font-semibold">On Queue</span>;
      case 2: return <span className="px-2 py-1 rounded bg-blue-500 text-white text-sm font-semibold">On Progress</span>;
      case 3: return <span className="px-2 py-1 rounded bg-green-500 text-white text-sm font-semibold">Completed</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-500 text-white text-sm font-semibold">Unknown</span>;
    }
  };

  const columns = [
    { name: "Queue #", selector: (row: Transaction) => row.queueNumber, sortable: true },
    { name: "Type", selector: (row: Transaction) => row.transactionType, sortable: true },
    { name: "Account Holder", selector: (row: Transaction) => row.accountHolderName, sortable: true },
    { name: "Amount", selector: (row: Transaction) => `$${row.amount.toFixed(2)}`, sortable: true },
    { name: "Status", selector: (row: Transaction) => row.status, cell: (row: Transaction) => statusBadge(row.status), sortable: true },
    // {
    //   name: "Action",
    //   cell: (row: Transaction) => (
    //     <Button
    //       className="bg-purple-600 text-white hover:bg-purple-700 transition-shadow shadow-md hover:shadow-lg"
    //       onClick={() => setSelectedTxn(row)}
    //     >
    //       View
    //     </Button>
    //   ),
    // },


    {
      name: "Action",
      cell: (row: any) => (
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:from-purple-700 hover:to-purple-500 transition-all"
          onClick={() => setSelectedTxn(row)}
        >
          View
        </Button>
      ),
    },

  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-bank">📊 Today's Transactions</h2>

      {/* Total Count */}
      <div className="text-lg font-semibold text-center mb-2">{totalCount} Total Transactions</div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {["OnQueue", "OnProgress", "Completed", "Canceled"].map((status) => (
          <div key={status} className="bg-purple-900 text-white p-4 rounded text-center">
            <div className="text-lg font-semibold">{summary[status] || 0}</div>
            <div className="text-sm">{status}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex space-x-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="OnQueue">On Queue</SelectItem>
                <SelectItem value="OnProgress">On Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Deposit">Deposit</SelectItem>
                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                <SelectItem value="FundTransfer">Fund Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions DataTable */}
      <DataTable
        title="Transactions"
        columns={columns}
        data={filteredTxns}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        persistTableHead
        customStyles={{
          table: { style: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
          headCells: { style: { fontWeight: "bold", fontSize: "14px", background: "linear-gradient(90deg, #6B21A8, #9333EA)", color: "white", textTransform: "uppercase", letterSpacing: "0.5px" } },
          rows: { style: { minHeight: "55px", borderRadius: "8px", margin: "4px 0", transition: "all 0.3s" } },
          cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
        }}
      />

      {/* Modal */}
      {selectedTxn && (
        <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}


    </div>
  );
}
