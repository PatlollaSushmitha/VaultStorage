export type StatusKind = "healthy" | "warning" | "failed" | "info";

export interface NavItem {
  label: string;
  path: string;
  icon: string; // lucide icon name, resolved in Sidebar
}

export interface ActivityEntry {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  status: StatusKind;
}
