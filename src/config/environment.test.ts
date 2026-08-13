import { describe, expect, it } from "vitest";
import { findUnsafeClientVariables } from "./environment";

describe("client environment configuration", () => {
  it("allows public client configuration", () => {
    expect(
      findUnsafeClientVariables({
        VITE_API_URL: "https://api.example.com",
        MODE: "test",
      }),
    ).toEqual([]);
  });

  it("rejects secret-like Vite variables", () => {
    expect(
      findUnsafeClientVariables({
        VITE_API_SECRET: "unsafe",
        VITE_ACCESS_TOKEN: "unsafe",
        VITE_PRIVATE_KEY: "unsafe",
      }),
    ).toEqual([
      "VITE_API_SECRET",
      "VITE_ACCESS_TOKEN",
      "VITE_PRIVATE_KEY",
    ]);
  });
});
