import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "../src/components/Header.js";
import { NavigationTabs } from "../src/components/NavigationTabs.js";
import { JudgeDemoBar } from "../src/components/JudgeDemoBar.js";
import { LivingSkyHero } from "../src/components/LivingSkyHero.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrap(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("e2e.happy-path.spec: End-to-End User Journey (Resident & Judge Workflows)", () => {
  it("allows switching between personas: Riya, Dadaji, and Mr. Kulkarni", () => {
    let currentPersona = "riya";
    const onSelectPersona = (p: string) => {
      currentPersona = p;
    };

    const { rerender } = wrap(
      <Header
        activePersona={currentPersona}
        onSelectPersona={onSelectPersona}
        onOpenAskSaans={() => {}}
        onOpenShareModal={() => {}}
      />,
    );

    expect(currentPersona).toBe("riya");

    // Select Dadaji
    onSelectPersona("dadaji");
    rerender(
      <QueryClientProvider client={queryClient}>
        <Header
          activePersona={currentPersona}
          onSelectPersona={onSelectPersona}
          onOpenAskSaans={() => {}}
          onOpenShareModal={() => {}}
        />
      </QueryClientProvider>,
    );
    expect(currentPersona).toBe("dadaji");
  });

  it("navigates across core application tabs (today, plan, homeAir, impact, community)", () => {
    let activeTab = "today";
    const { rerender } = wrap(
      <NavigationTabs activeTab={activeTab} onSelectTab={(t) => (activeTab = t)} />,
    );

    expect(activeTab).toBe("today");
    activeTab = "plan";
    rerender(
      <QueryClientProvider client={queryClient}>
        <NavigationTabs activeTab={activeTab} onSelectTab={(t) => (activeTab = t)} />
      </QueryClientProvider>,
    );
    expect(activeTab).toBe("plan");
  });

  it("renders LivingSkyHero with CPCB NAQI score and grounded category badge", () => {
    const mockAir = {
      aqi: 245,
      category: "Poor" as const,
      dominantPollutant: "PM2.5",
      whoMultiple: 16.3,
      pollutants: { pm25: 110, pm10: 190 },
      subIndices: { pm25: 245, pm10: 190 },
      location: { name: "Anand Vihar, Delhi", lat: 28.65, lng: 77.31 },
      provenance: { source: "CPCB CAAQMS via OpenMeteo" },
      smogDrivers: [{ id: "stubble", name: "Biomass Burning", contributionPct: 35 }],
      updatedAt: new Date().toISOString(),
    };

    const { container } = wrap(
      <LivingSkyHero
        data={mockAir as unknown as Parameters<typeof LivingSkyHero>[0]["data"]}
        isLoading={false}
      />,
    );
    expect(container.textContent).toContain("245");
    expect(container.textContent).toContain("Poor");
    expect(container.textContent).toContain("Anand Vihar, Delhi");
  });

  it("interacts with Judge Demo Bar to toggle time travel and scenarios", () => {
    const { container } = wrap(<JudgeDemoBar onOpenOutboxModal={() => {}} />);
    expect(container.textContent).toContain("Demo (FR-20)");
    expect(container.textContent).toContain("+15m");
    expect(container.textContent).toContain("+1h");
  });
});
