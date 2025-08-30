import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import BranchAdUsers from "./BranchAdUsers";
import Windows from "./Windows";
import AssignMaker from "./AssignMaker";
import Transactions from "./Transactions";

export default function ManagerDashboard() {
  const [branchId, setBranchId] = useState<string>("");

  // Decode branchId from JWT once on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setBranchId(payload.BranchId);
    }
  }, []);

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-purple-900">🏦 Branch Manager Dashboard</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="bg-purple-900 text-white hover:bg-purple-800">👥 AD Users</TabsTrigger>
          <TabsTrigger value="windows" className="bg-purple-900 text-white hover:bg-purple-800">🪟 Windows</TabsTrigger>
          <TabsTrigger value="assign" className="bg-purple-900 text-white hover:bg-purple-800">🔗 Assign Maker</TabsTrigger>
          <TabsTrigger value="transactions" className="bg-purple-900 text-white hover:bg-purple-800">📊 Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <BranchAdUsers branchId={branchId} />
        </TabsContent>
        <TabsContent value="windows">
          <Windows branchId={branchId} />
        </TabsContent>
        <TabsContent value="assign">
          <AssignMaker branchId={branchId} />
        </TabsContent>
        <TabsContent value="transactions">
          <Transactions branchId={branchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}