// Atlas Demo Data Engine
// Self-contained seed data + mock AI response generators.
// No Supabase, no external AI required — everything runs client-side.

export interface DemoClaim {
  id: string;
  claimNumber: string;
  customerName: string;
  propertyAddress: string;
  carrier: string;
  adjuster: string;
  dateOfLoss: string;
  status: string;
  claimValue: number;
  potentialRevenue: number;
  aiConfidence: number;
  evidenceCompleteness: number;
  claimHealthScore: number;
  atlasSummary: string;
  estimateLineItems: number;
  photoCount: number;
  documentCount: number;
}

export interface DemoFinding {
  id: string;
  type: "roof" | "water" | "code" | "structural" | "mold" | "scope" | "pricing";
  severity: "high" | "medium" | "low";
  location: string;
  confidence: number;
  description: string;
  evidenceIds: string[];
}

export interface DemoEvidence {
  id: string;
  type: "photo" | "document" | "code" | "estimate" | "inspection" | "manufacturer" | "invoice";
  label: string;
  detail: string;
  date: string;
}

export interface DemoOpportunity {
  id: string;
  description: string;
  category: string;
  amountCents: number;
  confidence: number;
  evidenceCount: number;
  complianceStatus: "validated" | "pending" | "flagged";
  priority: "high" | "medium" | "low";
  status: "new" | "approved" | "rejected" | "edited";
  rationale: string;
  action: string;
  evidenceIds: string[];
  reasoning: string;
  codeReferences: { code: string; description: string; status: "pass" | "fail" | "insufficient_data" }[];
  missingDocumentation: string[];
  potentialObjection: string | null;
  suggestedResponse: string | null;
  requiresAdditionalEvidence: boolean;
}

export interface DemoTimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  icon: string;
}

export interface DemoSessionLog {
  id: string;
  timestamp: string;
  label: string;
}

export const DEMO_CLAIM: DemoClaim = {
  id: "demo-claim-001",
  claimNumber: "SF-2026-0481",
  customerName: "Michael Chen",
  propertyAddress: "1847 Maple Ridge Dr, Austin, TX 78746",
  carrier: "State Farm",
  adjuster: "Jennifer Walsh",
  dateOfLoss: "2026-01-14",
  status: "supplement_pending",
  claimValue: 28450,
  potentialRevenue: 4260,
  aiConfidence: 94,
  evidenceCompleteness: 87,
  claimHealthScore: 92,
  atlasSummary:
    "We analyzed 84 estimate line items, 67 photos, and 12 documents. We identified 8 revenue opportunities worth approximately $4,260. Two recommendations require additional documentation.",
  estimateLineItems: 84,
  photoCount: 67,
  documentCount: 12,
};

export const DEMO_EVIDENCE: DemoEvidence[] = [
  { id: "ev-1", type: "photo", label: "Photo #14 — Ridge Cap Missing", detail: "North slope ridge cap missing. Underlayment exposed to weather.", date: "2026-01-15" },
  { id: "ev-2", type: "photo", label: "Photo #18 — Chimney Flashing", detail: "Step flashing at chimney base is loose and deteriorated.", date: "2026-01-15" },
  { id: "ev-3", type: "photo", label: "Photo #23 — Valley Damage", detail: "Roof valley shows damaged shingles and missing sealant.", date: "2026-01-15" },
  { id: "ev-4", type: "photo", label: "Photo #31 — Interior Drywall", detail: "Water staining on ceiling below chimney area.", date: "2026-01-15" },
  { id: "ev-5", type: "code", label: "IRC R905.2.7", detail: "Roof covering application per manufacturer requirements. Ridge cap required for warranty coverage.", date: "2024-01-01" },
  { id: "ev-6", type: "code", label: "IRC R905.2.8.1", detail: "Valley flashing: Valleys shall be flashed in accordance with manufacturer's instructions.", date: "2024-01-01" },
  { id: "ev-7", type: "estimate", label: "Carrier Estimate — Line 47", detail: "Ridge cap omitted from original estimate. Standard Xactimate line SFG 440 missing.", date: "2026-01-16" },
  { id: "ev-8", type: "estimate", label: "Carrier Estimate — Line 112", detail: "Chimney step flashing not included. Only base flashing listed (line 112).", date: "2026-01-16" },
  { id: "ev-9", type: "inspection", label: "Field Inspection Report", detail: "Inspector noted: 'Ridge cap damaged/missing on north elevation. Chimney flashing deteriorated. Valley sealant failed.'", date: "2026-01-15" },
  { id: "ev-10", type: "manufacturer", label: "GAF Installation Spec — §4.2", detail: "Ridge cap required for warranty coverage. Per GAF Golden Pledge installation requirements.", date: "2025-03-01" },
  { id: "ev-11", type: "document", label: "Adjuster Photos — State Farm", detail: "Adjuster's own photos (SF-AP-018) show missing ridge cap. Uploaded with estimate.", date: "2026-01-16" },
  { id: "ev-12", type: "invoice", label: "Material Invoice — Ridge Cap", detail: "Invoice shows 42 linear feet of ridge cap purchased and delivered to job site.", date: "2026-01-18" },
  { id: "ev-13", type: "photo", label: "Photo #45 — Attic Moisture", detail: "Moisture meter reading 24% in attic sheathing near chimney.", date: "2026-01-15" },
  { id: "ev-14", type: "document", label: "Moisture Map Report", detail: "Professional moisture mapping shows elevated levels in 3 rooms below roof damage.", date: "2026-01-16" },
];

export const DEMO_FINDINGS: DemoFinding[] = [
  {
    id: "f-1",
    type: "roof",
    severity: "high",
    location: "North roof slope — ridge",
    confidence: 98,
    description: "Missing ridge cap along north roof elevation. Underlayment exposed. Code-required item omitted from estimate.",
    evidenceIds: ["ev-1", "ev-5", "ev-7", "ev-9", "ev-10", "ev-11"],
  },
  {
    id: "f-2",
    type: "roof",
    severity: "medium",
    location: "Chimney base — south elevation",
    confidence: 95,
    description: "Deteriorated chimney step flashing. Base flashing listed but step flashing omitted from estimate.",
    evidenceIds: ["ev-2", "ev-8", "ev-9", "ev-13"],
  },
  {
    id: "f-3",
    type: "roof",
    severity: "medium",
    location: "Roof valley — east slope",
    confidence: 91,
    description: "Valley damage with failed sealant. IRC R905.2.8.1 requires manufacturer-specified valley flashing.",
    evidenceIds: ["ev-3", "ev-6", "ev-9"],
  },
  {
    id: "f-4",
    type: "water",
    severity: "high",
    location: "Interior ceiling — below chimney",
    confidence: 96,
    description: "Water damage to drywall ceiling below chimney. Direct result of flashing failure.",
    evidenceIds: ["ev-4", "ev-13", "ev-14"],
  },
  {
    id: "f-5",
    type: "scope",
    severity: "low",
    location: "Attic sheathing",
    confidence: 88,
    description: "Elevated moisture readings in attic sheathing. Drying equipment not included in estimate.",
    evidenceIds: ["ev-13", "ev-14"],
  },
  {
    id: "f-6",
    type: "pricing",
    severity: "low",
    location: "Material pricing",
    confidence: 84,
    description: "Carrier estimate uses outdated pricing for underlayment (Q3 2025). Current Xactimate pricing is 12% higher.",
    evidenceIds: ["ev-7"],
  },
];

export const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: "opp-1",
    description: "Replace ridge cap — north slope (42 LF)",
    category: "Missing Scope",
    amountCents: 42000,
    confidence: 98,
    evidenceCount: 6,
    complianceStatus: "validated",
    priority: "high",
    status: "new",
    rationale:
      "Ridge cap is missing from the north slope and was omitted from the carrier estimate. Photo #14 clearly shows exposed underlayment. IRC R905.2.7 and GAF installation specifications both require ridge cap for warranty coverage. The adjuster's own photos (SF-AP-018) confirm the damage.",
    action: "Add Xactimate line SFG 440 — Ridge Cap, 42 linear feet @ $10/LF",
    evidenceIds: ["ev-1", "ev-5", "ev-7", "ev-9", "ev-10", "ev-11"],
    reasoning:
      "Atlas compared 84 estimate line items against the documented damage and found ridge cap missing. The carrier's own adjuster photos confirm the omission. IRC R905.2.7 requires manufacturer-specified ridge installation, and GAF's Golden Pledge warranty (§4.2) explicitly requires ridge cap. This is a code-required item, not cosmetic.",
    codeReferences: [
      { code: "IRC R905.2.7", description: "Roof covering application per manufacturer requirements", status: "pass" },
      { code: "GAF §4.2", description: "Ridge cap required for warranty coverage", status: "pass" },
    ],
    missingDocumentation: [],
    potentialObjection: "Ridge cap is cosmetic — not required for waterproofing.",
    suggestedResponse:
      "Per IRC R905.2.7 and GAF installation requirements, ridge cap is required for warranty coverage. Photo #14 shows missing ridge cap with exposed underlayment. This is a code-required item backed by manufacturer specifications, not cosmetic.",
    requiresAdditionalEvidence: false,
  },
  {
    id: "opp-2",
    description: "Chimney step flashing replacement (8 SF)",
    category: "Missing Scope",
    amountCents: 24500,
    confidence: 95,
    evidenceCount: 4,
    complianceStatus: "validated",
    priority: "high",
    status: "new",
    rationale:
      "Step flashing at chimney base is deteriorated (Photo #18). Carrier estimate includes base flashing (line 112) but omits step flashing. Inspection report confirms deterioration. This is a manufacturer-required component for proper flashing installation.",
    action: "Add Xactimate line SFS 450 — Step flashing, 8 sq ft @ $30.63/SF",
    evidenceIds: ["ev-2", "ev-8", "ev-9", "ev-13"],
    reasoning:
      "The carrier estimate lists chimney base flashing but omits step flashing, which interlocks with base flashing for code-compliant installation. Photo #18 shows the deteriorated step flashing, and the inspection report corroborates. Step flashing is required per manufacturer installation specifications.",
    codeReferences: [
      { code: "IRC R903.2", description: "Flashing: Roof coverings shall be installed per manufacturer instructions. Step flashing is a required component at roof-to-wall intersections including chimneys.", status: "pass" },
    ],
    missingDocumentation: [],
    potentialObjection: "Step flashing was intact — only base flashing needed replacement.",
    suggestedResponse:
      "Photo #18 clearly shows deteriorated step flashing at the chimney base. The inspection report corroborates this. Step flashing interlocks with base flashing; replacing base without step flashing violates manufacturer installation specifications per IRC R903.2.",
    requiresAdditionalEvidence: false,
  },
  {
    id: "opp-3",
    description: "Roof valley flashing repair — east slope (24 LF)",
    category: "Missing Scope",
    amountCents: 18000,
    confidence: 91,
    evidenceCount: 3,
    complianceStatus: "validated",
    priority: "medium",
    status: "new",
    rationale:
      "Roof valley shows damaged shingles and failed sealant (Photo #23). IRC R905.2.8.1 requires manufacturer-specified valley flashing. Estimate does not include valley repair.",
    action: "Add Xactimate line SFA 310 — Valley flashing, 24 LF @ $7.50/LF",
    evidenceIds: ["ev-3", "ev-6", "ev-9"],
    reasoning:
      "The east roof valley has documented damage. Photo #23 shows failed sealant and damaged shingles in the valley. IRC R905.2.8.1 specifically addresses valley flashing requirements. This is not visible from ground level, so adjusters commonly miss it without roof access.",
    codeReferences: [
      { code: "IRC R905.2.8.1", description: "Valley flashing: Valleys shall be flashed per manufacturer's instructions.", status: "pass" },
    ],
    missingDocumentation: [],
    potentialObjection: "Valley damage is pre-existing wear and tear, not storm-related.",
    suggestedResponse:
      "Photo #23 shows specific point-of-impact damage in the valley consistent with hail and wind. The inspection report notes sealant failure and shingle displacement. IRC R905.2.8.1 requires valley flashing per manufacturer specs. Pre-existing wear would show uniform degradation, not localized damage.",
    requiresAdditionalEvidence: false,
  },
  {
    id: "opp-4",
    description: "Drywall ceiling repair — water damage below chimney (120 SF)",
    category: "Missing Scope",
    amountCents: 14500,
    confidence: 96,
    evidenceCount: 3,
    complianceStatus: "validated",
    priority: "high",
    status: "new",
    rationale:
      "Water damage to interior ceiling directly below chimney. Photo #31 and moisture report confirm. This is a direct consequence of the flashing failure and should be included in the claim scope.",
    action: "Add Xactimate lines — Drywall removal + replacement, 120 SF @ $12.08/SF",
    evidenceIds: ["ev-4", "ev-13", "ev-14"],
    reasoning:
      "The interior drywall damage is a direct consequence of the chimney flashing failure. Photo #31 shows water staining on the ceiling below the chimney. The professional moisture map report confirms elevated moisture levels in this area. This damage is a direct result of the covered roof loss.",
    codeReferences: [
      { code: "IRC R701.1", description: "Interior wall and ceiling finishes: Damaged gypsum board shall be replaced to maintain code compliance.", status: "pass" },
    ],
    missingDocumentation: [],
    potentialObjection: "Interior damage is pre-existing and unrelated to the roof claim.",
    suggestedResponse:
      "The moisture map report directly ties the interior damage to the roof leak above. Photo #31 shows water staining on the ceiling directly below the damaged chimney. The damage path is continuous from roof to interior. This is a direct consequence of the covered roof loss.",
    requiresAdditionalEvidence: false,
  },
  {
    id: "opp-5",
    description: "Attic dehumidification — elevated moisture (3 days)",
    category: "Missing Labor",
    amountCents: 8500,
    confidence: 88,
    evidenceCount: 2,
    complianceStatus: "pending",
    priority: "medium",
    status: "new",
    rationale:
      "Moisture readings show 24% in attic sheathing. Drying equipment not included in estimate. IICRC S500 requires drying when moisture exceeds 16%.",
    action: "Add Xactimate line — Dehumidifier, 3 days @ $140/day + monitoring",
    evidenceIds: ["ev-13", "ev-14"],
    reasoning:
      "Moisture meter readings in the attic sheathing show 24% moisture content, exceeding the 16% threshold per IICRC S500 industry standards. The carrier estimate does not include any drying equipment or dehumidification. This is standard mitigation required to prevent secondary damage.",
    codeReferences: [
      { code: "IICRC S500", description: "Industry standard: Moisture above 16% in structural materials requires professional drying.", status: "pass" },
    ],
    missingDocumentation: ["Estimated duration of drying (3-5 days typical)"],
    potentialObjection: "Attic ventilation is sufficient — mechanical drying not needed.",
    suggestedResponse:
      "Moisture readings of 24% significantly exceed the 16% IICRC S500 threshold. Attic ventilation alone cannot reduce moisture in sheathing fast enough to prevent mold. Professional drying equipment is the industry standard remedy.",
    requiresAdditionalEvidence: true,
  },
  {
    id: "opp-6",
    description: "Underlayment pricing update — Q4 2025 Xactimate",
    category: "Pricing",
    amountCents: 3200,
    confidence: 84,
    evidenceCount: 1,
    complianceStatus: "validated",
    priority: "low",
    status: "new",
    rationale:
      "Carrier estimate uses Q3 2025 pricing for synthetic underlayment. Current Xactimate pricing (Q4 2025) is 12% higher. Price update is quantifiable and defensible.",
    action: "Update underlayment line pricing from $0.72/SF to $0.81/SF (40 squares)",
    evidenceIds: ["ev-7"],
    reasoning:
      "The carrier estimate references Q3 2025 Xactimate pricing for synthetic underlayment. The current Q4 2025 pricing schedule shows a 12% increase. This is a straightforward pricing correction with documented basis.",
    codeReferences: [],
    missingDocumentation: [],
    potentialObjection: "We use our own pricing schedules, not Xactimate.",
    suggestedResponse:
      "The estimate already references Xactimate pricing for all other line items. The Q4 2025 pricing update is the current published rate. Consistency with Xactimate pricing across all line items is appropriate.",
    requiresAdditionalEvidence: false,
  },
  {
    id: "opp-7",
    description: "Drip edge installation — code upgrade (180 LF)",
    category: "Code Upgrade",
    amountCents: 9200,
    confidence: 87,
    evidenceCount: 2,
    complianceStatus: "pending",
    priority: "medium",
    status: "new",
    rationale:
      "IRC R905.2.8.5 requires drip edge at eaves and rakes. Current roof does not have drip edge and estimate does not include it. This is a code-mandated upgrade required for full roof replacement.",
    action: "Add Xactimate line — Drip edge, 180 LF @ $5.11/LF",
    evidenceIds: ["ev-9", "ev-12"],
    reasoning:
      "The inspection report confirms the current roof installation does not include drip edge. IRC R905.2.8.5 specifically mandates drip edge installation at eaves and rakes. This is a code-required upgrade whenever the roof is replaced.",
    codeReferences: [
      { code: "IRC R905.2.8.5", description: "Drip edge: Required at eaves and rakes per manufacturer installation instructions.", status: "pass" },
    ],
    missingDocumentation: ["Close-up photos showing absence of existing drip edge"],
    potentialObjection: "Drip edge wasn't there before — we match pre-loss condition.",
    suggestedResponse:
      "IRC R905.2.8.5 requires drip edge at eaves and rakes for current code compliance. When a roof is replaced, code upgrades are required regardless of pre-existing condition. The manufacturer warranty also requires drip edge per installation specifications.",
    requiresAdditionalEvidence: true,
  },
  {
    id: "opp-8",
    description: "Ice and water shield — eaves (120 LF)",
    category: "Code Upgrade",
    amountCents: 10800,
    confidence: 89,
    evidenceCount: 2,
    complianceStatus: "validated",
    priority: "medium",
    status: "new",
    rationale:
      "IRC R905.2.7.1 requires ice barrier (ice and water shield) at eaves for this climate zone. Inspection confirms no ice barrier present. Code-required upgrade.",
    action: "Add Xactimate line — Ice and water shield, 120 LF @ $9.00/LF",
    evidenceIds: ["ev-5", "ev-9"],
    reasoning:
      "IRC R905.2.7.1 requires ice barrier installation at eaves in the applicable climate zone. The inspection report confirms no ice barrier is present on the existing roof. This is a code-mandated upgrade when the roof is replaced.",
    codeReferences: [
      { code: "IRC R905.2.7.1", description: "Ice barrier: Required in climate zones where ice barriers are mandated.", status: "pass" },
    ],
    missingDocumentation: ["Measurement of eave length to confirm 120 LF"],
    potentialObjection: "Ice and water shield is not required in this region.",
    suggestedResponse:
      "Austin, TX falls within the IRC climate zone requiring ice barriers at eaves per R905.2.7.1. The local building department enforces this requirement. Manufacturer specifications also recommend ice barrier at eaves.",
    requiresAdditionalEvidence: false,
  },
];

export const DEMO_TIMELINE: DemoTimelineEvent[] = [
  { id: "t-1", timestamp: "2026-01-14 09:15", action: "Claim Created", detail: "Homeowner reported roof damage after windstorm", icon: "file" },
  { id: "t-2", timestamp: "2026-01-15 10:00", action: "Inspection Scheduled", detail: "Project Manager assigned to inspection", icon: "calendar" },
  { id: "t-3", timestamp: "2026-01-15 14:30", action: "Inspection Complete", detail: "67 photos taken, field notes documented", icon: "camera" },
  { id: "t-4", timestamp: "2026-01-16 09:00", action: "Documents Uploaded", detail: "Carrier estimate (84 line items), inspection report, moisture map uploaded", icon: "upload" },
  { id: "t-5", timestamp: "2026-01-16 09:15", action: "OCR Complete", detail: "Atlas extracted all 84 line items and categorized 12 documents", icon: "scan" },
  { id: "t-6", timestamp: "2026-01-16 09:16", action: "Photos Analyzed", detail: "Atlas analyzed 67 photos for damage detection", icon: "camera" },
  { id: "t-7", timestamp: "2026-01-16 09:17", action: "AI Analysis Complete", detail: "Evidence graph built, compliance validated, opportunities generated", icon: "brain" },
  { id: "t-8", timestamp: "2026-01-16 09:18", action: "Revenue Opportunities", detail: "8 opportunities identified totaling $4,260", icon: "dollar" },
];

export const DEMO_SESSION_LOGS: DemoSessionLog[] = [
  { id: "s-1", timestamp: "10:42", label: "Estimate uploaded" },
  { id: "s-2", timestamp: "10:43", label: "OCR complete — 84 line items extracted" },
  { id: "s-3", timestamp: "10:44", label: "Photos analyzed — 67 images processed" },
  { id: "s-4", timestamp: "10:45", label: "Findings generated — 6 damage findings identified" },
  { id: "s-5", timestamp: "10:46", label: "Compliance validated — 8 code references checked" },
  { id: "s-6", timestamp: "10:47", label: "Recommendations generated — 8 opportunities created" },
  { id: "s-7", timestamp: "10:48", label: "Atlas completed analysis" },
];

export const AI_THINKING_STREAM = [
  "Reading estimate...",
  "Extracting line items...",
  "Analyzing roof photos...",
  "Comparing estimate to evidence...",
  "Finding missing flashing...",
  "Checking manufacturer requirements...",
  "Checking building code...",
  "Validating compliance...",
  "Calculating confidence...",
  "Generating recommendation...",
  "Cross-referencing adjuster photos...",
  "Building evidence graph...",
  "Detecting missing scope...",
  "Calculating revenue impact...",
  "Completed.",
];

export function formatMoney(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US");
}

// --- Dashboard demo metrics ---
export const DEMO_METRICS = {
  recoveredRevenue: 127400,
  potentialRevenue: 42600,
  approvalRate: 87,
  aiConfidence: 94,
  claimsInReview: 3,
  opportunitiesAvailable: 8,
  supplementsPending: 2,
  pendingAdjusters: 4,
};
