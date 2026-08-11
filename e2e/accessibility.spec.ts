import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { installProjectsApi } from "./support/projectsApi";

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(" ")}: ${node.failureSummary}`)
          .join("\n")}`,
    )
    .join("\n\n");
}

async function expectNoAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  label: string,
) {
  const results = await new AxeBuilder({ page }).analyze();

  await testInfo.attach(`axe-${label}`, {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  expect(
    results.violations.length,
    formatViolations(results.violations),
  ).toBe(0);
}

test("dashboard has no automatically detectable accessibility violations", async ({
  page,
}, testInfo) => {
  await installProjectsApi(page);
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "Order control tower" }),
  ).toBeVisible();

  await expectNoAccessibilityViolations(page, testInfo, "dashboard");
});

test("new-order form and validation errors remain accessible", async ({
  page,
}, testInfo) => {
  await installProjectsApi(page);
  await page.goto("/projects");
  await page.getByRole("button", { name: "New order" }).click();

  const dialog = page.getByRole("dialog", { name: "Create an order tracker" });
  await expect(dialog.getByRole("textbox", { name: "Customer" })).toBeFocused();
  await expectNoAccessibilityViolations(page, testInfo, "new-order-dialog");

  await dialog.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Enter the customer name.")).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Customer" })).toBeFocused();
  await expectNoAccessibilityViolations(page, testInfo, "form-errors");
});

test("notifications trap focus and restore it to the trigger", async ({
  page,
}, testInfo) => {
  await installProjectsApi(page);
  await page.goto("/projects");

  const trigger = page.getByRole("button", { name: /Open notifications/ });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Notifications" });
  const closeButton = dialog.getByRole("button", { name: "Close notifications" });
  const markAllButton = dialog.getByRole("button", { name: "Mark all as read" });
  await expect(closeButton).toBeFocused();
  await expectNoAccessibilityViolations(page, testInfo, "notifications");

  await page.keyboard.press("Shift+Tab");
  await expect(markAllButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("route changes move focus and preserve accessible navigation", async ({
  page,
}, testInfo) => {
  await installProjectsApi(page);
  await page.goto("/projects?q=Apex&status=Blocked");

  await page
    .getByRole("button", { name: "Open Apex Mobility order tracker" })
    .click();
  await expect(page).toHaveURL(/\/projects\/ord-apex$/);
  await expect(page.locator("#main-content")).toBeFocused();
  await expectNoAccessibilityViolations(page, testInfo, "project-detail");

  await page.getByRole("button", { name: /Back to orders/ }).click();
  await expect(page).toHaveURL(/\/projects\?q=Apex&status=Blocked$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("service errors and not-found routes expose accessible recovery", async ({
  page,
}, testInfo) => {
  await installProjectsApi(page, { getFailures: 2 });
  await page.goto("/projects");

  const alert = page.getByRole("alert").filter({
    hasText: "load the order portfolio",
  });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expectNoAccessibilityViolations(page, testInfo, "service-error");

  await page.goto("/route-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: /That FlowOps page.*here/ }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page, testInfo, "not-found");
});
