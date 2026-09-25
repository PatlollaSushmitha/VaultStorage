import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function Analytics() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Trends in storage growth, throughput and replication lag over time."
      />
      <EmptyState
        icon={BarChart3}
        title="Not enough data collected yet"
        description="Analytics charts will populate once the cluster has been running and reporting metrics."
      />
    </div>
  );
}
