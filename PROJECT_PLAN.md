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

## Phase 2 — Project creation and updates · Complete

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

## Phase 3 — MSP orchestration · Complete

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

## Phase 4 — Production backend · Planned

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

## Phase 5 — Operational intelligence · Planned

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
