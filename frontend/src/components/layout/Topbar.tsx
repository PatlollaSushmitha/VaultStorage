import { Menu, Search } from "lucide-react";
import { NotificationMenu } from "@/components/menus/NotificationMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function Topbar({
  title,
  breadcrumb,
  onOpenMobileNav,
}: {
  title: string;
  breadcrumb: string[];
  onOpenMobileNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-base-border bg-base-bg/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-base-surface2 hover:text-text-primary lg:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <div className="flex min-w-0 flex-col justify-center">
        <div className="hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted/50">/</span>}
              {crumb}
            </span>
          ))}
        </div>
        <span className="truncate text-sm font-semibold text-text-primary sm:text-[15px]">
          {title}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search objects, nodes, jobs…"
            className="h-9 w-64 rounded-md border border-base-border bg-base-surface2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand/50 focus:outline-none"
          />
        </div>

        <button className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-base-surface2 hover:text-text-primary md:hidden">
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="hidden lg:block">
          <StatusBadge status="healthy" label="Cluster healthy" pulse />
        </div>

        <NotificationMenu />

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-bright">
          RK
        </div>
      </div>
    </header>
  );
}
