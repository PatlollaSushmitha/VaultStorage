import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Replica resync completed",
    detail: "node-03 caught up to quorum",
    time: "2m ago",
    status: "healthy" as const,
  },
  {
    id: "n2",
    title: "Latency above threshold",
    detail: "node-02 read latency 340ms",
    time: "18m ago",
    status: "warning" as const,
  },
  {
    id: "n3",
    title: "Integrity scan scheduled",
    detail: "Full cluster scan at 02:00 UTC",
    time: "1h ago",
    status: "info" as const,
  },
];

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-base-surface2 hover:text-text-primary"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-warning" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-base-border bg-base-surface2 shadow-popover"
          >
            <div className="flex items-center justify-between border-b border-base-border px-4 py-3">
              <span className="text-sm font-semibold text-text-primary">
                Notifications
              </span>
              <span className="text-xs text-text-muted">3 new</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col gap-1.5 border-b border-base-border px-4 py-3 last:border-0 hover:bg-base-border/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {n.title}
                    </span>
                    <StatusBadge status={n.status} />
                  </div>
                  <span className="text-xs text-text-secondary">{n.detail}</span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {n.time}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
