import { useEffect, useState } from "react";
import AssignMaker from "./AssignMaker";

export default function AssignMakerRoute() {
  const [branchId, setBranchId] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setBranchId(payload.BranchId);
    }
  }, []);

  if (!branchId) return <div>Loading...</div>;

  return <AssignMaker branchId={branchId} />;
}
