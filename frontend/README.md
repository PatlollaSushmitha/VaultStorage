# Vault — Frontend Foundation

Step 1 deliverable: the application shell, design system, routing, and polished
placeholder pages for Vault, a distributed object storage management platform.
No backend, database, or real cluster logic is included yet — every value on
screen is mock data.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

To type-check and build for production:

```bash
npm run build
npm run preview
```

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Lucide icons · Framer Motion for
transitions · Recharts is installed and ready for the next step's real charts.

## Structure

```
src/
  components/
    layout/     AppLayout, Sidebar, Topbar
    menus/      UserMenu, NotificationMenu
    ui/         Button, Card, StatusBadge, MetricCard, EmptyState,
                ActivityItem, PageHeader
  pages/        One file per route (Dashboard is fully built out;
                the rest are polished "coming soon" placeholders)
  routes/       routeMeta.ts — maps each path to its topbar title/breadcrumb
  types/        Shared TypeScript types
  lib/          cn() class-merging helper
```

## Design tokens

Colors, fonts, radii and shadows are defined in `tailwind.config.ts`:

- Background `#0a0c10`, card surface `#12151b`, borders `#21252c`
- Text: primary `#eceef1`, secondary `#9aa2b1`, muted `#6b7280`
- Brand accent (interactive elements): `#5b8def`
- Status colors: healthy `#34d399`, warning `#f59e0b`, failed `#f0525c`,
  info `#60a5fa`
- Typography: Inter for UI text, JetBrains Mono for metrics, node IDs and
  timestamps

## Routes

`/dashboard` `/objects` `/nodes` `/replication` `/repairs` `/integrity`
`/analytics` `/failure-lab` `/activity` `/settings`

All routes render inside `AppLayout` (fixed/collapsible sidebar + topbar) and
are responsive down to mobile, where the sidebar becomes a drawer.

## Not included in this step (by design)

Backend, database, real file storage, replication/repair algorithms, failure
simulation logic, and APIs. These placeholders are ready to be wired up
page-by-page in the next steps.
