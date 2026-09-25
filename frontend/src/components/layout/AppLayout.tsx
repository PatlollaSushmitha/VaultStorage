import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";
import { ROUTE_META } from "@/routes/routeMeta";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const meta = ROUTE_META[location.pathname] ?? {
    title: "Vault",
    breadcrumb: ["Vault"],
  };

  return (
    <div className="min-h-screen bg-base-bg">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]"
        )}
      >
        <Topbar
          title={meta.title}
          breadcrumb={meta.breadcrumb}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
