# FlowOps delivery plan

## Product goal

Give cross-functional delivery teams a fast, trustworthy view of implementation
health and a low-friction way to keep the portfolio current.

## Phase 1 — Portfolio MVP · Complete

- [x] Customer implementation dashboard
- [x] Delivery summary calculations
- [x] Project search
- [x] Status filter
- [x] Responsive semantic project table and mobile cards
- [x] Loading, API error, filtered-empty, and portfolio-empty states
- [x] Typed query service
- [x] Unit and component test foundations
- [x] Accessible navigation, forms, progress, and focus states

Success signal: a delivery lead can find a project and identify portfolio risk
in under 30 seconds on desktop or mobile.

## Phase 2 — Mutations · Complete

- [x] New project dialog
- [x] Strongly typed nine-field project form
- [x] Accessible client-side validation
- [x] TanStack Query `useMutation`
- [x] Optimistic cache insertion
- [x] Error rollback
- [x] Pending controls and progress feedback
- [x] Success and failure messaging
- [x] Escape, focus containment, and focus restoration
- [x] Demo persistence and production REST POST path
- [x] Tests for open/close, validation, success, failure, and keyboard use

Success signal: a user can create a valid project without losing context, and a
failed request never leaves a phantom project in the portfolio.

## Phase 3 — Application architecture · Planned

- [ ] React Router and project detail routes
- [ ] URL-backed filters and shareable views
- [ ] Server pagination and sorting
- [ ] Edit project workflow with concurrency handling
- [ ] Reusable form primitives
- [x] Environment-based API URL
- [ ] Not-found page
- [ ] Permission-aware actions

Exit criterion: the portfolio scales beyond a single page and navigation state
can be shared reliably.

## Phase 4 — Engineering maturity · Planned

- [ ] GitHub Actions quality pipeline
- [ ] Playwright end-to-end coverage
- [ ] Automated accessibility checks
- [ ] Error boundary and production monitoring
- [ ] Performance budget and measurement
- [ ] Storybook component states
- [ ] Pull request template
- [ ] Conventional commit enforcement

Exit criterion: every change is automatically checked and critical workflows
are monitored in production.

## Phase 5 — Operational intelligence · Future

- [ ] Risk ageing and ownership
- [ ] Deadline and SLA notifications
- [ ] Portfolio trends over time
- [ ] Owner capacity signals
- [ ] Customer health integrations
- [ ] Role-based portfolio views
- [ ] CSV export and scheduled reporting

These items should be validated with Delivery and Product users before
implementation; they are intentionally not speculative features in the MVP.
