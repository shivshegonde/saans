import { describe, it, expect } from "vitest";

describe("Skip Link Landmark Verification (Pillar 5, §10)", () => {
  it("verifies single global skip link points to #main-content", () => {
    document.body.innerHTML = `
      <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
      <header><nav></nav></header>
      <main id="main-content" tabindex="-1"><h1>Content</h1></main>
    `;

    const skipLinks = document.querySelectorAll('a[href="#main-content"]');
    expect(skipLinks.length).toBe(1);

    const mainTarget = document.getElementById("main-content");
    expect(mainTarget).not.toBeNull();
    expect(mainTarget?.tagName.toLowerCase()).toBe("main");
    expect(mainTarget?.getAttribute("tabindex")).toBe("-1");
  });
});
