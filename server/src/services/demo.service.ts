import { FakeClock } from "../adapters/fakeClock.js";
import { ScenarioProvider } from "../adapters/scenarioProvider.js";
import { AlertService } from "./alert.service.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import { AuthService } from "./auth.service.js";

export class DemoService {
  constructor(
    private clock: FakeClock,
    private scenarioProvider: ScenarioProvider,
    private alertService: AlertService,
    private auditRepo: AuditRepository,
    private authService: AuthService,
  ) {}

  switchScenario(scenario: "Clean" | "Moderate" | "Poor" | "Severe" | "Hazardous"): void {
    this.scenarioProvider.setScenario(scenario);
  }

  timeTravel(minutes: number): Date {
    if (minutes === 0) {
      this.clock.reset();
    } else {
      this.clock.advanceMinutes(minutes);
    }
    return this.clock.now();
  }

  async triggerSevereSmog(
    householdId: string,
  ): Promise<{ scenario: string; alertsGenerated: number }> {
    this.scenarioProvider.setScenario("Severe");
    const alerts = await this.alertService.evaluateAlertsForHousehold(householdId);
    return { scenario: "Severe", alertsGenerated: alerts.length };
  }

  async triggerGraceTimeout(): Promise<{ escalatedCount: number }> {
    this.clock.advanceMinutes(31);
    const escalations = await this.alertService.checkEscalations(30);
    return { escalatedCount: escalations.length };
  }
}
