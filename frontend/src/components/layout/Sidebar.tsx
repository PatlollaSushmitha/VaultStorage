import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Server,
  GitBranch,
  Wrench,
  ShieldCheck,
  BarChart3,
  FlaskConical,
  Activity,
  Settings,
  ChevronLeft,
  Database,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/menus/UserMenu";

const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Objects", path: "/objects", icon: Boxes },
  { label: "Nodes", path: "/nodes", icon: Server },
  { label: "Replication", path: "/replication", icon: GitBranch },
  { label: "Repairs", path: "/repairs", icon: Wrench },
  { label: "Integrity", path: "/integrity", icon: ShieldCheck },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Failure Lab", path: "/failure-lab", icon: FlaskConical },
  { label: "Activity", path: "/activity", icon: Activity },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-base-border bg-base-surface transition-all duration-200 ease-out",
          collapsed ? "w-[72px]" : "w-[248px]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-2.5 border-b border-base-border px-4",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand">
            <Database className="h-4 w-4" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-text-primary">
                VAULT
              </span>
              <span className="text-[11px] text-text-muted">
                Distributed Object Storage
              </span>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-base-surface2 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-brand/10 text-text-primary"
                    : "text-text-secondary hover:bg-base-surface2 hover:text-text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                  )}
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive ? "text-brand" : "text-text-muted group-hover:text-text-primary"
                    )}
                    strokeWidth={2}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System status + collapse toggle */}
        <div className="shrink-0 border-t border-base-border p-3">
          {!collapsed && (
            <div className="mb-3 rounded-md border border-base-border bg-base-surface2 px-3 py-2.5">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                System status
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-status-healthy">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-healthy opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-status-healthy" />
                </span>
                All Systems Operational
              </div>
            </div>
          )}

          <UserMenu collapsed={collapsed} />

          <button
            onClick={onToggleCollapse}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-md py-1.5 text-xs text-text-muted transition-colors hover:bg-base-surface2 hover:text-text-primary lg:flex"
          >
            <ChevronLeft
              className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>
    </>
  );
}
