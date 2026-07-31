# FlowOps

FlowOps is a production-minded React and TypeScript frontend prototype for MSP
order coordinators. It brings customer requests, supply-chain references,
delivery milestones, exceptions, RACI ownership, and in-app activity into one
order-control workspace.

The central question is:

> What needs to happen next, and who is accountable for making it happen?

## Phase 1 foundation

The Phase 1 dashboard includes:

- Active, at-risk, blocked, and completed order summaries
- Search across customers, services, sites, owners, suppliers, and references
- Status filtering with an accessible result announcement
- Responsive desktop table and mobile order cards
- Loading, retryable error, filtered-empty, and unfiltered-empty states
- Manual refresh with a visible last-updated time
- Runtime validation for seed, browser-storage, and REST data
- A controlled application error boundary

Later prototype features remain available: order creation, milestone tracking,
exception playbooks, RACI details, and in-app notification events.

## Run locally

Prerequisites:

- Node.js 20.19 or newer
- pnpm 11.9.0

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Run all quality checks:

```bash
pnpm check
pnpm test:coverage
```

Individual commands are available as `pnpm lint`, `pnpm typecheck`,
`pnpm test`, and `pnpm build`.

## Data modes

UI components depend on an `OrdersRepository` interface and do not know which
data source is active.

### Demo mode

When `VITE_API_URL` is absent, `DemoOrdersRepository`:

- Fetches validated seed data from `public/orders.json`
- Saves created and updated orders in browser local storage
- Merges saved orders over seed records by ID

This is a single-browser demo. It is not durable multi-user storage.

### REST adapter

Set `VITE_API_URL` in a local `.env` file to use `HttpOrdersRepository`:

```text
GET   {VITE_API_URL}/orders
POST  {VITE_API_URL}/orders
PATCH {VITE_API_URL}/orders/{id}
```

Every response is validated before it reaches React. Invalid data becomes a
controlled query error rather than an unchecked cast or render failure.

The adapter is implemented and tested at the request/validation boundary. This
repository does not include a production backend.

## Architecture

```text
src/
├── api/orders/
│   ├── demoOrdersRepository.ts
│   ├── httpOrdersRepository.ts
│   ├── repository.ts
│   └── validation.ts
├── components/
│   ├── ErrorBoundary.tsx
│   ├── FeedbackMessage.tsx
│   ├── StatusBadge.tsx
│   └── SummaryCard.tsx
├── features/dashboard/
│   ├── DashboardContent.tsx
│   ├── selectors.ts
│   └── summary.ts
├── features/orders/
│   ├── OrderFilters.tsx
│   ├── OrderTable.tsx
│   ├── OrderForm.tsx
│   ├── OrderModal.tsx
│   ├── OrderDetailModal.tsx
│   ├── NotificationCentre.tsx
│   ├── orderJourney.ts
│   └── orderQueries.ts
├── styles/
│   ├── base.css
│   ├── orders.css
│   └── phase-one.css
├── App.tsx
├── main.tsx
└── types.ts
```

TanStack Query owns server state and reconciliation. Pure selectors own search,
status filtering, summary counts, and accountability calculations. Repository
adapters own network or browser persistence. React components own only interface
and interaction state.

## Accessibility baseline

- Skip navigation, landmarks, headings, table semantics, and live feedback
- Programmatic labels and required state on form controls
- Text labels in addition to colour for order health
- No duplicate section IDs or broken dashboard anchors
- Mobile text overrides for readable supporting and normal content
- Reduced-motion and forced-colour support

The create-order dialog includes Escape handling, focus containment, scroll
locking, validation focus, and focus restoration. A full application-wide dialog
primitive and automated accessibility suite remain future work.

## Known limitations

- Demo persistence is local to one browser and is not multi-user.
- No authentication, permissions, audit database, or real notification delivery.
- REST support is an adapter contract; no backend is shipped here.
- Notification and order-detail panels still need consolidation onto one shared,
  fully tested dialog primitive.
- Pagination, URL-backed filters, routing, and server-side search are outside
  Phase 1.
- Dates and generated IDs use the browser clock in demo mode.
- The prototype is English-only and has not completed formal assistive-technology
  certification.

## Phase 1 test coverage

The test suite covers:

- Loading, successful GET, failure/retry, malformed data, and empty portfolios
- Search, status, combined filters, counts, and filter clearing
- Summary and accountability boundary logic
- HTTP and demo repository validation
- Order table accessibility and mobile-compatible semantics
- Existing creation, rollback, milestone, RACI, and notification journeys

See `PROJECT_PLAN.md` for later product phases.
