import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { NavigationTabs } from "../src/components/NavigationTabs";
import { Header } from "../src/components/Header";
import { ActionCardItem } from "../src/features/plan/ActionCardItem";
import { ActionCard } from "shared";
import "../src/i18n";

describe("Mobile Responsiveness & Touch Targets (§10, WCAG 2.2 AA)", () => {
  it("renders mobile bottom navigation with 6 accessible tabs having min-h-[48px]", () => {
    const { container } = render(<NavigationTabs activeTab="today" onSelectTab={() => {}} />);

    const mobileNav = container.querySelector("nav[aria-label='Mobile Navigation']");
    expect(mobileNav).not.toBeNull();

    const buttons = mobileNav?.querySelectorAll("button[role='tab']");
    expect(buttons?.length).toBe(6);

    buttons?.forEach((btn) => {
      expect(btn.className).toContain("min-h-[48px]");
    });
  });

  it("ensures Header renders compact accessible controls on small screens", () => {
    render(
      <Header
        highContrast={false}
        toggleHighContrast={() => {}}
        fontScale="100%"
        cycleFontScale={() => {}}
      />,
    );

    const langSelect = screen.getByLabelText("Select Language");
    expect(langSelect).toBeDefined();

    const fontBtn = screen.getByLabelText(/font (size|scale) is/i);
    expect(fontBtn).toBeDefined();
    expect(fontBtn.className).toContain("min-h-[36px]");

    const hcBtn = screen.getByLabelText("Enable high contrast mode");
    expect(hcBtn).toBeDefined();
    expect(hcBtn.className).toContain("min-h-[36px]");
  });

  it("verifies ActionCardItem check completion button complies with 44x44px touch target", () => {
    const mockCard: ActionCard = {
      id: "card-test-1",
      title: "Run HEPA Purifier in Bedroom",
      description: "Pre-clean indoor air before evening sleep.",
      category: "purifier",
      timeSlot: "evening",
      effort: "easy",
      costBand: "low",
      why: "Indoor particles accumulate overnight.",
      impact: {
        healthExposureReductionPercent: 45,
        cityCo2eAvoidedKg: 0,
      },
      completed: false,
    };

    render(<ActionCardItem action={mockCard} onToggleDone={() => {}} />);

    const checkBtn = screen.getByLabelText(`Mark ${mockCard.title} as completed`);
    expect(checkBtn).toBeDefined();
    expect(checkBtn.className).toContain("min-w-[44px]");
    expect(checkBtn.className).toContain("min-h-[44px]");
  });
});
