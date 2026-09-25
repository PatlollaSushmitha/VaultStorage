import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md border border-base-border bg-base-surface2 px-2.5 py-2 text-left transition-colors hover:border-base-borderStrong",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-bright">
          RK
        </div>
        {!collapsed && (
          <>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium text-text-primary">
                Rhea Kapoor
              </span>
              <span className="truncate text-[11px] text-text-muted">
                Cluster admin
              </span>
            </div>
            <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-text-muted" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-lg border border-base-border bg-base-surface2 py-1 shadow-popover"
          >
            <MenuRow icon={UserCircle} label="Profile" />
            <MenuRow icon={Settings} label="Account settings" />
            <div className="my-1 h-px bg-base-border" />
            <MenuRow icon={LogOut} label="Sign out" danger />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  danger = false,
}: {
  icon: typeof UserCircle;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-base-border/50",
        danger ? "text-status-failed" : "text-text-secondary hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
