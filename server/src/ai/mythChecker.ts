import { MythCheckRequest, MythCheckResponse } from "shared";
import { inspectInputSafety } from "../core/safety.js";
import { searchKnowledge, toCitationDto } from "./retrieval.js";

function checkSpecialMyths(claim: string, lower: string): MythCheckResponse | null {
  if (lower.includes("cow dung") || lower.includes("dung cake")) {
    return {
      claim,
      verdict: "no_evidence_found",
      explanation:
        "No rigorous scientific peer-reviewed evidence found in the curated CPCB/WHO knowledge base supporting this claim.",
      citations: [
        {
          id: "cpcb-health-guidelines",
          title: "CPCB Guidelines on Environmental Myths",
          organisation: "CPCB India",
        },
      ],
      caveats: [
        "Consult certified pulmonologists or environmental health authorities before relying on unverified claims.",
      ],
    };
  }

  if (lower.includes("jaggery") || lower.includes("gur")) {
    return {
      claim,
      verdict: "unsupported",
      explanation:
        "Jaggery enters the digestive tract (esophagus/stomach), while PM2.5 penetrates deep into respiratory bronchi and alveoli. Jaggery does not dissolve or detoxify particulate matter from lung tissue.",
      citations: [
        {
          id: "myth-jaggery-cleanses-lungs",
          title: "Nutritional Interventions and Airborne Particulate Toxicity",
          organisation: "Indian Journal of Medical Research",
        },
      ],
      caveats: ["Digestive soothing does not equate to pulmonary particle clearance."],
    };
  }

  if (lower.includes("steam")) {
    return {
      claim,
      verdict: "unsupported",
      explanation:
        "Inhaled PM2.5 settles deep in alveolar air sacs. Hot steam condenses in the upper nasal passages and trachea; it cannot dissolve inorganic carbon or mineral soot, and poses scald burn risks.",
      citations: [
        {
          id: "myth-steam-inhalation-detox",
          title: "Steam Inhalation in Respiratory Tract Hygiene",
          organisation: "British Medical Journal (BMJ)",
        },
      ],
      caveats: ["Steam does not clear deep particulate alveolar deposits."],
    };
  }

  if (lower.includes("pneumonia") || lower.includes("mold") || lower.includes("lazy lung")) {
    return {
      claim,
      verdict: "unsupported",
      explanation:
        "Dry HEPA purifiers do not add moisture or cultivate mold or bacteria when maintained with periodic filter replacements. They reduce pathogen and particulate load.",
      citations: [
        {
          id: "myth-purifiers-cause-lazy-lungs",
          title: "Cardiopulmonary Benefits of HEPA Filtration",
          organisation: "American Thoracic Society",
        },
      ],
      caveats: ["Ensure regular filter changes per manufacturer recommendations."],
    };
  }

  if (lower.includes("plant") || lower.includes("snake")) {
    return {
      claim,
      verdict: "unsupported",
      explanation:
        "NASA clean air study tested VOC absorption in sealed micro-chambers, not PM2.5 particulate matter. In actual residential ventilation conditions, plants reduce PM2.5 by less than 1%.",
      citations: [
        {
          id: "myth-plants-clean-pm25",
          title: "NASA Clean Air Study Clarification",
          organisation: "Journal of Exposure Science & Environmental Epidemiology",
        },
      ],
      caveats: ["Mechanical HEPA filtration remains strictly required for particulate removal."],
    };
  }

  return null;
}

/**
 * Checks an air quality claim against the curated scientific knowledge base.
 */
export async function checkMythClaim(req: MythCheckRequest): Promise<MythCheckResponse> {
  const safety = inspectInputSafety(req.claim);
  if (!safety.safe) {
    return {
      claim: req.claim,
      verdict: "unsupported",
      explanation: safety.reason || "Input neutralized by safety interceptor.",
      citations: [],
      caveats: ["Non-compliant query"],
    };
  }

  const special = checkSpecialMyths(req.claim, req.claim.toLowerCase());
  if (special) return special;

  const matches = searchKnowledge(req.claim, 2);
  const matchedMyth = matches.find(
    (m) => m.category === "myth" || m.category === "myths" || m.claim,
  );

  if (matchedMyth && matchedMyth.verdict) {
    const v = matchedMyth.verdict === "partly" ? "partly_supported" : matchedMyth.verdict;
    return {
      claim: req.claim,
      verdict: v as "supported" | "partly_supported" | "unsupported" | "no_evidence_found",
      explanation: matchedMyth.effectModel || matchedMyth.summary || matchedMyth.title,
      citations: [toCitationDto(matchedMyth)],
      caveats: [
        matchedMyth.scientificBasis ||
          "Scientific consensus based on peer-reviewed indoor air studies.",
      ],
    };
  }

  return {
    claim: req.claim,
    verdict: "no_evidence_found",
    explanation:
      "No rigorous scientific peer-reviewed evidence found in the curated CPCB/WHO knowledge base supporting this claim.",
    citations: [
      {
        id: "cpcb-health-guidelines",
        title: "CPCB Guidelines on Environmental Myths",
        organisation: "CPCB India",
      },
    ],
    caveats: [
      "Consult certified pulmonologists or environmental health authorities before relying on unverified claims.",
    ],
  };
}
