import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import BarracksPage from "@/app/barracks/page";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));

describe("BarracksPage", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("redirects to /soldier", () => {
    expect(() => render(<BarracksPage />)).toThrow("NEXT_REDIRECT:/soldier");
    expect(redirect).toHaveBeenCalledWith("/soldier");
  });
});
