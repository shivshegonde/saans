import {
  AirNowResponse,
  TodayPlanResponse,
  ImpactCalculationResponse,
  AirForecastResponse,
} from "shared";

const getAuthHeaders = (): Record<string, string> => {
  let token = typeof window !== "undefined" ? localStorage.getItem("saans.token") : null;
  if (!token) {
    token = "demo-token-riya";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("saans.token", token);
      } catch (err) {
        console.warn("Could not persist session token to localStorage", err);
      }
    }
  }
  return { Authorization: `Bearer ${token}` };
};

export async function fetchAirNow(): Promise<AirNowResponse> {
  const res = await fetch("/api/v1/air/now", { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Air data error (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export { type AirForecastResponse };

export async function fetchAirForecast(): Promise<AirForecastResponse> {
  const res = await fetch("/api/v1/air/forecast", { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Air forecast error (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTodayPlan(date?: string): Promise<TodayPlanResponse> {
  const url = date ? `/api/v1/plan/today?date=${date}` : "/api/v1/plan/today";
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Plan error (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export async function toggleActionItem(
  actionId: string,
  completed: boolean,
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/v1/plan/actions/${actionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    throw new Error(`Action toggle error (${res.status})`);
  }
  return res.json();
}

export async function calculateImpact(inputs: {
  commuteMode?: string;
  commuteDistanceKm?: number;
  maskWornHours?: number;
  purifierHours?: number;
  ventilationSchedule?: string;
  stovetopCookingMinutes?: number;
}): Promise<ImpactCalculationResponse> {
  const res = await fetch("/api/v1/impact/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) {
    throw new Error(`Impact calculation error (${res.status})`);
  }
  return res.json();
}

export async function recordLedger(action: {
  actionId: string;
  date: string;
  avoidedDoseUg: number;
  avoidedEmissionsGramsCo2: number;
}): Promise<{ recorded: boolean }> {
  const res = await fetch("/api/v1/analytics/ledger", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(action),
  });
  if (!res.ok) {
    throw new Error(`Ledger error (${res.status})`);
  }
  return res.json();
}

export async function fetchCommunityStats(communityId: string): Promise<{
  communityId: string;
  name: string;
  kAnonymityMet: boolean;
  activeHouseholdsCount: number;
  collectiveEmissionsAvoidedKg: number;
  pledges: Array<{
    id: string;
    title: string;
    targetParticipants: number;
    currentParticipants: number;
    joined: boolean;
  }>;
}> {
  const res = await fetch(`/api/v1/community/${communityId}/stats`, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Community stats error (${res.status})`);
  }
  return res.json();
}
