/**
 * RFC 5545 iCalendar (.ics) Generator.
 *
 * Implements strict RFC 5545 formatting:
 * 1. CRLF line endings (\r\n) on all lines.
 * 2. 75-octet line folding with leading space continuation.
 * 3. Text escaping for commas, semicolons, backslashes, and newlines.
 * 4. Unique UID and valid UTC timestamps (YYYYMMDDTHHMMSSZ).
 */

export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  location?: string;
  url?: string;
}

/**
 * Escapes characters per RFC 5545 Section 3.3.11.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Formats a Date or ISO string into UTC iCalendar format (YYYYMMDDTHHMMSSZ).
 */
export function formatIcsDate(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Folds a single line into 75-octet segments per RFC 5545 Section 3.1.
 */
export function foldLine(line: string): string {
  const maxOctets = 75;
  const buffer = Buffer.from(line, "utf-8");

  if (buffer.length <= maxOctets) {
    return line;
  }

  const parts: string[] = [];
  let currentBytes = 0;
  let currentStr = "";
  let isFirstLine = true;

  for (const char of line) {
    const charBytes = Buffer.byteLength(char, "utf-8");
    const limit = isFirstLine ? maxOctets : maxOctets - 1; // continuation lines start with a space

    if (currentBytes + charBytes > limit) {
      parts.push(currentStr);
      currentStr = char;
      currentBytes = charBytes;
      isFirstLine = false;
    } else {
      currentStr += char;
      currentBytes += charBytes;
    }
  }

  if (currentStr.length > 0) {
    parts.push(currentStr);
  }

  return parts.join("\r\n ");
}

/**
 * Generates an RFC 5545 VCALENDAR document containing the given events.
 */
export function generateIcsCalendar(
  events: CalendarEvent[],
  prodId = "-//Saans//Air Quality Assistant//EN",
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const nowStamp = formatIcsDate(new Date().toISOString());

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${formatIcsDate(event.startIso)}`);
    lines.push(`DTEND:${formatIcsDate(event.endIso)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);

    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // Apply 75-octet folding and CRLF joining
  return lines.map((l) => foldLine(l)).join("\r\n") + "\r\n";
}
