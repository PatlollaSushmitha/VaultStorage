import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Objects } from "@/pages/Objects";
import { Nodes } from "@/pages/Nodes";
import { Replication } from "@/pages/Replication";
import { Repairs } from "@/pages/Repairs";
import { Integrity } from "@/pages/Integrity";
import { Analytics } from "@/pages/Analytics";
import { FailureLab } from "@/pages/FailureLab";
import { ActivityPage } from "@/pages/Activity";
import { SettingsPage } from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/objects" element={<Objects />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/replication" element={<Replication />} />
        <Route path="/repairs" element={<Repairs />} />
        <Route path="/integrity" element={<Integrity />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/failure-lab" element={<FailureLab />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
