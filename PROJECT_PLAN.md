# Trackvera product plan

## Product goal

Help MSP project coordinators move every customer order through a multi-party
supply chain without having to remember who owns a delay or what to do next.

## Phase 1 — Portfolio control · Complete

- [x] Managed-order dashboard
- [x] Search and status filters
- [x] Delivery-health and recurring-value summaries
- [x] Responsive semantic order table
- [x] Loading, error, and empty states

## Phase 2 — Project creation, updates, and orchestration · Complete

- [x] Three-step order wizard
- [x] Shared strongly typed form for creation and editing
- [x] Accessible modal behaviour and focus management
- [x] Client-side validation with field-level errors
- [x] Customer, service, site, owner, supplier, and partner data
- [x] CRF, partner, and supplier reference chain
- [x] Automatic starting milestone
- [x] Project editing without resetting milestones, RACI, or blockers
- [x] TanStack Query create and update mutations
- [x] Optimistic creation and editing with rollback
- [x] Success, error, and owner notifications
- [x] Component tests for create, edit, validation, and failure behaviour
- [x] Automatic project tracker creation
- [x] Eight-stage order journey
- [x] Milestone-specific RACI
- [x] Current accountability dashboard
- [x] Milestone completion controls
- [x] Owner milestone notifications
- [x] ECC and wayleave exception handling
- [x] Access, survey, capacity, stock, data, and porting playbooks
- [x] Issue logging and resolution
- [x] Progress blocking while exceptions remain open
- [x] Tests for tracker, RACI, playbooks, and notifications

## Phase 3 — Application architecture · Complete

- [x] React Router application shell
- [x] Individual project detail routes
- [x] URL-backed search and status filters
- [x] URL-backed sorting and pagination
- [x] Reusable text, select, date, and number form controls
- [x] Environment configuration separated from the API adapter
- [x] Dedicated not-found and unexpected-error pages
- [x] Domain, API, application, route, and presentation boundaries
- [x] Pure tests for list rules and URL state
- [x] Component coverage for direct routes and filter persistence

## Phase 4 — Production readiness and delivery · In progress

One-week sprint goal: prove that Trackvera's critical user journeys work through
the production bundle and can become a dependable delivery gate.

### Day 1 — E2E foundation · Complete

- [x] Install and configure Playwright Test with managed Chromium
- [x] Build and serve the production bundle from the Playwright web server
- [x] Exercise REST mode through deterministic route fixtures
- [x] Load, search, filter, sort, and paginate the order portfolio
- [x] Open project details and preserve URL-backed list state on return
- [x] Create an order through the complete three-step wizard
- [x] Edit an existing order and reconcile the server response
- [x] Verify optimistic rollback after a failed mutation
- [x] Recover from project API failures
- [x] Verify project-not-found and route-level 404 behaviour
- [x] Verify keyboard entry, validation, dismissal, and focus restoration
- [x] Retain traces, screenshots, and video only when a test fails

Day 1 exit criterion: eight meaningful E2E scenarios pass automatically
against the compiled production build.

### Day 2 - Accessibility - Complete

- [x] Add `@axe-core/playwright` to the production-build E2E suite
- [x] Scan dashboard, form, notification, detail, service-error, and 404 states
- [x] Attach full axe results to Playwright reports
- [x] Fix priority-indicator ARIA semantics
- [x] Fix text contrast failures without suppressing axe rules
- [x] Add native required semantics to reusable form controls
- [x] Trap notification-dialog focus and restore focus to its trigger
- [x] Move focus to main content after route changes
- [x] Correct project-detail heading hierarchy
- [x] Manually verify keyboard, focus, form, error, and routing behaviour

Day 2 exit criterion: five axe scenarios and the full thirteen-test E2E suite
pass against the compiled production build, with manual keyboard and focus
checks recorded during implementation.

### Day 3 - Performance - Complete

- [x] Add a repeatable production-build measurement harness
- [x] Record five-run baseline samples and medians
- [x] Measure bundle size, initial transfer, routing, search, layout shift, and long tasks
- [x] Identify the monolithic initial JavaScript bundle as the only actionable bottleneck
- [x] Lazy-load project forms and notifications
- [x] Rerun the identical scenarios and document the comparison
- [x] Preserve healthy interaction, layout-stability, and long-task behaviour

Day 3 exit criterion: the initial JavaScript bundle is 11.4 KB smaller, the
initial compressed transfer is 2.8 KB smaller, and all unchanged performance
areas remain within normal local measurement variance.

### Day 4 - Security and permissions - Complete

- [x] Add a mock authentication provider without passwords
- [x] Protect portfolio and project routes
- [x] Define capability-based permissions for four operational roles
- [x] Hide or replace actions that a role cannot perform
- [x] Guard mutation entry points in addition to hiding controls
- [x] Clear cached server state on identity changes, logout, and expiry
- [x] Map API 401 and 403 responses to controlled application states
- [x] Keep API-provided markup inert through React text rendering
- [x] Reject secret-like Vite environment variable names
- [x] Add baseline CSP and security headers for deployment
- [x] Document the API enforcement boundary and identity-provider roadmap

Day 4 exit criterion: authentication and permission behaviour is demonstrable
with mock identities while the documentation makes clear that production
authorisation belongs to the API.

### Day 5 - CI/CD and deployment - In progress

- [x] Add an explicit strict TypeScript check
- [x] Run lint, type-check, unit/component tests, build, and E2E on pull requests
- [x] Test Playwright journeys against the compiled production bundle
- [x] Upload the production bundle and Playwright report as CI artifacts
- [x] Gate the Vercel release workflow on a successful `main` CI run
- [x] Add production SPA rewrites and deployment security headers
- [x] Document architecture, environment variables, deployment, and rollback
- [x] Publish a claimable Vercel production deployment
- [x] Claim the deployment in Vercel
- [x] Verify the permanent public URL and direct application routes
- [ ] Configure GitHub deployment secrets and verify the first gated release

Day 5 exit criterion: every pull request is automatically verified, failed
checks cannot start a release, and the verified frontend is available at a
permanent public URL.

## Phase 5 — Production backend · Planned

- [ ] Durable order and audit-event database
- [ ] Role-based authentication and permissions
- [ ] Customer, partner, and supplier organisation records
- [ ] Immutable milestone and exception timeline
- [ ] Email and Microsoft Teams notification delivery
- [ ] Notification preferences and escalation rules
- [ ] Supplier webhook and polling adapters
- [ ] CRM and service-desk integration
- [ ] Document attachments for CRF, quotes, surveys, and wayleaves

Exit criterion: every change is attributable, durable, permission-aware, and
available across devices.

## Phase 6 — Operational intelligence · Planned

- [ ] SLA clocks by milestone and supplier
- [ ] Exception ageing and overdue escalation
- [ ] Predicted delivery-date risk
- [ ] Supplier lead-time and rejection trends
- [ ] Coordinator workload and queue balancing
- [ ] First-time-right CRF quality reporting
- [ ] Customer-facing order status view
- [ ] Portfolio export and scheduled reporting

Exit criterion: delivery leaders can identify systemic pain points before they
become customer escalations.

## Recommended production events

The backend should publish events such as:

```text
order.created
order.reference_added
milestone.completed
exception.logged
exception.assigned
exception.overdue
exception.resolved
target_date.changed
order.handed_over
```

Each event should include the order, customer, owner, accountable organisation,
previous and next states, actor, timestamp, and correlation ID.
