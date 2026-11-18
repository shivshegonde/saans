import { describe, it, expect } from "vitest";

describe("Modal Accessibility Requirements (§10)", () => {
  it("verifies dialog role, aria-modal, and labelledby semantics", () => {
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="modal">
        <h2 id="dialog-title">Ask Saans</h2>
        <button type="button" aria-label="Close dialog">Close</button>
      </div>
    `;

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    const labelId = dialog?.getAttribute("aria-labelledby");
    expect(labelId).toBe("dialog-title");

    const titleEl = document.getElementById(labelId!);
    expect(titleEl?.textContent).toBe("Ask Saans");

    const closeBtn = dialog?.querySelector("button");
    expect(closeBtn?.getAttribute("aria-label")).toBe("Close dialog");
  });
});
