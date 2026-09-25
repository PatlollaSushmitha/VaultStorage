import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { api, timeAgo, type ActivityEvent } from "@/lib/api";

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.listActivity(200);
      setEvents(res.activity);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader
        title="Activity"
        description="A full audit log of cluster events: uploads, repairs, failures and configuration changes."
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {!loading && events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded yet"
          description="Every cluster event will be logged here as it happens, in the order it occurred."
        />
      ) : (
        <Card padding="lg">
          {events.map((entry) => {
            const isBad =
              entry.event_type.includes("FAIL") ||
              entry.event_type.includes("MISMATCH") ||
              entry.event_type.includes("CORRUPT");
            return (
              <ActivityItem
                key={entry.id}
                entry={{
                  id: entry.id,
                  title: entry.event_type.replace(/_/g, " "),
                  detail: entry.message,
                  timestamp: timeAgo(entry.created_at),
                  status: isBad ? "failed" : "healthy",
                }}
              />
            );
          })}
        </Card>
      )}
    </div>
  );
}
