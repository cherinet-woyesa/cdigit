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
  frontMakerId: string
  status: number; // 0: Canceled, 1: On Queue, 2: On Progress, 3: Completed
  submittedAt: string;
  depositedToCBSAt: string;
}

// Helper to format time (hh:mm:ss)
const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

// --- add this helper ---
const groupByMaker = (transactions: Transaction[]) => {
  const result: Record<
    string,
    { count: number; totalTime: number; avgTime: number }
  > = {};

  transactions.forEach((txn) => {
    if (txn.status === 3 && txn.frontMakerId && txn.depositedToCBSAt) {
      const time =
        new Date(txn.depositedToCBSAt).getTime() -
        new Date(txn.submittedAt).getTime();

      if (!result[txn.frontMakerId]) {
        result[txn.frontMakerId] = { count: 0, totalTime: 0, avgTime: 0 };
      }

      result[txn.frontMakerId].count++;
      result[txn.frontMakerId].totalTime += time;
      result[txn.frontMakerId].avgTime =
        result[txn.frontMakerId].totalTime / result[txn.frontMakerId].count;
    }
  });

  return result;
};



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

  // Compute service time stats
  const completedTxns = txns.filter(t => t.status === 3 && t.depositedToCBSAt);
  const serviceTimes = completedTxns.map(t =>
    new Date(t.depositedToCBSAt!).getTime() - new Date(t.submittedAt).getTime()
  );

  const longestService = serviceTimes.length ? Math.max(...serviceTimes) : 0;
  const shortestService = serviceTimes.length ? Math.min(...serviceTimes) : 0;
  const averageService = serviceTimes.length
    ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
    : 0;


  // 🆕 Compute per-maker stats
  const makerStats = groupByMaker(txns);


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
    { name: "Status", cell: (row: Transaction) => statusBadge(row.status), sortable: true },

    // 🆕 Service/Waiting Time Column
    {
      name: "Time",
      cell: (row: Transaction) => {
        const submittedAt = new Date(row.submittedAt).getTime();
        if (row.status === 1) { // OnQueue

          // const submittedAt = new Date(row.submittedAt).getTime();
          // const now = new Date().getTime(); // same units (UTC ms since epoch)
          // const waiting = now - submittedAt;
          const submittedAt = new Date(row.submittedAt + "Z").getTime();
          const now = Date.now();
          const waiting = Math.max(0, now - submittedAt);

          // const waiting = Date.now() - submittedAt;
          return <span className="text-yellow-600">⏳ {formatDuration(waiting)}</span>;
        }
        if (row.status === 3 && row.depositedToCBSAt) { // Completed
          const service = new Date(row.depositedToCBSAt).getTime() - submittedAt;
          return <span className="text-green-600">⚡ {formatDuration(service)}</span>;
        }
        return <span className="text-gray-500">-</span>;
      }
    },

    {
      name: "Action",
      cell: (row: any) => (
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:from-purple-700 hover:to-purple-500"
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

      {/* Service Time Stats */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-bank mb-2">⏱️ Service Time Stats</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-red-200 p-4 rounded text-center">
            <div className="text-lg font-semibold">{formatDuration(longestService)}</div>
            <div className="text-sm">Longest Service Time</div>
          </div>
          <div className="bg-green-200 p-4 rounded text-center">
            <div className="text-lg font-semibold">{formatDuration(shortestService)}</div>
            <div className="text-sm">Shortest Service Time</div>
          </div>
          <div className="bg-blue-200 p-4 rounded text-center">
            <div className="text-lg font-semibold">{formatDuration(averageService)}</div>
            <div className="text-sm">Average Service Time</div>
          </div>
        </div>
      </div>

      {/* Per-Maker Stats */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-bank mb-2">👨‍💼 Maker Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(makerStats).map(([makerId, stats]) => (
            <div
              key={makerId}
              className="bg-purple-100 p-4 rounded shadow text-center"
            >
              <div className="text-sm font-semibold text-purple-700">
                Maker ID: {makerId}
              </div>
              <div className="text-lg font-bold">
                {stats.count} Customers Served
              </div>
              <div className="text-sm text-gray-700">
                Avg Time: {formatDuration(stats.avgTime)}
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
