# Deployment and release process

Trackvera is configured as a Vite single-page application on Vercel. The
deployment uses the compiled `dist` directory, preserves React Router URLs
through a rewrite to `index.html`, and applies the security headers in
`vercel.json`.

Production: [trackvera-saas-dashboard.vercel.app](https://trackvera-saas-dashboard.vercel.app/projects)

The initial public deployment is connected to the GitHub repository through
Vercel. The Actions-based release workflow below remains disabled until its
scoped credentials are configured; this prevents an incomplete release job
from failing noisily.

## Production pipeline

1. A pull request runs `.github/workflows/ci.yml`.
2. CI installs the locked pnpm dependency graph.
3. Lint, strict TypeScript, unit/component tests, a production build, and all
   Playwright journeys must pass.
4. A merge or direct push to `main` runs the same checks again.
5. `.github/workflows/deploy.yml` receives the completed CI event.
6. The deployment job runs only when the event was a successful push.
7. Vercel builds and deploys that exact verified commit.

This workflow gate blocks releases after failed checks. To block merging as
well, configure the repository's `main` branch protection rules to require the
`Quality and production journeys` status check.

## Required GitHub secrets

Create a Vercel project, then add these repository or production-environment
secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Purpose |
| --- | --- |
| `VERCEL_TOKEN` | Short-lived or scoped token used by the deployment workflow |
| `VERCEL_ORG_ID` | Vercel team or account identifier |
| `VERCEL_PROJECT_ID` | Vercel project identifier |

After the three secrets exist, add the repository or production-environment
variable `VERCEL_DEPLOY_ENABLED=true`. The deployment job remains safely
skipped while that variable is absent, so the initial workflow commit does not
create a failed release from incomplete account configuration.

The IDs are written to `.vercel/project.json` by `vercel link` or `vercel
pull`. The `.vercel` directory is ignored and must not be committed. Never put
these values in a `VITE_` variable because every `VITE_` value is public in the
browser bundle.

## Public frontend environment

`VITE_API_URL` is optional and public:

- unset or blank: use the interactive demo adapter and browser storage
- set to an HTTPS origin: use the documented REST project endpoints

If the API is on another origin, add that exact origin to the CSP `connect-src`
directive in `vercel.json` and retest the deployed application. Credentials,
signing keys, supplier secrets, and identity-provider secrets belong in the
server or deployment secret store, never the frontend bundle.

## Manual deployment

Use the automated workflow for normal releases. For an initial project link or
an emergency verified deployment:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e
pnpm run build
vercel --prod
```

## Production verification

After deployment:

1. Open `/projects` directly and refresh to verify the SPA rewrite.
2. Open a project detail URL directly.
3. Confirm demo projects load and creation persists within that browser.
4. Exercise mock sign-in, viewer and engineer roles, expiry, logout, and the
   forbidden view.
5. Inspect the response headers for CSP, frame protection, MIME protection,
   referrer policy, and permissions policy.
6. Run a focused accessibility and responsive review against the public URL.

## Rollback

Vercel retains immutable deployments. If a release regresses, promote the last
known-good deployment in Vercel and fix forward through a new pull request. Do
not bypass CI by deploying an unverified local working tree.
