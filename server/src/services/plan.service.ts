import { Clock } from "../core/ports/clock.js";
import { AirQualityProvider, AirForecastResponse } from "../core/ports/airProvider.js";
import { HouseholdRepository } from "../repositories/ports/householdRepo.js";
import { AuditRepository } from "../repositories/ports/auditRepo.js";
import {
  buildDailyPlan,
  HouseholdContext,
  ActionCard as EngineActionCard,
} from "../core/planEngine.js";
import { generateIcsCalendar } from "../core/ics.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { TodayPlanResponse, ActionCard, HouseholdProfile } from "shared";

const SLOT_MAP: Record<string, "morning" | "afternoon" | "evening" | "night" | "allDay"> = {
  Morning: "morning",
  Afternoon: "afternoon",
  Evening: "evening",
  Night: "night",
};

function createHouseholdPlanContext(
  household: HouseholdProfile,
  currentAqi: number,
  forecast: AirForecastResponse,
): HouseholdContext {
  const sensitiveFlags = {
    child: household.members.some((m) => m.sensitiveFlags.child || m.ageGroup === "child"),
    olderAdult: household.members.some(
      (m) => m.sensitiveFlags.olderAdult || m.ageGroup === "olderAdult",
    ),
    respiratoryCondition: household.members.some((m) => m.sensitiveFlags.respiratoryCondition),
    pregnancy: household.members.some((m) => m.sensitiveFlags.pregnancy),
  };

  const hasPurifier = household.rooms.some((r) => r.hasPurifier && r.purifierCadrM3h > 0);
  const forecastHours =
    forecast.hours ||
    (forecast as unknown as { series: Array<{ aqi: number; pm25: number; time: string }> })
      .series ||
    [];

  return {
    currentAqi,
    hasChild: sensitiveFlags.child,
    hasElder: sensitiveFlags.olderAdult,
    hasRespiratoryCondition: sensitiveFlags.respiratoryCondition,
    hasPregnancy: sensitiveFlags.pregnancy,
    hasPurifier,
    purifierCadrM3h: household.rooms.find((r) => r.hasPurifier)?.purifierCadrM3h || 250,
    commuteMode: household.members[0]?.commuteMode ?? "metro",
    commuteDistanceKm: household.members[0]?.commuteDistanceKm ?? 10,
    cookingFuel: (household.cookingFuel === "electric"
      ? "induction_electric"
      : household.cookingFuel) as "biomass" | "lpg" | "induction_electric",
    forecastHours: forecastHours.map((s) => ({
      timeIso: "timeIso" in s ? s.timeIso : (s as { time: string }).time,
      pm25: s.pm25,
      aqi: s.aqi,
    })),
  };
}

function formatCards(generated: EngineActionCard[], completedSet: Set<string>): ActionCard[] {
  return generated.map((c) => ({
    id: c.id,
    ruleId: c.ruleId,
    title: c.headline,
    description: c.why,
    timeSlot: SLOT_MAP[c.slot] ?? "morning",
    recommendedTime: c.slot === "Morning" ? "07:00" : c.slot === "Afternoon" ? "13:00" : "19:00",
    why: c.why,
    impact: { healthExposureReductionPercent: 35, cityCo2eAvoidedKg: 1.2 },
    effort: c.effort,
    costBand: c.costBand,
    evidence: {
      level: c.evidenceLevel,
      sources: [
        {
          title: "CPCB Guidelines for Winter Smog Management",
          organisation: "Central Pollution Control Board",
          year: 2021,
        },
      ],
    },
    knowledgeIds: c.knowledgeIds,
    completed: completedSet.has(c.id),
  }));
}

export class PlanService {
  constructor(
    private householdRepo: HouseholdRepository,
    private auditRepo: AuditRepository,
    private airProvider: AirQualityProvider,
    private clock: Clock,
  ) {}

  async getTodayPlan(
    householdId: string,
    requestingUserId: string,
    simulatedNow?: Date,
  ): Promise<TodayPlanResponse> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("READ")) {
      throw new ForbiddenError("Access denied");
    }

    const household = await this.householdRepo.getHousehold(householdId);
    if (!household) throw new NotFoundError("Household not found");

    const now = simulatedNow ?? this.clock.now();
    const dateStr = now.toISOString().split("T")[0] || "2026-11-18";

    const currentAir = await this.airProvider.getCurrent(household.location);
    const forecast = await this.airProvider.getForecast(household.location, 72);

    const planCtx = createHouseholdPlanContext(household, currentAir.aqi, forecast);
    const generated = buildDailyPlan(planCtx);

    const actionLogs = await this.householdRepo.getActionLogs(householdId, dateStr);
    const completedSet = new Set(actionLogs.filter((l) => l.completed).map((l) => l.cardId));

    const cards = formatCards(generated, completedSet);
    const top3PriorityCardIds = cards.slice(0, 3).map((c) => c.id);

    return {
      date: dateStr,
      currentAqi: currentAir.aqi,
      naqiCategory: currentAir.category,
      cards,
      top3PriorityCardIds,
      isAiEnhanced: false,
      aiBadge: "Standard guidance",
    };
  }

  async toggleAction(
    householdId: string,
    requestingUserId: string,
    cardId: string,
    completed: boolean,
    correlationId = "system",
  ): Promise<void> {
    const mem = await this.householdRepo.getMembership(householdId, requestingUserId);
    if (!mem || mem.status !== "ACTIVE" || !mem.scopes.includes("CREATE")) {
      throw new ForbiddenError("You do not have permission to log actions in this household");
    }

    const now = this.clock.now();
    const dateStr = now.toISOString().split("T")[0] || "2026-11-18";

    await this.householdRepo.logAction({
      id: `${householdId}_${dateStr}_${cardId}`,
      householdId,
      memberId: requestingUserId,
      cardId,
      date: dateStr,
      completed,
      timestamp: now,
    });

    await this.auditRepo.append({
      tenantId: householdId,
      actorId: requestingUserId,
      action: "ACTION_TOGGLE",
      entityType: "ACTION_CARD",
      entityId: cardId,
      beforeSnapshot: null,
      afterSnapshot: { completed, date: dateStr },
      correlationId,
      at: now.toISOString(),
    });
  }

  async exportCalendarIcs(householdId: string, requestingUserId: string): Promise<string> {
    const plan = await this.getTodayPlan(householdId, requestingUserId);
    const now = this.clock.now();

    const events = plan.cards.map((c, i) => {
      const start = new Date(now.getTime() + (i * 2 + 1) * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return {
        uid: `saans-${householdId}-${c.id}-${start.getTime()}@saans.app`,
        summary: `[Saans] ${c.title}`,
        description: `${c.description}\n\nWhy: ${c.why}\nHealth Benefit: ~${c.impact.healthExposureReductionPercent}% less inhaled PM2.5`,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      };
    });

    return generateIcsCalendar(events);
  }
}
