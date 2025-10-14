import React, { useEffect, useRef, useState } from "react";
import reportService from "../../services/reportService.ts";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { HubConnectionBuilder } from "@microsoft/signalr";
import { saveAs } from "file-saver";
import axios from "axios";
import { Download, FileImage, FileSpreadsheet, FileText, PlayCircle } from "lucide-react";
import TrafficTabs from "./TrafficTabs.tsx";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../../assets/cbelogo.jpg"; // adjust to your logo path
import { Card, CardContent } from "../../components/ui/card.tsx";


export default function AdminReportPanel({ defaultBranchId }: { defaultBranchId?: string }) {
  const [filter, setFilter] = useState<any>({
    From: new Date(new Date().setHours(0, 0, 0, 0)),
    To: new Date(),
    BranchId: defaultBranchId || "",
    Page: 1,
    PageSize: 200,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesFeedBack, setBranchesFeedBack] = useState<any[]>([]);
  const [branchPerformance, setBranchPerformance] = useState<any[]>([]);

  const [rows, setRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [traffic, setTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const renderLabel = (entry: any) => `${entry.name} (${((entry.percent * 100) || 0).toFixed(1)}%)`;
  const [activeTab, setActiveTab] = useState("General Operations Overview");


  // 👇 Reference for capturing the full dashboard area
  const reportRef = useRef<HTMLDivElement>(null);

  //status peichart data

  // Map enum value to readable name
  const voucherStatusMap: Record<number, string> = {
    0: "Cancelled",
    1: "OnQueue",
    2: "OnProgress",
    3: "Completed",
    4: "Skipped",
  };
  // Map enum value to consistent color
  const voucherStatusColors: Record<number, string> = {
    0: "#EF4444", // Red → Cancelled
    1: "#F59E0B", // Amber → OnQueue
    2: "#3B82F6", // Blue → OnProgress
    3: "#10B981", // Green → Completed
    4: "#9CA3AF", // Gray → Skipped
  };

  const statusData = Object.entries(
    rows.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Convert backend statusData to chart-friendly format (if needed elsewhere)
  const formattedStatusData = statusData.map((item) => {
    // Try to parse status from item.name if possible
    const statusKey = Object.keys(voucherStatusMap).find(
      (key) => voucherStatusMap[Number(key)] === item.name || key === item.name
    );
    return {
      name: voucherStatusMap[Number(statusKey)] || item.name,
      value: item.value,
      color: voucherStatusColors[Number(statusKey)] || "#CCCCCC",
    };
  });




  const serviceData = Object.entries(
    rows.reduce((acc: any, r: any) => {
      acc[r.serviceName] = (acc[r.serviceName] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  console.log("kpi Data:", kpis);

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

  // Load average feedback by branch
  useEffect(() => {
    async function fetchFeedback() {
      console.log("Fetching average feedback by branch...");
      const res = await reportService.getAverageFeedbackByBranch();
      if (res.success) setBranchesFeedBack(res.data);
    }
    fetchFeedback();
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

      // After you set rows and branches
      const performance = calculateBranchPerformance(res.data || [], branches);
      setBranchPerformance(performance);
      console.log("Branch Performance:", performance);

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


  async function onExportWithFigures() {
    console.log("Exporting with figures...", reportRef.current);

    if (!reportRef.current) return;
    const element = reportRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    // Add logo and title
    pdf.addImage(logo, "JPEG", 10, 8, 25, 15);
    pdf.setFontSize(14);
    pdf.text("CBE Operations Dashboard Report", 105, 18, { align: "center" });

    // Add captured dashboard
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 30;
    if (imgHeight < pageHeight - 30) {
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let y = position;
      let i = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
        heightLeft -= pageHeight - 30;
        if (heightLeft > 0) {
          pdf.addPage();
          y = 10;
        }
        i++;
      }
    }

    pdf.save(`CBE_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
    <div>


      {/* Tabs */}
      <div className="border-b mb-4 flex gap-4">
        {["General Operations Overview", "Branch Feedback Overview", "Branch Performance Overview"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 transition-colors duration-200 ${activeTab === tab
                ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              {tab}
            </button>
          )
        )}
      </div>



      {/* TAB CONTENT */}
      {activeTab === "General Operations Overview" && (
        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100" ref={reportRef}>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            📊 General Operations Dashboard
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

            {/* 🆕 Export With Figures Button */}
            <button
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              onClick={onExportWithFigures}
            >
              <FileImage className="w-4 h-4" /> Export with Figures
            </button>
          </div>

          {/* ✅ All your previous KPI cards, charts, and tables stay the same below */}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <div className="text-gray-600 text-sm">Avg Waiting time (s)</div>
              <div className="text-2xl font-semibold">{Math.round((Number(kpis.avgWait)) / 60).toFixed(1)} min</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
              <div className="text-gray-600 text-sm">Avg Service time (s)</div>
              <div className="text-2xl font-semibold">{Math.round((Number(kpis.avgService)) / 60).toFixed(1)} min</div>
            </div>
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
              <div className="text-gray-600 text-sm">Avg  time in the system (s)</div>
              <div className="text-2xl font-semibold">{Math.round((Number(kpis.avgTotal)) / 60).toFixed(1)} min</div>

            </div>
            {/* <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
              <div className="text-gray-600 text-sm">Abandonments</div>
              <div className="text-2xl font-semibold">{kpis?.abandonments || 0}</div>
            </div> */}
          </div>

          {/* Traffic Chart */}
          {/* Traffic Charts by Timeframe */}
          <div className="mb-10">
            <h3 className="font-semibold mb-3 text-gray-700">Traffic Overview by Period</h3>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <TrafficTabs rows={rows} />
            </div>
          </div>

          {/* Pie Charts */}



          {/* Pie Charts */}
          <div className="flex flex-wrap justify-center gap-16 mb-10"> {/* increased gap from 10 → 16 */}
            {/* Status Pie */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 w-full sm:w-96">
              <h3 className="text-center font-semibold mb-4 text-gray-700">
                Queue Status Breakdown
              </h3>
              <div className="w-full h-72"> {/* increased height */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      label={({ name, percent }) =>
                        `${name}: ${((percent as number) * 100).toFixed(1)}%`
                      }
                    >
                      {formattedStatusData.map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [`${value}`, `${name}`]}
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                      }}
                    />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Pie */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 w-full sm:w-96">
              <h3 className="text-center font-semibold mb-4 text-gray-700">
                Service Type Breakdown
              </h3>
              <div className="w-full h-72"> {/* increased height */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      labelLine={true}
                      label={({ percent }) =>
                        `${((percent as number) * 100).toFixed(1)}%`
                      }
                    >
                      {serviceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [`${value}`, `${name}`]}
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: "0.85rem",
                        marginTop: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
      )}

      {activeTab === "Branch Feedback Overview" && (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Branch Feedback Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Table */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">Average Ratings by Branch</h3>
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 text-left">Branch Name</th>
                      <th className="p-2 text-center">Average Rating ⭐</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchesFeedBack.map((b) => (
                      <tr key={b.branchId} className="border-t hover:bg-gray-50">
                        <td className="p-2">{b.branchName}</td>
                        <td className="p-2 text-center font-semibold">{b.avgRating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

          </div>
        </div>
      )}



      {activeTab === "Branch Performance Overview" && (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold mb-4">🏦 Branch Performance Overview</h2>
          <p className="text-gray-600 mb-6">
            A summary of average wait, service, and total time (in minutes) for each branch.
            Lower times indicate higher efficiency.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">


              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr className="text-left text-gray-700 uppercase text-sm">
                  <th className="p-3 border-b font-semibold">Branch Name</th>
                  <th className="p-3 border-b text-center font-semibold">Avg Wait (min)</th>
                  <th className="p-3 border-b text-center font-semibold">Avg Service (min)</th>
                  <th className="p-3 border-b text-center font-semibold text-blue-700">Avg Total (min)</th>
                  <th className="p-3 border-b text-center font-semibold text-purple-700">Total Customers</th>
                  <th className="p-3 border-b text-center font-semibold text-teal-700">Throughput (cust/hr)</th> {/* new column */}
                  <th className="p-3 border-b text-center font-semibold text-red-700">Abandonment Rate (%)</th>

                </tr>
              </thead>
              <tbody>
                {branchPerformance.map((b) => {
                  const avgTotalMin = (b.avgTotal / 60).toFixed(1);
                  const performanceColor =
                    Number(avgTotalMin) < 10
                      ? "text-green-600 bg-green-50"
                      : Number(avgTotalMin) < 20
                        ? "text-yellow-600 bg-yellow-50"
                        : "text-red-600 bg-red-50";

                  return (
                    <tr key={b.branchId} className="hover:bg-gray-50 transition duration-200 text-gray-800">
                      <td className="p-3 border-b font-medium">{b.branchName}</td>
                      <td className="p-3 border-b text-center">{(b.avgWait / 60).toFixed(2)}</td>
                      <td className="p-3 border-b text-center">{(b.avgService / 60).toFixed(2)}</td>
                      <td className={`p-3 border-b text-center font-semibold rounded ${performanceColor}`}>
                        {avgTotalMin}
                      </td>
                      <td className="p-3 border-b text-center font-medium">{b.totalCustomers}</td>
                      <td className="p-3 border-b text-center font-medium">{b.throughput.toFixed(2)}</td> {/* show throughput */}

                      <td className="p-3 border-b text-center font-medium text-red-600">
                        {b.abandonmentRate.toFixed(2)}%
                      </td>

                    </tr>
                  );
                })}
              </tbody>




            </table>
          </div>

          {/* Optional: Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-xl shadow text-center">
              <p className="text-green-700 font-semibold text-lg">Best Performing</p>
              <p className="text-2xl font-bold mt-1">
                {
                  branchPerformance.sort((a, b) => a.avgTotal - b.avgTotal)[0]
                    ?.branchName || "-"
                }
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl shadow text-center">
              <p className="text-yellow-700 font-semibold text-lg">Average Performer</p>
              <p className="text-2xl font-bold mt-1">
                {
                  branchPerformance[Math.floor(branchPerformance.length / 2)]
                    ?.branchName || "-"
                }
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl shadow text-center">
              <p className="text-red-700 font-semibold text-lg">Needs Improvement</p>
              <p className="text-2xl font-bold mt-1">
                {
                  branchPerformance.sort((a, b) => b.avgTotal - a.avgTotal)[0]
                    ?.branchName || "-"
                }
              </p>
            </div>
          </div>

        </div>
      )}



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




// utils/reportUtils.ts
// utils/reportUtils.ts
export function calculateBranchPerformance(rows: any[], branches: any[]) {
  const branchMap: Record<string, any[]> = {};

  rows.forEach((r: any) => {
    if (!r.branchId) return;
    if (!branchMap[r.branchId]) branchMap[r.branchId] = [];
    branchMap[r.branchId].push(r);
  });

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return Object.entries(branchMap).map(([branchId, records]) => {
    const valid = records.filter(
      (r: any) => r.submittedAt && r.calledAt && r.completedAt
    );

    const waitTimes = valid.map(
      (r: any) =>
        (new Date(r.calledAt).getTime() - new Date(r.submittedAt).getTime()) / 1000
    );
    const serviceTimes = valid.map(
      (r: any) =>
        (new Date(r.completedAt).getTime() - new Date(r.calledAt).getTime()) / 1000
    );
    const totalTimes = valid.map(
      (r: any) =>
        (new Date(r.completedAt).getTime() - new Date(r.submittedAt).getTime()) / 1000
    );

    // 🕒 Throughput: customers served per hour
    const allTimes = valid
      .map(r => [new Date(r.submittedAt).getTime(), new Date(r.completedAt).getTime()])
      .flat();

    const startTime = Math.min(...allTimes);
    const endTime = Math.max(...allTimes);
    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    const throughput = totalHours > 0 ? valid.length / totalHours : valid.length;

    // 🚨 Abandonment rate = cancelled without makerId
    const abandoned = records.filter(
      (r: any) => r.status === 0 && (!r.frontMakerId || r.frontMakerId === null)
    ).length;
    const abandonmentRate =
      records.length > 0 ? (abandoned / records.length) * 100 : 0;

    const branchInfo = branches.find((b) => b.id === branchId);
    return {
      branchId,
      branchName: branchInfo ? branchInfo.name : branchId,
      avgWait: avg(waitTimes),
      avgService: avg(serviceTimes),
      avgTotal: avg(totalTimes),
      totalCustomers: records.length,
      throughput: throughput, // customers/hour
      abandonmentRate: abandonmentRate, // percentage
    };
  });
}