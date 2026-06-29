import { BADGES } from "./gamification";
import type { Issue, IssueCategory, IssueStatus, User } from "./types";
import { CATEGORY_META } from "./types";

// City center (Bengaluru) for the demo. Easily swappable.
export const CITY = {
  name: "Bengaluru",
  lat: 12.9716,
  lng: 77.5946,
};

const WARDS = [
  "Indiranagar",
  "Koramangala",
  "Jayanagar",
  "Whitefield",
  "HSR Layout",
  "Malleshwaram",
  "BTM Layout",
  "Marathahalli",
];

function daysAgo(n: number, h = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

export const SEED_USERS: User[] = [
  {
    id: "u_priya",
    name: "Priya Sharma",
    avatarColor: "#16b783",
    points: 1240,
    level: 5,
    reportsCount: 14,
    verificationsCount: 22,
    resolvedCount: 9,
    badges: [BADGES.first_report, BADGES.watchdog, BADGES.fixer, BADGES.guardian, BADGES.hero],
  },
  {
    id: "u_arjun",
    name: "Arjun Mehta",
    avatarColor: "#0284c7",
    points: 860,
    level: 4,
    reportsCount: 9,
    verificationsCount: 15,
    resolvedCount: 5,
    badges: [BADGES.first_report, BADGES.watchdog, BADGES.hotspot_hunter],
  },
  {
    id: "u_fatima",
    name: "Fatima Khan",
    avatarColor: "#7c3aed",
    points: 540,
    level: 3,
    reportsCount: 6,
    verificationsCount: 8,
    resolvedCount: 3,
    badges: [BADGES.first_report, BADGES.fixer],
  },
  {
    id: "u_ravi",
    name: "Ravi Kumar",
    avatarColor: "#b45309",
    points: 320,
    level: 2,
    reportsCount: 4,
    verificationsCount: 3,
    resolvedCount: 1,
    badges: [BADGES.first_report],
  },
  {
    id: "u_you",
    name: "You",
    avatarColor: "#0a936b",
    points: 150,
    level: 2,
    reportsCount: 2,
    verificationsCount: 1,
    resolvedCount: 0,
    badges: [BADGES.first_report],
  },
];

interface SeedSpec {
  title: string;
  description: string;
  category: IssueCategory;
  subcategory: string;
  tags: string[];
  severity: number;
  urgency: Issue["urgency"];
  status: IssueStatus;
  ward: number;
  dlat: number;
  dlng: number;
  address: string;
  reporter: string;
  upvotes: number;
  confirmations: number;
  daysOld: number;
}

const SPECS: SeedSpec[] = [
  {
    title: "Deep pothole causing two-wheeler accidents",
    description: "A large, deep pothole near the 100ft road junction. Several bikers have skidded, especially after rain when it fills with water and is hard to see.",
    category: "pothole", subcategory: "Deep pothole", tags: ["accident-risk", "rain", "two-wheeler"],
    severity: 5, urgency: "critical", status: "in_progress", ward: 0, dlat: 0.012, dlng: 0.008,
    address: "100 Feet Rd, near CMH Hospital", reporter: "u_priya", upvotes: 84, confirmations: 31, daysOld: 6,
  },
  {
    title: "Major water pipeline burst flooding the street",
    description: "A water main has burst and clean drinking water has been gushing onto the road for two days. Huge wastage and the road is slippery.",
    category: "water_leakage", subcategory: "Pipeline burst", tags: ["water-waste", "flooding"],
    severity: 5, urgency: "critical", status: "verified", ward: 1, dlat: -0.009, dlng: 0.014,
    address: "5th Block, near Forum Mall", reporter: "u_arjun", upvotes: 67, confirmations: 28, daysOld: 2,
  },
  {
    title: "Streetlight not working for over a week",
    description: "The entire stretch of road is pitch dark at night. Women returning from work feel unsafe. Three poles are out.",
    category: "streetlight", subcategory: "Pole outage", tags: ["safety", "night", "women-safety"],
    severity: 4, urgency: "high", status: "reported", ward: 2, dlat: 0.006, dlng: -0.011,
    address: "4th Main, Jayanagar", reporter: "u_you", upvotes: 45, confirmations: 19, daysOld: 4,
  },
  {
    title: "Garbage dump overflowing for days, foul smell",
    description: "Garbage collection has been skipped. Mounds of waste are attracting stray dogs and the smell is unbearable for nearby shops.",
    category: "waste", subcategory: "Missed collection", tags: ["health-hazard", "smell", "strays"],
    severity: 4, urgency: "high", status: "in_progress", ward: 3, dlat: 0.02, dlng: 0.03,
    address: "ITPL Main Rd, Whitefield", reporter: "u_ravi", upvotes: 52, confirmations: 22, daysOld: 3,
  },
  {
    title: "Open manhole on footpath - extremely dangerous",
    description: "The drain cover is missing on a busy footpath. A child almost fell in yesterday evening. Needs urgent barricading.",
    category: "drainage", subcategory: "Open manhole", tags: ["accident-risk", "child-safety"],
    severity: 5, urgency: "critical", status: "resolved", ward: 4, dlat: -0.014, dlng: 0.006,
    address: "Sector 2, HSR Layout", reporter: "u_you", upvotes: 91, confirmations: 40, daysOld: 9,
  },
  {
    title: "Sagging electrical wires hanging low over road",
    description: "Low-hanging live wires sag dangerously over the road near the transformer. Tall vehicles risk snagging them. Sparks seen during wind.",
    category: "electricity", subcategory: "Low-hanging wires", tags: ["fire-risk", "live-wire"],
    severity: 5, urgency: "critical", status: "verified", ward: 5, dlat: 0.004, dlng: -0.02,
    address: "Sampige Rd, Malleshwaram", reporter: "u_arjun", upvotes: 38, confirmations: 17, daysOld: 1,
  },
  {
    title: "Fallen tree blocking half the road after storm",
    description: "A large tree branch fell during last night's storm and is blocking one lane, causing traffic jams during peak hours.",
    category: "vegetation", subcategory: "Fallen tree", tags: ["traffic", "storm"],
    severity: 3, urgency: "medium", status: "resolved", ward: 6, dlat: -0.018, dlng: -0.009,
    address: "16th Main, BTM Layout", reporter: "u_fatima", upvotes: 29, confirmations: 12, daysOld: 7,
  },
  {
    title: "Stagnant water breeding mosquitoes near park",
    description: "Water has been collecting in a vacant plot for weeks. It's a mosquito breeding ground and there are dengue cases nearby.",
    category: "drainage", subcategory: "Stagnant water", tags: ["health-hazard", "dengue", "mosquito"],
    severity: 4, urgency: "high", status: "reported", ward: 7, dlat: 0.016, dlng: 0.018,
    address: "Outer Ring Rd, Marathahalli", reporter: "u_ravi", upvotes: 33, confirmations: 14, daysOld: 5,
  },
  {
    title: "Damaged road with exposed concrete and rebar",
    description: "The asphalt has completely worn off exposing sharp rebar. It punctures tyres and is a hazard for cyclists.",
    category: "road_damage", subcategory: "Surface erosion", tags: ["tyre-damage", "cyclist"],
    severity: 3, urgency: "medium", status: "in_progress", ward: 0, dlat: 0.009, dlng: 0.004,
    address: "Old Madras Rd, Indiranagar", reporter: "u_priya", upvotes: 24, confirmations: 9, daysOld: 4,
  },
  {
    title: "Broken pedestrian signal at busy crossing",
    description: "The pedestrian crossing signal has been dead for days. School kids cross here daily and it's very risky during peak traffic.",
    category: "public_safety", subcategory: "Signal failure", tags: ["traffic", "child-safety"],
    severity: 4, urgency: "high", status: "verified", ward: 1, dlat: -0.006, dlng: 0.01,
    address: "80 Feet Rd, Koramangala", reporter: "u_arjun", upvotes: 41, confirmations: 16, daysOld: 2,
  },
  {
    title: "Construction debris dumped on roadside",
    description: "A contractor dumped construction debris on the side of the road, narrowing it and creating dust. Blocking the storm drain too.",
    category: "waste", subcategory: "Debris dumping", tags: ["dust", "drain-block"],
    severity: 2, urgency: "low", status: "reported", ward: 4, dlat: -0.011, dlng: 0.002,
    address: "27th Main, HSR Layout", reporter: "u_fatima", upvotes: 12, confirmations: 5, daysOld: 1,
  },
  {
    title: "Faded zebra crossing near school invisible to drivers",
    description: "The zebra crossing paint has completely faded near the primary school gate. Drivers don't slow down. Needs repainting.",
    category: "road_damage", subcategory: "Faded markings", tags: ["child-safety", "school"],
    severity: 2, urgency: "medium", status: "resolved", ward: 2, dlat: 0.003, dlng: -0.007,
    address: "9th Block, Jayanagar", reporter: "u_ravi", upvotes: 18, confirmations: 7, daysOld: 11,
  },
];

function buildTimeline(status: IssueStatus, daysOld: number, reporter: string): Issue["timeline"] {
  const events: Issue["timeline"] = [
    { id: "t0", status: "reported", note: "Issue reported by citizen and analyzed by AI agents.", at: daysAgo(daysOld), by: reporter },
  ];
  const order: IssueStatus[] = ["verified", "in_progress", "resolved"];
  const target = order.indexOf(status);
  for (let i = 0; i <= target; i++) {
    const s = order[i];
    if (s === "verified") events.push({ id: `t${i + 1}`, status: s, note: "Confirmed by 10+ nearby residents. Community verified.", at: daysAgo(Math.max(0, daysOld - 1)), by: "Community" });
    if (s === "in_progress") events.push({ id: `t${i + 1}`, status: s, note: "Work order issued. Field team assigned.", at: daysAgo(Math.max(0, daysOld - 2)), by: "Municipal Dept." });
    if (s === "resolved") events.push({ id: `t${i + 1}`, status: s, note: "Issue resolved and verified on-site. Thank you for reporting!", at: daysAgo(Math.max(0, daysOld - 4)), by: "Municipal Dept." });
  }
  return events;
}

export function buildSeedIssues(): Issue[] {
  return SPECS.map((s, i) => {
    const meta = CATEGORY_META[s.category];
    const slaMap = { critical: 12, high: 24, medium: 72, low: 168 } as const;
    return {
      id: `iss_${(i + 1).toString().padStart(3, "0")}`,
      title: s.title,
      description: s.description,
      category: s.category,
      subcategory: s.subcategory,
      tags: s.tags,
      severity: s.severity,
      urgency: s.urgency,
      status: s.status,
      location: {
        lat: CITY.lat + s.dlat,
        lng: CITY.lng + s.dlng,
        address: s.address,
        ward: WARDS[s.ward],
      },
      imageUrl: meta.icon,
      reporterId: s.reporter,
      reporterName: SEED_USERS.find((u) => u.id === s.reporter)?.name ?? "Citizen",
      createdAt: daysAgo(s.daysOld),
      updatedAt: daysAgo(Math.max(0, s.daysOld - 2)),
      upvotes: s.upvotes,
      confirmations: s.confirmations,
      department: meta.department,
      slaHours: slaMap[s.urgency],
      timeline: buildTimeline(s.status, s.daysOld, SEED_USERS.find((u) => u.id === s.reporter)?.name ?? "Citizen"),
    } satisfies Issue;
  });
}

export { WARDS };
