import React, { useEffect, useState } from "react";
import reportService from "../../services/reportService.ts";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { HubConnectionBuilder } from "@microsoft/signalr";
import { saveAs } from "file-saver";
import axios from "axios";
import { Download, FileSpreadsheet, FileText, PlayCircle } from "lucide-react";

export default function AdminReportPanel({ defaultBranchId }: { defaultBranchId?: string }) {
  const [filter, setFilter] = useState<any>({
    From: new Date(new Date().setHours(0, 0, 0, 0)),
    To: new Date(),
    BranchId: defaultBranchId || "",
    Page: 1,
    PageSize: 200,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [traffic, setTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const [activeTab, setActiveTab] = useState("Overview");



  const statusData = Object.entries(
    rows.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const serviceData = Object.entries(
    rows.reduce((acc: any, r: any) => {
      acc[r.serviceName] = (acc[r.serviceName] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));



  // Load branches
  useEffect(() => {
    axios
      .get("http://localhost:5268/api/branches", {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      })
      .then((res) => {
        if (res.data?.data) setBranches(res.data.data);
      })
      .catch((err) => console.error("Error loading branches:", err));
  }, []);

  // Load reports
  useEffect(() => {
    load();
  }, [filter]);

  // SignalR Live Updates
  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl("http://localhost:5268/hub/queueHub", {
        accessTokenFactory: () => localStorage.getItem("userToken") || "",
      })
      .withAutomaticReconnect()
      .build();

    conn.start().then(() => {
      console.log("✅ Connected to SignalR hub");
      if (filter.BranchId) conn.invoke("SubscribeBranch", filter.BranchId);
      conn.on("QueueUpdated", () => load());
    });

    return () => {
      conn.stop();
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const q = {
        ...filter,
        From: filter.From.toISOString(),
        To: filter.To.toISOString(),
        BranchId: filter.BranchId || null // <--- allow null to mean all branches

      };
      const res = await reportService.query(q);
      setRows(res.data || []);
      const k = await reportService.kpis(q);
      setKpis(k.data);

      const times = computeTimes(res.data || []);
      setKpis({ ...kpis, ...times });

      // Traffic by hour
      const hoursMap: Record<number, number> = {};
      (res.data || []).forEach((r: any) => {
        const h = new Date(r.submittedAt).getHours();
        hoursMap[h] = (hoursMap[h] || 0) + 1;
      });
      setTraffic(
        Object.keys(hoursMap).map((k) => ({
          hour: Number(k),
          count: hoursMap[Number(k)],
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function onExport(format: string) {
    const req = {
      Filter: { ...filter, From: filter.From.toISOString(), To: filter.To.toISOString() },
      Format: format,
      FileName: `report_${format}`,
    };
    const blob = await reportService.export(req);
    saveAs(new Blob([blob]), `report.${format}`);
  }

  function computeTimes(data: any[]) {
    const valid = data.filter(r => r.submittedAt && r.calledAt && r.completedAt);
    const waitTimes = valid.map((r) => (new Date(r.calledAt).getTime() - new Date(r.submittedAt).getTime()) / 1000);
    const serviceTimes = valid.map((r) => (new Date(r.completedAt).getTime() - new Date(r.calledAt).getTime()) / 1000);
    const totalTimes = valid.map((r) => (new Date(r.completedAt).getTime() - new Date(r.submittedAt).getTime()) / 1000);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      avgWait: avg(waitTimes),
      avgService: avg(serviceTimes),
      avgTotal: avg(totalTimes),
    };
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        📊 HQ Operations Dashboard
      </h2>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-600">From</label>
          <input
            type="datetime-local"
            value={toInput(filter.From)}
            onChange={(e) => setFilter({ ...filter, From: new Date(e.target.value) })}
            className="border rounded-lg w-full p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">To</label>
          <input
            type="datetime-local"
            value={toInput(filter.To)}
            onChange={(e) => setFilter({ ...filter, To: new Date(e.target.value) })}
            className="border rounded-lg w-full p-2"
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-600">Branch</label>
          <select
            value={filter.BranchId || ""}
            onChange={(e) => setFilter({ ...filter, BranchId: e.target.value || null })}
            className="border rounded-lg w-full p-2"
          >
            <option value="">All</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-600">Service Type</label>
          <select
            value={filter.ServiceType || ""}
            onChange={(e) => setFilter({ ...filter, ServiceType: e.target.value || null })}
            className="border rounded-lg w-full p-2"
          >
            <option value="">All</option>
            <option value="Transaction">Transaction</option>
            <option value="E-banking">E-banking</option>
          </select>
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-600">Service Name</label>
          <select
            value={filter.ServiceName || ''}
            onChange={e => setFilter({ ...filter, ServiceName: e.target.value || null })}
            className="border rounded-lg w-full p-2">
            <option value="">All</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="FundTransfer">Fund Transfer</option>
            <option value="RTGS">RTGS</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-600">Status</label>
          <select
            value={filter.Status || ""}
            onChange={(e) => setFilter({ ...filter, Status: e.target.value || null })}
            className="border rounded-lg w-full p-2"
          >
            <option value="">All</option>
            <option value="OnQueue">On Queue</option>
            <option value="OnProgress">On Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          onClick={load}
        >
          <PlayCircle className="w-4 h-4" /> Run
        </button>
        <button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
          onClick={() => onExport("csv")}
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV
        </button>
        <button
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          onClick={() => onExport("xlsx")}
        >
          <FileSpreadsheet className="w-4 h-4" /> Export XLSX
        </button>
        <button
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          onClick={() => onExport("pdf")}
        >
          <FileText className="w-4 h-4" /> Export PDF
        </button>
      </div>


      {/* Tabs */}
      <div className="border-b mb-4 flex gap-4">
        {["Overview", "Time Analytics", "Transactions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${activeTab === tab
                ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                : "text-gray-500"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
          <div className="text-gray-600 text-sm">Avg Wait (s)</div>
          <div className="text-2xl font-semibold">{Math.round(kpis?.AverageWaitSeconds || 0)}</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
          <div className="text-gray-600 text-sm">Avg Service (s)</div>
          <div className="text-2xl font-semibold">{Math.round(kpis?.AverageServiceSeconds || 0)}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
          <div className="text-gray-600 text-sm">Abandonments</div>
          <div className="text-2xl font-semibold">{kpis?.Abandonments || 0}</div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="mb-8">
        <h3 className="font-semibold mb-3 text-gray-700">Hourly Traffic Overview</h3>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={traffic}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>



      <div className="flex flex-wrap gap-8 justify-center">
        <div>
          <h3 className="text-center font-semibold mb-2">Queue Status Breakdown</h3>
          <PieChart width={300} height={200}>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} >
              {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend />
          </PieChart>
        </div>
        <div>
          <h3 className="text-center font-semibold mb-2">Service Type Breakdown</h3>
          <PieChart width={300} height={200}>
            <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend />
          </PieChart>
        </div>
      </div>




      {/* Transactions Table */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Recent Transactions</h3>
        <div className="overflow-auto max-h-[420px] border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 border">Queue#</th>
                <th className="p-2 border">Service</th>
                <th className="p-2 border">SubmittedAt</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Teller</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-gray-500">
                    {loading ? "Loading data..." : "No records found"}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{r.queueNumber}</td>
                    <td className="p-2 border">{r.serviceName}</td>
                    <td className="p-2 border">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    <td className="p-2 border">{r.status}</td>
                    <td className="p-2 border">{r.frontMakerId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function toInput(d: any) {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate()
  )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
