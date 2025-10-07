import { useEffect, useState, useCallback } from "react";
import CreateStaff from "./CreateStaff";

export default function CreateStaffRoute() {
  const [branchId, setBranchId] = useState<string>("");
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setBranchId(payload.BranchId);
    }
  }, []);

  const reload = useCallback(() => setReloadFlag(f => f + 1), []);

  if (!branchId) return <div>Loading...</div>;

  return <CreateStaff branchId={branchId} reload={reload} key={reloadFlag} />;
}