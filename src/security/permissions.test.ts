import { describe, expect, it } from "vitest";
import { getIdentity, hasPermission } from "./permissions";

describe("frontend permission contract", () => {
  it("allows admin and operations roles to create and edit projects", () => {
    for (const identityId of ["demo-admin", "demo-operations"]) {
      const identity = getIdentity(identityId);
      expect(hasPermission(identity, "project:create")).toBe(true);
      expect(hasPermission(identity, "project:edit")).toBe(true);
      expect(hasPermission(identity, "delivery:update")).toBe(true);
    }
  });

  it("limits engineers to delivery updates", () => {
    const engineer = getIdentity("demo-engineer");
    expect(hasPermission(engineer, "project:create")).toBe(false);
    expect(hasPermission(engineer, "project:edit")).toBe(false);
    expect(hasPermission(engineer, "delivery:update")).toBe(true);
  });

  it("keeps viewers read only", () => {
    const viewer = getIdentity("demo-viewer");
    expect(hasPermission(viewer, "project:create")).toBe(false);
    expect(hasPermission(viewer, "project:edit")).toBe(false);
    expect(hasPermission(viewer, "delivery:update")).toBe(false);
  });
});
