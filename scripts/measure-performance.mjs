import { gzipSync } from "node:zlib";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { chromium } from "@playwright/test";

const runs = 5;
const baseURL = process.env.PERFORMANCE_BASE_URL ?? "http://127.0.0.1:4190";
const label = process.env.PERFORMANCE_LABEL ?? "measurement";
const outputPath = process.env.PERFORMANCE_OUTPUT;
const projectFixture = JSON.parse(
  await readFile(resolve("public/projects.json"), "utf8"),
);

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function round(value) {
  return Math.round(value * 10) / 10;
}

async function measureBundle() {
  const assetsDirectory = resolve("dist/assets");
  const assets = await readdir(assetsDirectory);
  const measuredAssets = [];

  for (const asset of assets) {
    if (!/\.(css|js)$/.test(asset)) continue;

    const path = resolve(assetsDirectory, asset);
    const contents = await readFile(path);
    const details = await stat(path);
    measuredAssets.push({
      file: basename(path),
      bytes: details.size,
      gzipBytes: gzipSync(contents).byteLength,
    });
  }

  return measuredAssets.sort((left, right) => right.bytes - left.bytes);
}

async function runScenario(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__flowOpsPerformance = { cumulativeLayoutShift: 0, longTasks: [] };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__flowOpsPerformance.cumulativeLayoutShift += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });

    new PerformanceObserver((list) => {
      window.__flowOpsPerformance.longTasks.push(
        ...list.getEntries().map((entry) => entry.duration),
      );
    }).observe({ type: "longtask", buffered: true });
  });

  await page.route(/\/api\/projects(?:\/[^/?]+)?(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(projectFixture),
    });
  });

  const dashboardStartedAt = performance.now();
  await page.goto(`${baseURL}/projects`, { waitUntil: "domcontentloaded" });
  await page.getByRole("table", { name: /Managed service orders/ }).waitFor();
  const dashboardReadyMs = performance.now() - dashboardStartedAt;
  const initialTransferBytes = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter(
        (entry) =>
          entry.initiatorType === "script" || entry.initiatorType === "link",
      )
      .reduce((total, entry) => total + entry.transferSize, 0),
  );

  const searchStartedAt = performance.now();
  await page.getByRole("searchbox", { name: "Search orders" }).fill("Apex");
  await page
    .getByRole("cell", { name: /High priority Apex Mobility/ })
    .waitFor();
  const searchResponseMs = performance.now() - searchStartedAt;

  const detailStartedAt = performance.now();
  await page.getByRole("button", { name: /Open Apex Mobility order tracker/ }).click();
  await page.getByRole("heading", { level: 1, name: "Apex Mobility" }).waitFor();
  const detailReadyMs = performance.now() - detailStartedAt;

  await page.waitForTimeout(100);
  const browserMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const collected = window.__flowOpsPerformance;

    return {
      domContentLoadedMs: navigation.domContentLoadedEventEnd,
      loadEventMs: navigation.loadEventEnd,
      cumulativeLayoutShift: collected.cumulativeLayoutShift,
      longTaskCount: collected.longTasks.length,
      longestTaskMs: Math.max(0, ...collected.longTasks),
    };
  });

  await context.close();

  return {
    dashboardReadyMs,
    searchResponseMs,
    detailReadyMs,
    initialTransferBytes,
    ...browserMetrics,
  };
}

const browser = await chromium.launch({ headless: true });
const samples = [];

try {
  for (let index = 0; index < runs; index += 1) {
    samples.push(await runScenario(browser));
  }
} finally {
  await browser.close();
}

const metricNames = Object.keys(samples[0]);
const medians = Object.fromEntries(
  metricNames.map((metric) => [
    metric,
    round(median(samples.map((sample) => sample[metric]))),
  ]),
);
const result = {
  label,
  generatedAt: new Date().toISOString(),
  environment: {
    runs,
    browser: "Playwright Chromium",
    build: "Vite production preview",
    api: "local deterministic fixture",
  },
  bundle: await measureBundle(),
  medians,
  samples: samples.map((sample) =>
    Object.fromEntries(
      Object.entries(sample).map(([metric, value]) => [metric, round(value)]),
    ),
  ),
};

const rendered = `${JSON.stringify(result, null, 2)}\n`;
process.stdout.write(rendered);

if (outputPath) {
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(resolve(outputPath), rendered, "utf8");
}
