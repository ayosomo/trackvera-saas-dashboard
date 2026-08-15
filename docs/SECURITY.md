# Frontend security and permission contract

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository and avoid
including exploit details in a public issue. Reports should describe the
affected route or component, reproduction steps, impact, and a suggested fix
when available.

Only the current `main` branch is supported. Trackvera is a portfolio frontend
with fictional demo data and mock authentication; it does not process real
credentials or customer records.

## Scope and trust boundary

This phase establishes the production-facing frontend contract with mock
identities. It does not implement an identity provider, issue real sessions, or
store passwords.

The browser decides which controls to present and provides clear 401, 403, and
expired-session journeys. Those controls improve usability; they are not a
security boundary. A production API must independently authenticate the caller
and authorise every read and mutation.

## Mock identities and capabilities

Permissions are capabilities rather than role-name checks inside components.
The current matrix is:

| Role | View projects | Create projects | Edit project details | Update milestones and exceptions |
| --- | --- | --- | --- | --- |
| Admin | Yes | Yes | Yes | Yes |
| Operations Manager | Yes | Yes | Yes | Yes |
| Engineer | Yes | No | No | Yes |
| Read-only User | Yes | No | No | No |

`src/security/permissions.ts` is the single frontend policy definition.
Components receive capability decisions such as `canEditProjects`; they do not
contain duplicated role comparisons. Mutation entry points repeat the guard so
a hidden button is not the only client-side control.

## Authentication state

`AuthProvider` models three states:

- `authenticated`: a mock identity and a 30-minute expiry timestamp
- `unauthenticated`: no active identity; protected routes redirect to sign in
- `expired`: the previous identity is retained only to offer explicit session
  resumption

The demo session is stored in `sessionStorage`, contains no credential, and is
cleared when the browser tab closes. Identity changes, logout, and expiry clear
the React Query cache to avoid carrying one user's server state into another
session.

Production authentication should replace the mock provider with an established
identity provider and a backend-managed session, preferably using Secure,
HttpOnly, SameSite cookies. Trackvera should not create its own password store.

## Routing and API responses

- Protected routes pass through `RequireAuthentication`
- Unauthenticated navigation returns a 401-style sign-in view
- Expired sessions move to `/session-expired` and preserve the intended route
- API `401` responses expire the client session and clear cached project data
- API `403` responses navigate to a controlled forbidden view
- Authentication and authorisation failures are not retried automatically
- Other API failures retain the existing recoverable error behaviour

Server error bodies are not inserted into the page. Controlled client copy is
used for access failures.

## Safe rendering

API values are rendered through React text expressions. The application does
not use `dangerouslySetInnerHTML`, and a component test verifies that markup in
an API-provided customer name remains inert text.

This prevents an avoidable rendering sink but does not replace API validation,
output encoding for non-React consumers, or a production Content Security
Policy.

## Environment variables and secrets

All variables prefixed with `VITE_` are public and compiled into the browser
bundle. `VITE_API_URL` is a public endpoint, not a secret. Runtime validation
rejects client variable names containing `SECRET`, `TOKEN`, `PASSWORD`,
`PRIVATE_KEY`, or `API_KEY`.

`.gitignore` excludes all `.env*` files except `.env.example`. Production
tokens, signing keys, supplier credentials, and identity-provider secrets must
live in backend or deployment secret storage and must never be referenced by
client code.

## Deployment headers

`vercel.json` supplies a starting policy for:

- Content Security Policy
- clickjacking protection
- MIME sniffing protection
- referrer policy
- camera, microphone, and geolocation restrictions

The checked-in CSP allows connections only to the same origin. If the REST API
is deployed on another origin, add that exact origin to `connect-src` during
deployment review rather than allowing arbitrary hosts. Test the policy in the
real hosting environment because local Vite development does not apply Vercel
headers.

## Production replacement checklist

Before commercial use:

1. Replace mock identities with the chosen identity provider.
2. Establish a backend session and CSRF strategy appropriate to the transport.
3. Enforce the same capabilities on every API endpoint and record denials.
4. Add tenant and resource-level authorisation, not only global roles.
5. Confirm logout revokes the server session and clears client caches.
6. Validate the deployed CSP against the exact API, telemetry, and asset hosts.
7. Add security monitoring and dependency remediation to the delivery pipeline.
