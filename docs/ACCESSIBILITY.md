# Saans Accessibility (a11y) Architecture & Compliance

## 1. Compliance Standard: WCAG 2.2 Level AA

**Saans** is architected to guarantee full accessibility for users with visual, motor, and cognitive impairments, with specialized accommodations for low-vision elders and outdoor commuters viewing screens in high-glare winter conditions.

---

## 2. Core Accessibility Accommodations

### 2.1 High-Contrast Mode (`html[data-contrast="high"]`)

- Activated via the quick toggle in the global navigation bar.
- Replaces translucent gradients with pure black backgrounds (`#000000`), vivid yellow borders (`#facc15`, 2px solid), and maximum-contrast white foreground text (`#ffffff`).
- Verified contrast ratios exceed **15:1** (far exceeding the 7:1 WCAG AAA requirement).
- Verified via `web/tests/contrast.test.ts` and `web/tests/highContrast.test.ts`.

### 2.2 Root `rem` Font Scaler (100% / 120% / 140%)

- Users can scale all UI typography to **120%** or **140%** without zooming the entire browser window or breaking horizontal layout constraints.
- Scaler dynamically updates `document.documentElement.style.fontSize` with zero flash of unstyled text.
- Tested and verified via `web/tests/fontScaler.test.ts`.

### 2.3 Global Skip Link

- Placed as the first navigable DOM element: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`.
- Allows keyboard and screen-reader users to bypass navigation tabs and hero banners directly to active content.
- Tested and verified via `web/tests/skipLink.test.ts`.

### 2.4 Accessible Modals & Focus Management

- Modals (`AskSaansSheet`, `ShareCardModal`, `CalculationDrawer`) use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- Traps keyboard focus inside the active dialog, returning focus to the trigger button upon dismissal.
- Tested and verified via `web/tests/modal.a11y.test.ts`.

### 2.5 Zero Duplicate Element IDs

- Every interactive form control, slider, and disclosure is assigned a unique DOM ID.
- Tested and verified via `web/tests/duplicate-ids.test.ts`.

---

## 3. Multilingual Typography & Devanagari Fallbacks

To ensure seamless readability across English, Hindi, and Marathi:

- System fonts fall back gracefully: `Inter, -apple-system, BlinkMacSystemFont, "Noto Sans Devanagari", "Segoe UI", sans-serif`.
- All line heights and padding accommodate vertical conjunct glyphs (e.g. क्ष, त्र, ज्ञ) without clipping ascenders or descenders.
