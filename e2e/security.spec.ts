import { expect, test, type Page } from "@playwright/test";
import { installProjectsApi } from "./support/projectsApi";

async function useIdentity(page: Page, identityId: string) {
  await page.addInitScript((selectedIdentity) => {
    window.sessionStorage.setItem(
      "flowops-mock-auth-session",
      JSON.stringify({
        status: "authenticated",
        identityId: selectedIdentity,
        expiresAt: Date.now() + 30 * 60 * 1000,
      }),
    );
  }, identityId);
}

async function openSecurityMenu(page: Page) {
  await page.locator('summary[aria-label="Security demo options"]').click();
}

test("protects routes and provides password-free mock sign in", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects");
  await openSecurityMenu(page);
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Sign in required" })).toBeVisible();
  await expect(page.getByText("No passwords or real credentials are stored.")).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);

  await page.goto("/projects/ord-apex");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByRole("button", { name: /Taylor Brooks/ }).click();
  await expect(page).toHaveURL(/\/projects\/ord-apex$/);
});

test("viewer receives a read-only interface", async ({ page }) => {
  await useIdentity(page, "demo-viewer");
  await installProjectsApi(page);
  await page.goto("/projects");

  await expect(page.getByText("Read-only portfolio")).toBeVisible();
  await expect(page.getByRole("button", { name: "New order" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open Apex Mobility order tracker" }).click();
  await expect(page.getByRole("button", { name: "Edit details" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Log issue/ })).toHaveCount(0);
  await expect(page.getByText(/Read-only access/)).toBeVisible();
});

test("engineer can update delivery but cannot create or edit projects", async ({
  page,
}) => {
  await useIdentity(page, "demo-engineer");
  await installProjectsApi(page);
  await page.goto("/projects/ord-northstar");

  await expect(page.getByRole("button", { name: "Edit details" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Log issue/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Complete milestone → Activation" }),
  ).toBeVisible();

  await page.goto("/projects");
  await expect(page.getByRole("button", { name: "New order" })).toHaveCount(0);
});

test("expires and resumes a mock session without losing the intended route", async ({
  page,
}) => {
  await installProjectsApi(page);
  await page.goto("/projects?q=Apex");
  await openSecurityMenu(page);
  await page.getByRole("button", { name: "Expire session" }).click();

  await expect(page).toHaveURL(/\/session-expired$/);
  await expect(
    page.getByRole("heading", { name: "Your session has expired" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Resume as Jordan Lee/ }).click();
  await expect(page).toHaveURL(/\/projects\?q=Apex$/);
});

test("maps API 401 and 403 responses to controlled security states", async ({
  page,
}) => {
  await installProjectsApi(page, { getStatus: 401 });
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/session-expired$/);

  const forbiddenPage = await page.context().newPage();
  await useIdentity(forbiddenPage, "demo-admin");
  await installProjectsApi(forbiddenPage, { getStatus: 403 });
  await forbiddenPage.goto("/projects");
  await expect(forbiddenPage).toHaveURL(/\/forbidden$/);
  await expect(
    forbiddenPage.getByRole("heading", {
      name: "This action is outside your permissions",
    }),
  ).toBeVisible();
  await expect(forbiddenPage.getByText("Your role cannot complete this request.")).toBeVisible();
});
