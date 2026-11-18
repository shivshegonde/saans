/**
 * Clock Port.
 * Injected into all core engines and services to ensure determinism and zero hidden I/O.
 */
export interface Clock {
  now(): Date;
  nowIso(): string;
  nowMs(): number;
}
