import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Cluster configuration, access control, and notification preferences."
      />
      <EmptyState
        icon={Settings}
        title="Settings coming online soon"
        description="Cluster-wide configuration, API credentials and team access will be managed from here."
      />
    </div>
  );
}
