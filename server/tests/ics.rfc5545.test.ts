import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { generateIcsCalendar, escapeIcsText, foldLine, CalendarEvent } from "../src/core/ics.js";

describe("RFC 5545 iCalendar Generator (ics.rfc5545.test)", () => {
  it("generates valid calendar with proper CRLF endings and VEVENT blocks", () => {
    const events: CalendarEvent[] = [
      {
        uid: "saans-window-1234@saans.app",
        summary: "Clean Air Ventilation Window",
        description:
          "Outdoor PM2.5 dips to approximately 45 µg/m³ during midday solar mixing. Aerate all living rooms and bedrooms for 20 minutes before afternoon smog re-accumulates.",
        startIso: "2026-11-18T13:00:00Z",
        endIso: "2026-11-18T14:00:00Z",
        location: "Home Residence, Delhi-NCR",
        url: "https://saans.app/plan",
      },
    ];

    const ics = generateIcsCalendar(events);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:saans-window-1234@saans.app");
    expect(ics).toContain("DTSTART:20261118T130000Z");
    expect(ics).toContain("DTEND:20261118T140000Z");
    expect(ics).toContain("LOCATION:Home Residence\\, Delhi-NCR");
    expect(ics).toContain("URL:https://saans.app/plan");
  });

  it("escapes special characters correctly", () => {
    const raw = "Special, chars; with \\ backslash and\nnewline";
    const escaped = escapeIcsText(raw);
    expect(escaped).toBe("Special\\, chars\\; with \\\\ backslash and\\nnewline");
  });

  it("folds long lines exceeding 75 octets with CRLF space continuation", () => {
    const longLine =
      "DESCRIPTION:This is a very long line designed to exceed the seventy-five octet limit mandated by RFC 5545 Section 3.1.";
    const folded = foldLine(longLine);
    expect(folded).toContain("\r\n ");
  });

  // Property-based test with fast-check
  it("guarantees 75-octet folding limit on arbitrary long strings (fast-check property)", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 500 }), (text) => {
        const folded = foldLine(text);
        const lines = folded.split("\r\n");

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]!;
          const byteLen = Buffer.byteLength(l, "utf-8");
          expect(byteLen).toBeLessThanOrEqual(75);
          if (i > 0) {
            expect(l.startsWith(" ")).toBe(true);
          }
        }
      }),
    );
  });
});
