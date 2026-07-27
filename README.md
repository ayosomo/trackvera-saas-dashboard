# FlowOps

FlowOps is an implementation delivery dashboard for Product, Delivery, and
Engineering teams. It brings customer projects, delivery health, deadlines,
owners, risks, progress, and recurring customer value into one operational
view.

This repository contains the complete Phase 1 portfolio MVP and Phase 2 project
creation workflow. It is intentionally a focused frontend application: the
architecture demonstrates production-facing React patterns without adding
state or styling libraries the product does not need.

## What is included

- Responsive delivery dashboard with realistic implementation data
- Active project, delivery attention, due-soon, and monthly value summaries
- Search across customer, project, and owner
- Status filtering with result counts and a clear-filter empty state
- Semantic desktop project table that becomes labelled project cards on mobile
- Loading, API error, and empty states
- Accessible project creation dialog with focus management and a keyboard trap
- Strongly typed project form with all nine requested delivery fields
- Accessible client-side validation and first-invalid-field focus
- TanStack Query mutation with optimistic cache updates and error rollback
- Pending, success, and failure feedback
- Typed API boundary supporting both demo mode and a real REST service
- Unit and user-focused component tests with Vitest and React Testing Library
- Strict TypeScript and ESLint configuration

## Run locally

Prerequisites: Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

Quality checks:

```bash
npm run test
npm run lint
npm run build
```

Optional coverage report:

```bash
npm run test:coverage
```

## Data and API modes

FlowOps keeps networking and persistence out of UI components. Components call
`getProjects` and `createProject` from `src/api/projects.ts`; TanStack Query owns
the server-state lifecycle.

### Demo mode (default)

With no environment variable set, the application:

1. Fetches seed data from `public/projects.json`.
2. Saves newly created projects to browser local storage.
3. Merges those projects into future reads.

This makes the full creation journey usable on a static deployment without
pretending a backend exists. The short artificial delay makes pending and
optimistic states observable.

### REST mode

Copy `.env.example` to `.env` and set:

```text
VITE_API_URL=https://api.example.com
```

The same frontend then uses:

- `GET {VITE_API_URL}/projects`
- `POST {VITE_API_URL}/projects`

The POST request sends `ProjectDraft` JSON and expects the saved `Project`,
including `id` and `updatedAt`, in the response. No component changes are
required.

## Architecture

```text
src/
├── api/
│   └── projects.ts             Typed API/demo adapter
├── components/
│   ├── FeedbackMessage.tsx
│   ├── StatusBadge.tsx
│   └── SummaryCard.tsx
├── features/
│   ├── dashboard/
│   │   ├── summary.ts          Pure business calculations
│   │   └── summary.test.ts
│   └── projects/
│       ├── ProjectFilters.tsx
│       ├── ProjectForm.tsx
│       ├── ProjectModal.tsx
│       ├── ProjectTable.tsx
│       └── component tests
├── lib/
│   └── formatters.ts
├── test/
│   ├── fixtures.ts
│   └── setup.ts
├── App.test.tsx                Creation workflow integration tests
├── App.tsx                     Query orchestration and page composition
├── main.tsx                    Query client and application entry point
├── styles.css                  Design system and responsive behaviour
└── types.ts                    Project domain model
```

### State ownership

- **Server state:** TanStack Query owns fetched projects, caching, loading,
  retry, refetch, mutation, optimistic state, and rollback.
- **Local interface state:** React owns search text, status selection, dialog
  visibility, and ephemeral feedback.
- **Form state:** `ProjectForm` owns typed field values and validation errors.

Redux would add a second state system without solving a current problem.

### Optimistic creation

Before a create request, FlowOps cancels in-flight reads, snapshots the project
cache, and inserts a temporary project. A successful response replaces that
temporary ID with the server record. A failure restores the snapshot and keeps
the populated form open so the user can retry.

### Accessibility

- Skip navigation and visible keyboard focus
- Semantic headings, landmarks, table, caption, and progress elements
- Properly labelled fields and status feedback
- `aria-invalid` and linked error descriptions
- Dialog name/description, focus containment, Escape close, and background
  scroll lock
- Focus returns to the **New project** button after every close path
- Responsive cards reuse the semantic table markup instead of duplicating
  content
- Reduced-motion support

## Deliberate trade-offs

### Plain CSS instead of Tailwind

Plain CSS keeps responsive behaviour, focus states, table-to-card
transformation, tokens, and media queries visible. In a larger application the
styles could move to CSS Modules or an established company design system.

### Demo adapter instead of a bundled backend

A backend would expand the scope beyond the requested React portfolio project.
The API boundary still proves REST request construction and keeps replacement
straightforward. Demo persistence makes all UI behaviour testable and usable
today.

### React Query instead of Redux

The complex state here is remote state. React Query directly addresses its
caching and mutation semantics; React is sufficient for the small amount of UI
state.

### Table plus responsive CSS instead of duplicate cards

Desktop users need column comparison, which calls for a semantic table.
Mobile users need scan-friendly cards. CSS reshapes the same rows, preventing
two render paths from drifting apart.

### Unit and component tests before end-to-end tests

The current tests cover business rules and the main user workflow at high
speed. Playwright is most valuable once routing, editing, and a deployed backend
are part of the application.

## Suggested Git history

Create small, reviewable commits in this order:

```text
chore: initialise Vite React TypeScript application
feat: add typed project domain and API adapter
feat: build delivery summary and responsive project table
feat: add project search and status filters
feat: add accessible project creation modal
feat: implement optimistic project creation and rollback
test: cover dashboard calculations and project views
test: cover project creation success and failure paths
docs: document FlowOps architecture and roadmap
```

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the phased roadmap.
