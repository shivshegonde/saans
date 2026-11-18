import { Clock } from "../core/ports/clock.js";
import { AirQualityProvider } from "../core/ports/airProvider.js";
import { HouseholdRepository } from "../repositories/ports/householdRepo.js";
import { OutboxRepository } from "../repositories/ports/outboxRepo.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import { OutboxItemDto } from "shared";

export class AlertService {
  constructor(
    private householdRepo: HouseholdRepository,
    private outboxRepo: OutboxRepository,
    private auditRepo: AuditRepository,
    private airProvider: AirQualityProvider,
    private clock: Clock,
  ) {}

  async evaluateAlertsForHousehold(householdId: string): Promise<OutboxItemDto[]> {
    const household = await this.householdRepo.getHousehold(householdId);
    if (!household) return [];

    const pref = (await this.householdRepo.getAlertPreference(householdId)) ?? {
      householdId,
      enabled: true,
      aqiThreshold: 200,
      deliveryChannel: "email",
      coGuardianConsent: false,
    };

    if (!pref.enabled) return [];

    const forecast = await this.airProvider.getForecast(household.location, 24);
    const hours =
      forecast.hours ||
      (forecast as unknown as { series: Array<{ aqi: number; time: string; category: string }> })
        .series ||
      [];
    const severeSpikes = hours.filter((s) => s.aqi >= pref.aqiThreshold);
    if (severeSpikes.length === 0) return [];

    const spike = severeSpikes[0];
    if (!spike) return [];

    const spikeTime = "timeIso" in spike ? spike.timeIso : (spike as { time: string }).time;
    const idempotencyKey = `alert_${householdId}_${spikeTime.split("T")[0]}`;
    const now = this.clock.now();

    const item = await this.outboxRepo.create({
      tenantId: householdId,
      entityId: `spike_${spikeTime}`,
      eventType: "SMOG_ALERT",
      channel: pref.deliveryChannel,
      recipient: `household-${householdId}@saans.local`,
      subject: `[Saans Smog Alert] AQI forecast to reach ${spike.aqi} (${spike.category})`,
      body: `Air quality at ${household.location.name} is forecast to reach AQI ${spike.aqi} (${spike.category}) around ${spikeTime}. Please seal windows and pre-run your purifier.`,
      idempotencyKey,
      scheduledFor: now.toISOString(),
    });

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: "system",
      action: "ALERT_TRIGGERED",
      entityType: "OUTBOX_ITEM",
      entityId: item.id,
      beforeSnapshot: null,
      afterSnapshot: { aqi: spike.aqi, category: spike.category, scheduledFor: now.toISOString() },
      correlationId: `alert-${item.id}`,
      at: now.toISOString(),
    });

    return [item];
  }

  async acknowledgeAlert(
    householdId: string,
    alertId: string,
    userId: string,
    correlationId = "system",
  ): Promise<void> {
    const now = this.clock.now();
    await this.outboxRepo.acknowledge(alertId, now);

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: userId,
      action: "ALERT_ACKNOWLEDGED",
      entityType: "OUTBOX_ITEM",
      entityId: alertId,
      beforeSnapshot: { acknowledged: false },
      afterSnapshot: { acknowledged: true, acknowledgedAt: now.toISOString() },
      correlationId,
      at: now.toISOString(),
    });
  }

  async checkEscalations(graceMinutes = 30): Promise<OutboxItemDto[]> {
    const now = this.clock.now();
    const graceCutoff = new Date(now.getTime() - graceMinutes * 60 * 1000);

    // List due items across outbox that have not been acknowledged
    const dueItems = await this.outboxRepo.findDueItems(now, 50);
    const escalated: OutboxItemDto[] = [];

    for (const item of dueItems) {
      if (
        item.eventType === "SMOG_ALERT" &&
        !item.acknowledgedAt &&
        new Date(item.scheduledFor).getTime() <= graceCutoff.getTime()
      ) {
        const pref = await this.householdRepo.getAlertPreference(item.tenantId);
        if (pref && pref.coGuardianConsent && pref.coGuardianEmail) {
          const escalationKey = `escalation_${item.id}_${item.tenantId}`;
          const escItem = await this.outboxRepo.create({
            tenantId: item.tenantId,
            entityId: item.entityId,
            eventType: "SMOG_ALERT_ESCALATION",
            channel: "email",
            recipient: pref.coGuardianEmail,
            subject: `[Saans Escalation] Unacknowledged Smog Alert for Household`,
            body: `An AQI alert sent 30 minutes ago has not been acknowledged by the primary guardian. Escalating: ${item.subject}`,
            idempotencyKey: escalationKey,
            scheduledFor: now.toISOString(),
          });
          escalated.push(escItem);
        }
      }
    }

    return escalated;
  }
}
