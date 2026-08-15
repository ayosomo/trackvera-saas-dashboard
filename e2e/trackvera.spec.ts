import { expect, test, type Page } from "@playwright/test";
import { installProjectsApi } from "./support/projectsApi";

interface ProjectFormInput {
  customer: string;
  name: string;
  product: string;
  site: string;
  thirdParty: string;
  supplier: string;
  crfReference: string;
  thirdPartyReference?: string;
  supplierReference?: string;
  owner: string;
  salesOwner: string;
  dueDate: string;
  monthlyValue: string;
}

const newOrder: ProjectFormInput = {
  customer: "Ridgeway Logistics",
  name: "Warehouse connectivity rollout",
  product: "Managed Ethernet and 5G backup",
  site: "Midlands distribution estate",
  thirdParty: "ChannelLink",
  supplier: "BT Business",
  crfReference: "CRF-260810-001",
  thirdPartyReference: "CL-901144",
  supplierReference: "BT-778812",
  owner: "Jordan Lee",
  salesOwner: "Alex Morgan",
  dueDate: "2026-11-30",
  monthlyValue: "16400",
};

async function completeCreateForm(page: Page, input: ProjectFormInput) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Customer" }).fill(input.customer);
  await dialog.getByLabel("Order / project name").fill(input.name);
  await dialog.getByLabel("Product or service").fill(input.product);
  await dialog.getByLabel("Delivery site or scope").fill(input.site);
  await dialog.getByRole("button", { name: /Continue/ }).click();

  await dialog.getByLabel("Third-party ordering partner").fill(input.thirdParty);
  await dialog.getByLabel("Fulfilment supplier").fill(input.supplier);
  await dialog.getByLabel("CRF reference").fill(input.crfReference);
  if (input.thirdPartyReference) {
    await dialog
      .getByLabel("Third-party order reference")
      .fill(input.thirdPartyReference);
  }
  if (input.supplierReference) {
    await dialog
      .getByLabel("Supplier portal reference")
      .fill(input.supplierReference);
  }
  await dialog.getByRole("button", { name: /Continue/ }).click();

  await dialog.getByLabel("MSP order owner").fill(input.owner);
  await dialog.getByLabel("Sales owner").fill(input.salesOwner);
  await dialog.getByRole("textbox", { name: "Target live date" }).fill(input.dueDate);
  await dialog.getByLabel(/Monthly contract value/).fill(input.monthlyValue);
}

async function moveEditorToOwnershipStep(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Continue/ }).click();
  await dialog.getByRole("button", { name: /Continue/ }).click();
}

test("loads and explores the order portfolio with URL-backed controls", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects");

  await expect(
    page.getByRole("heading", { name: "Order control tower" }),
  ).toBeVisible();
  await expect(page.getByText("7 orders", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: /Managed service orders/ })
      .getByRole("row"),
  ).toHaveCount(6);

  await page.getByRole("searchbox", { name: "Search orders" }).fill("Apex");
  await expect(page).toHaveURL(/\/projects\?q=Apex$/);
  await expect(page.getByRole("row", { name: /Apex Mobility/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Northstar Health/ })).toHaveCount(0);

  await page.getByLabel("Filter by status").selectOption("Blocked");
  await expect(page).toHaveURL(/q=Apex&status=Blocked/);
  await expect(page.getByText("1 order", { exact: true })).toBeVisible();

  await page.getByRole("searchbox", { name: "Search orders" }).fill("");
  await page.getByLabel("Filter by status").selectOption("All statuses");
  await page.getByLabel("Sort orders by").selectOption("monthlyValue");
  await expect(page).toHaveURL(/sort=monthlyValue/);
  await expect(page.getByText("7 orders", { exact: true })).toBeVisible();
  const nextPageButton = page.getByRole("button", { name: /Next/ });
  await expect(nextPageButton).toBeEnabled();
  await nextPageButton.click();
  await expect(page).toHaveURL(/sort=monthlyValue&page=2/);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
});

test("opens a project detail route and restores filters on return", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects?q=Apex&status=Blocked");

  await page
    .getByRole("button", { name: "Open Apex Mobility order tracker" })
    .click();
  await expect(page).toHaveURL(/\/projects\/ord-apex$/);
  await expect(page.getByRole("heading", { name: "Apex Mobility" })).toBeVisible();
  await expect(page.getByText("Stage 5 of 8")).toBeVisible();
  await expect(page.getByText("Who owns what?")).toBeVisible();

  await page.getByRole("button", { name: /Back to orders/ }).click();
  await expect(page).toHaveURL(/\/projects\?q=Apex&status=Blocked$/);
  await expect(page.getByRole("searchbox", { name: "Search orders" })).toHaveValue(
    "Apex",
  );
  await expect(page.getByLabel("Filter by status")).toHaveValue("Blocked");
});

test("creates an order through the complete three-step journey", async ({
  page,
}) => {
  const api = await installProjectsApi(page, { mutationDelayMs: 450 });
  await page.goto("/projects");

  await page.getByRole("button", { name: "New order" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create an order tracker" }),
  ).toBeVisible();
  await completeCreateForm(page, newOrder);

  await page.getByRole("button", { name: "Create order tracker" }).click();
  await expect(page.getByRole("button", { name: /Creating tracker/ })).toBeDisabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "Ridgeway Logistics tracker is ready",
  );

  await page
    .getByRole("searchbox", { name: "Search orders" })
    .fill("Ridgeway Logistics");
  await expect(
    page.getByRole("row", { name: /Ridgeway Logistics/ }),
  ).toBeVisible();
  expect(api.projects().find((project) => project.customer === newOrder.customer)).toMatchObject({
    owner: "Jordan Lee",
    currentStage: "supplier-order",
  });
});

test("edits an existing order and reconciles the saved response", async ({
  page,
}) => {
  const api = await installProjectsApi(page);
  await page.goto("/projects/ord-northstar");

  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(
    page.getByRole("dialog", { name: "Edit Northstar Health" }),
  ).toBeVisible();
  await page
    .getByLabel("Order / project name")
    .fill("Clinical network modernisation");
  await moveEditorToOwnershipStep(page);
  await page.getByLabel("MSP order owner").fill("Jordan Lee");
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Target live date" })
    .fill("2026-09-15");
  await page.getByRole("button", { name: "Save project changes" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Northstar Health was updated successfully",
  );
  await expect(page.locator(".tracker-meta")).toContainText("Jordan Lee");
  expect(api.projects().find((project) => project.id === "ord-northstar")).toMatchObject({
    owner: "Jordan Lee",
    name: "Clinical network modernisation",
    dueDate: "2026-09-15",
  });
});

test("rolls an optimistic edit back when the mutation fails", async ({ page }) => {
  const api = await installProjectsApi(page, {
    updateFailures: 1,
    mutationDelayMs: 400,
  });
  await page.goto("/projects/ord-northstar");

  await page.getByRole("button", { name: "Edit details" }).click();
  await moveEditorToOwnershipStep(page);
  await page.getByLabel("MSP order owner").fill("Temporary Owner");
  await page.getByRole("button", { name: "Save project changes" }).click();
  await expect(page.getByRole("button", { name: /Saving changes/ })).toBeDisabled();
  await expect(page.getByText("Project changes not saved.")).toBeVisible();

  await page.getByRole("button", { name: "Close project editor" }).click();
  await expect(page.locator(".tracker-meta")).toContainText("Maya Chen");
  await expect(page.locator(".tracker-meta")).not.toContainText("Temporary Owner");
  expect(api.projects().find((project) => project.id === "ord-northstar")?.owner).toBe(
    "Maya Chen",
  );
});

test("shows an API failure and recovers through retry", async ({ page }) => {
  await installProjectsApi(page, { getFailures: 2 });
  await page.goto("/projects");

  const errorState = page.getByRole("alert").filter({
    hasText: "We couldn’t load the order portfolio",
  });
  await expect(errorState).toBeVisible({ timeout: 10_000 });
  await expect(errorState).toContainText("The service returned 500");
  await errorState.getByRole("button", { name: "Try again" }).click();

  await expect(
    page.getByRole("heading", { name: "Managed service orders" }),
  ).toBeVisible();
  await expect(page.getByText("7 orders", { exact: true })).toBeVisible();
});

test("provides recovery paths for missing projects and unknown routes", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects/not-a-real-order");

  await expect(
    page.getByRole("heading", { name: /This order tracker.*exist/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to orders" }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.goto("/route-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: /That Trackvera page.*here/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Return to control tower" }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("supports keyboard entry, validation, dismissal, and focus restoration", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Order control tower" })).toBeVisible();

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Open notifications/ })).toBeFocused();
  await page.keyboard.press("Tab");
  const newOrderButton = page.getByRole("button", { name: "New order" });
  await expect(newOrderButton).toBeFocused();
  await page.keyboard.press("Enter");

  const customerField = page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Customer" });
  await expect(customerField).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Enter the customer name.")).toBeVisible();
  await expect(customerField).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(newOrderButton).toBeFocused();
});
