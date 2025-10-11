import React, { useEffect, useState } from "react";
import reportService from "../../services/reportService.ts";
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { HubConnectionBuilder } from "@microsoft/signalr";
import { saveAs } from 'file-saver';

export default function AdminReportPanel({ defaultBranchId }: { defaultBranchId?: string }) {
  const [filter, setFilter] = useState<any>({ From: new Date(new Date().setHours(0,0,0,0)), To: new Date(), BranchId: defaultBranchId, Page: 1, PageSize: 200 });
  const [rows, setRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [traffic, setTraffic] = useState<any[]>([]);

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const conn = new HubConnectionBuilder()
      .withUrl("http://localhost:5268/hub/queueHub", { accessTokenFactory: () => localStorage.getItem('userToken') || '' })      
      .withAutomaticReconnect()
      .build();

            // .withUrl((process.env.REACT_APP_API || "http://localhost:5268") + "/hub/queueHub", { accessTokenFactory: () => localStorage.getItem('userToken') || '' })      
    //   const connection = new HubConnectionBuilder()
            // .withUrl('http://localhost:5268/hub/queueHub')
    //         .withAutomaticReconnect()
    //         .build();
      

    conn.start().then(() => {
                    console.log('Connected to SignalR hub');
      if (defaultBranchId) conn.invoke('SubscribeBranch', defaultBranchId);
      conn.on('QueueUpdated', () => load());
    });

    return () => { conn.stop(); };
    // eslint-disable-next-line
  }, []);


  async function load() {
    try {
      const q = { ...filter, From: filter.From.toISOString(), To: filter.To.toISOString() };
      const res = await reportService.query(q);
      setRows(res.data || []);
      const k = await reportService.kpis(q);
      setKpis(k.data);
      // make a simple client-side traffic by hour
      const hoursMap: Record<number, number> = {};
      (res.data || []).forEach((r:any) => {
        const h = new Date(r.submittedAt).getHours(); hoursMap[h] = (hoursMap[h] || 0) + 1;
      });
      setTraffic(Object.keys(hoursMap).map(k=> ({ hour: Number(k), count: hoursMap[Number(k)] })));
    } catch (err) { console.error(err); }
  }

  async function onExport(format: string) {
    const req = { Filter: { ...filter, From: filter.From.toISOString(), To: filter.To.toISOString() }, Format: format, FileName: `report_${format}` };
    const blob = await reportService.export(req);
    saveAs(new Blob([blob]), `report.${format}`);
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">HQ Reports</h2>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm">From</label>
          <input type="datetime-local" value={toInput(filter.From)} onChange={e=>setFilter({...filter, From: new Date(e.target.value)})} className="border p-2" />
        </div>
        <div>
          <label className="block text-sm">To</label>
          <input type="datetime-local" value={toInput(filter.To)} onChange={e=>setFilter({...filter, To: new Date(e.target.value)})} className="border p-2" />
        </div>
        <div className="flex items-end gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={()=>load()}>Run</button>
          <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={()=>onExport('csv')}>Export CSV</button>
          <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={()=>onExport('xlsx')}>Export XLSX</button>
          <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={()=>onExport('pdf')}>Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded"><div className="text-sm text-gray-500">Avg wait (s)</div><div className="text-2xl font-bold">{Math.round(kpis?.AverageWaitSeconds || 0)}</div></div>
        <div className="p-4 border rounded"><div className="text-sm text-gray-500">Avg service (s)</div><div className="text-2xl font-bold">{Math.round(kpis?.AverageServiceSeconds || 0)}</div></div>
        <div className="p-4 border rounded"><div className="text-sm text-gray-500">Abandonments</div><div className="text-2xl font-bold">{kpis?.Abandonments || 0}</div></div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Traffic by hour</h3>
        <LineChart width={800} height={200} data={traffic.map(t => ({ hour: t.hour, count: t.count }))}>
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Transactions</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="p-2 border">Queue#</th>
                <th className="p-2 border">Service</th>
                <th className="p-2 border">SubmittedAt</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Teller</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.queueNumber}</td>
                  <td className="p-2 border">{r.serviceName}</td>
                  <td className="p-2 border">{new Date(r.submittedAt).toLocaleString()}</td>
                  <td className="p-2 border">{r.status}</td>
                  <td className="p-2 border">{r.frontMakerId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function toInput(d:any){
  if(!d) return '';
  const dt = new Date(d);
  const pad = (n:number) => String(n).padStart(2,'0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
