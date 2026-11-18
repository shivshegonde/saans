import { describe, it, expect } from "vitest";

// Relative luminance formula per WCAG 2.2
function getLuminance(hex: string): number {
  const rgb = hex.replace("#", "");
  const r = parseInt(rgb.substring(0, 2), 16) / 255;
  const g = parseInt(rgb.substring(2, 4), 16) / 255;
  const b = parseInt(rgb.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Contrast Verification (Pillar 5, WCAG 2.2 AA)", () => {
  it("verifies standard UI text on surface meets WCAG AA (>= 4.5:1)", () => {
    // Slate 900 text (#0f172a) on white surface (#ffffff)
    const ratio = getContrastRatio("#0f172a", "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThanOrEqual(15);
  });

  it("verifies muted secondary text on white meets WCAG AA (>= 4.5:1)", () => {
    // Slate 600 (#475569) on white (#ffffff)
    const ratio = getContrastRatio("#475569", "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("verifies high-contrast mode tokens meet WCAG AAA (>= 7:1)", () => {
    // High contrast: Pure White (#ffffff) on Pitch Black (#000000)
    const whiteOnBlack = getContrastRatio("#ffffff", "#000000");
    expect(whiteOnBlack).toBeGreaterThanOrEqual(7.0);
    expect(whiteOnBlack).toBeCloseTo(21.0, 0);

    // High contrast yellow accent (#fef08a) on pitch black (#000000)
    const yellowOnBlack = getContrastRatio("#fef08a", "#000000");
    expect(yellowOnBlack).toBeGreaterThanOrEqual(7.0);

    // Input border high-contrast yellow (#facc15) on black (#000000)
    const borderOnBlack = getContrastRatio("#facc15", "#000000");
    expect(borderOnBlack).toBeGreaterThanOrEqual(7.0);
  });

  it("verifies severe AQI badge text contrast", () => {
    // Dark rose text (#881337) on rose-100 bg (#ffe4e6)
    const ratio = getContrastRatio("#881337", "#ffe4e6");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
