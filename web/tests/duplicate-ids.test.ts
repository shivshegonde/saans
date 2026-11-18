import { describe, it, expect } from "vitest";

describe("No Duplicate IDs Invariant (§10)", () => {
  it("verifies rendered DOM contains zero duplicate HTML id attributes", () => {
    document.body.innerHTML = `
      <header>
        <select id="language-select"></select>
      </header>
      <main id="main-content" tabindex="-1">
        <section id="hero-section">
          <input id="distance-slider" type="range" />
          <input id="mask-hours-slider" type="range" />
        </section>
        <section id="simulator-section">
          <input id="sim-time-slider" type="range" />
          <input id="area-input" type="range" />
          <input id="ceiling-input" type="range" />
          <select id="ach-select"></select>
        </section>
      </main>
      <footer></footer>
    `;

    const allElementsWithId = document.querySelectorAll("[id]");
    const idSet = new Set<string>();
    const duplicateIds: string[] = [];

    allElementsWithId.forEach((el) => {
      const id = el.id;
      if (idSet.has(id)) {
        duplicateIds.push(id);
      } else {
        idSet.add(id);
      }
    });

    expect(duplicateIds).toEqual([]);
  });
});
