// Vitest setup: jest-dom matchers, per-test DOM cleanup, and shared polyfills.

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
