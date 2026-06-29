import { Type } from "@google/genai";
import type { ToolDef } from "../gemini";
import { CATEGORY_META, type IssueCategory, type Issue } from "../types";

/** SLA policy by urgency (hours). Shared so every agent routes against the same numbers. */
export const SLA_BY_URGENCY = { critical: 12, high: 24, medium: 72, low: 168 } as const;

const CREW_BY_CATEGORY: Record<IssueCategory, string> = {
  pothole: "Road repair crew + hot-mix unit",
  road_damage: "Road repair crew",
  water_leakage: "Water board rapid-response team",
  drainage: "Desilting & sewerage crew",
  streetlight: "Electrical maintenance team",
  electricity: "High-voltage safety team",
  waste: "Sanitation truck + cleanup crew",
  vegetation: "Tree-cutting / horticulture crew",
  public_safety: "Traffic & safety unit",
  graffiti: "Public works cleanup crew",
  other: "General field inspector",
};

export function crewFor(category: IssueCategory): string {
  return CREW_BY_CATEGORY[category] ?? CREW_BY_CATEGORY.other;
}

/** A mock municipal directory so the Routing agent can ground its complaint letter. */
function directoryFor(department: string): { officer: string; email: string; phone: string } {
  const slug = department.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  return {
    officer: `Officer-in-Charge, ${department}`,
    email: `grievance.${slug}@bbmp.gov.in`,
    phone: "+91-80-2222-" + (1000 + (department.length * 37) % 9000),
  };
}

/**
 * Tools the Routing & Action agent can call autonomously via Gemini function-calling.
 * Each returns plain JSON-serialisable data that is fed back into the model.
 */
export function buildRoutingTools(): Record<string, ToolDef> {
  return {
    lookup_department: {
      declaration: {
        name: "lookup_department",
        description:
          "Look up the responsible municipal department and the default field crew for a civic issue category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Issue category, e.g. pothole, water_leakage, streetlight, drainage, electricity.",
            },
          },
          required: ["category"],
        },
      },
      handler: (args) => {
        const category = String(args.category ?? "other") as IssueCategory;
        const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
        return { category, department: meta.department, recommendedCrew: crewFor(category) };
      },
    },

    get_sla_policy: {
      declaration: {
        name: "get_sla_policy",
        description: "Return the municipal Service-Level-Agreement target (in hours) for a given urgency level.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING,
              description: "One of: low, medium, high, critical.",
            },
          },
          required: ["urgency"],
        },
      },
      handler: (args) => {
        const urgency = String(args.urgency ?? "medium") as keyof typeof SLA_BY_URGENCY;
        return { urgency, slaHours: SLA_BY_URGENCY[urgency] ?? SLA_BY_URGENCY.medium };
      },
    },

    get_department_directory: {
      declaration: {
        name: "get_department_directory",
        description:
          "Fetch the contact details (officer, email, phone) for a municipal department so a complaint can be addressed correctly.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            department: { type: Type.STRING, description: "Full department name." },
          },
          required: ["department"],
        },
      },
      handler: (args) => directoryFor(String(args.department ?? "General Grievance Cell")),
    },
  };
}

/** Re-export for callers that only need geo distance against the live issue set. */
export type { Issue };
