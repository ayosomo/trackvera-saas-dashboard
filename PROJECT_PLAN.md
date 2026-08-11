# FlowOps product plan

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

One-week sprint goal: prove that FlowOps' critical user journeys work through
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

### Days 3-5 - Planned

The remaining sprint work will cover automated delivery checks, resilience
gates, deployment evidence, and release documentation. Each day will be scoped
before implementation so the sprint stays focused on production readiness
rather than test-count growth.

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
