import { useEffect, useState } from "react";
import managerService from "../../services/managerService";

import { Card, CardContent } from "../../components/ui/card";
import CreateStaff from "./CreateStaff";

export default function BranchAdUsers({ branchId }: { branchId: string }) {
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    const res = await managerService.getAdUsersByBranch(branchId);
    setUsers(res); // ✅ no need to unwrap .data anymore
  };

  useEffect(() => {
    if (branchId) loadUsers();
  }, [branchId]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-purple-900">
        👥 AD Users in Branch
      </h2>
      <CreateStaff branchId={branchId} reload={loadUsers} />
      <div className="grid gap-2 mt-4">
        {users.map((u) => (
          <Card key={u.id} className="border border-purple-900">
            <CardContent className="p-2 flex justify-between bg-black text-yellow-400">
              <span>
                {u.firstName} {u.lastName} ({u.email})
              </span>
              <span className="text-sm">{u.role || "Staff"}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}