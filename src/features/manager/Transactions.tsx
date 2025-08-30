import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export default function Transactions({ branchId }: { branchId: string }) {
  const [txns, setTxns] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({
    OnQueue: 0,
    OnProgress: 0,
    Completed: 0,
    Canceled: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const load = async () => {
    const res = await managerService.getTodaysTransactions(branchId);
    if (res?.success) {
      setTxns(res.data); // Set transactions directly from data
      calculateSummary(res.data); // Calculate summary from fetched transactions
    }
  };

  const calculateSummary = (transactions: any[]) => {
    const newSummary = {
      OnQueue: 0,
      OnProgress: 0,
      Completed: 0,
      Canceled: 0,
    };

    transactions.forEach((txn) => {
      switch (txn.status) {
        case 0:
          newSummary.Canceled++;
          break;
        case 1:
          newSummary.OnQueue++;
          break;
        case 2:
          newSummary.OnProgress++;
          break;
        case 3:
          newSummary.Completed++;
          break;
      }
    });

    setSummary(newSummary);
  };

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const filteredTxns = txns.filter(t => {
    const statusMatch = statusFilter === "All" || 
      (statusFilter === "OnQueue" && t.status === 1) || 
      (statusFilter === "OnProgress" && t.status === 2) || 
      (statusFilter === "Completed" && t.status === 3) || 
      (statusFilter === "Canceled" && t.status === 0);

    const typeMatch = typeFilter === "All" || t.transactionType === typeFilter;

    return statusMatch && typeMatch;
  });

  // Calculate total transactions
  const totalCount = summary.OnQueue + summary.OnProgress + summary.Completed + summary.Canceled;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-bank">📊 Today's Transactions</h2>

      {/* Total Count Card */}
      <Card className="bg-blue-800 text-white mb-4">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-semibold">{totalCount}</div>
          <div className="text-sm">Total Transactions</div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {["OnQueue", "OnProgress", "Completed", "Canceled"].map((status) => (
          <Card key={status} className="bg-purple-900 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-semibold">{summary[status] || 0}</div>
              <div className="text-sm">{status}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter dropdowns */}
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
            <label className="block text-sm font-medium text-gray-700">Filter by Transaction Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Deposit">Deposit</SelectItem>
                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                <SelectItem value="FundTransfer">Fund Transfer</SelectItem>
                {/* Add other transaction types as necessary */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="grid gap-2">
        {filteredTxns.map((t) => (
          <Card key={t.id} className="bg-blackbase text-gold">
            <CardContent className="p-2 flex justify-between">
              <span>
                #{t.queueNumber} -- {t.transactionType} -- {t.accountHolderName} -- ${t.amount}
              </span>
              <span className="text-sm text-gray-300">
                {t.status === 0 ? "Canceled" : t.status === 1 ? "On Queue" : t.status === 2 ? "On Progress" : "Completed"}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}