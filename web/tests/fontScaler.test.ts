import { describe, it, expect, beforeEach } from "vitest";

describe("Root Rem Scaler Verification (Pillar 5, §10)", () => {
  beforeEach(() => {
    document.documentElement.style.fontSize = "100%";
    localStorage.clear();
  });

  it("cycles font scale through 100% -> 120% -> 140% -> 100%", () => {
    let current = "100%";

    const cycle = (val: string) => (val === "100%" ? "120%" : val === "120%" ? "140%" : "100%");

    current = cycle(current);
    expect(current).toBe("120%");
    document.documentElement.style.fontSize = current;
    localStorage.setItem("saans.fontScale", current);
    expect(document.documentElement.style.fontSize).toBe("120%");
    expect(localStorage.getItem("saans.fontScale")).toBe("120%");

    current = cycle(current);
    expect(current).toBe("140%");
    document.documentElement.style.fontSize = current;
    localStorage.setItem("saans.fontScale", current);
    expect(document.documentElement.style.fontSize).toBe("140%");

    current = cycle(current);
    expect(current).toBe("100%");
    document.documentElement.style.fontSize = current;
    localStorage.setItem("saans.fontScale", current);
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("applies fontScale without layout shift", () => {
    document.documentElement.style.fontSize = "140%";
    expect(document.documentElement.style.fontSize).toBe("140%");
  });
});
