# Performance baseline and optimisation

## Method

Measurements use the compiled Vite production build and Playwright's managed
Chromium browser. The harness opens five fresh browser contexts, serves the same
local project fixture, and reports the median so one cold-start outlier does not
define the result.

Each run measures:

- Time until the managed service orders table is ready
- Search response after entering `Apex`
- Navigation time from the filtered table to the project detail heading
- Initial JavaScript and CSS transfer size
- DOM content loaded and load event timing
- Cumulative layout shift and browser long tasks
- Raw and gzip sizes for every generated JavaScript and CSS asset

These localhost results are comparative engineering measurements, not field
Core Web Vitals. Real-user monitoring is still required after deployment.

## Identified bottleneck

The baseline shipped the dashboard, project detail view, multi-step project
form, and notification centre in one 371.5 KB JavaScript file. Search, layout
stability, and long-task results were already healthy, so no work was applied to
those areas.

The optimisation uses interaction-level dynamic imports:

- Project form code loads when create or edit is requested
- Notification centre code loads when the notification panel is opened
- The data/query shell and dashboard remain in the initial route

Route-level project-detail splitting was measured but rejected because it
regressed the existing component-test router. Keeping the tested routing
contract was more valuable than the additional 8.4 KB raw chunk reduction.

## Before and after

| Measurement | Baseline | Optimised | Change |
| --- | ---: | ---: | ---: |
| Initial JavaScript | 371.5 KB | 360.1 KB | -11.4 KB (-3.1%) |
| Initial JavaScript gzip | 116.0 KB | 113.2 KB | -2.8 KB (-2.4%) |
| Initial script/style transfer | 125.2 KB | 122.4 KB | -2.8 KB (-2.2%) |
| Dashboard ready median | 257.2 ms | 270.0 ms | +12.8 ms (+5.0%) |
| Search response median | 21.9 ms | 23.9 ms | +2.0 ms (+9.1%) |
| Project detail ready median | 116.5 ms | 101.1 ms | -15.4 ms (-13.2%) |
| DOM content loaded median | 124.3 ms | 131.6 ms | +7.3 ms (+5.9%) |
| Cumulative layout shift median | 0 | 0 | No change |
| Long tasks median | 0 | 0 | No change |

The small local timing movements are within normal run-to-run variance and are
not presented as user-perceived speed gains. The reliable improvement is the
smaller initial payload, while search, detail navigation, layout stability, and
long-task behaviour remain effectively unchanged.

The complete samples are stored in `performance/baseline.json` and
`performance/after.json`.

## Reproduce the measurement

Build with the REST path used by the deterministic fixture and start a preview:

```bash
VITE_API_URL=/api pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 4190 --strictPort
```

In a second terminal:

```bash
PERFORMANCE_LABEL="local check" \
PERFORMANCE_OUTPUT="performance/local.json" \
pnpm run measure:performance
```

On PowerShell, set the environment variables with `$env:NAME = "value"`
before running the same command.
