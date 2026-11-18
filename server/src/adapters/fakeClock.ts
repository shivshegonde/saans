import { Clock } from "../core/ports/clock.js";

export class FakeClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date | string = "2026-11-18T08:00:00.000Z") {
    this.currentTime =
      typeof initialTime === "string" ? new Date(initialTime) : new Date(initialTime.getTime());
  }

  now(): Date {
    return new Date(this.currentTime.getTime());
  }

  nowIso(): string {
    return this.currentTime.toISOString();
  }

  nowMs(): number {
    return this.currentTime.getTime();
  }

  advanceMinutes(minutes: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
  }

  advanceHours(hours: number): void {
    this.advanceMinutes(hours * 60);
  }

  advanceDays(days: number): void {
    this.advanceHours(days * 24);
  }

  reset(): void {
    this.currentTime = new Date("2026-11-18T08:00:00.000Z");
  }

  setTime(newTime: Date | string): void {
    this.currentTime =
      typeof newTime === "string" ? new Date(newTime) : new Date(newTime.getTime());
  }
}
