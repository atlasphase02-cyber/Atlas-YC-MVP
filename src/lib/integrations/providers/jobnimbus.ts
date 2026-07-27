// ─── JobNimbus provider (mock) — CRM / Job Management ─────────────────────────

import type {
  IntegrationProvider,
  ProviderResult,
  ProviderFactory,
  SyncResult,
} from "../base-provider";

const META = {
  provider: "jobnimbus",
  category: "crm",
  label: "JobNimbus",
  logo_url: "/logos/jobnimbus.svg",
  scopes: ["contacts", "jobs", "tasks", "documents"],
  description: "Sync claims, contacts, and job records from JobNimbus.",
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const factory: ProviderFactory = ({ credentials }) => {
  const connected = credentials != null && Object.keys(credentials).length > 0;

  return {
    meta: META,

    async connect(creds) {
      await delay(600);
      if (!creds.api_key) return { ok: false, error: "API key required" };
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(1200);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "JN-8821",
            claim_number: "JN-8821",
            customer_name: "Hernandez Family",
            customer_email: "maria.hernandez@email.com",
            customer_phone: "(210) 555-0142",
            property_address: "1427 Alamo St, San Antonio, TX 78204",
            carrier_name: "State Farm",
            adjuster_name: "David Kim",
            loss_date: "2026-06-15",
            amount_cents: 42_750_00,
            status: "in_progress",
            raw_payload: { source: "jobnimbus", job_type: "water_mitigation" },
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "JN-8829",
            claim_number: "JN-8829",
            customer_name: "Reyes Commercial LLC",
            customer_email: "info@reyescommercial.com",
            customer_phone: "(210) 555-0289",
            property_address: "890 Broadway, San Antonio, TX 78215",
            carrier_name: "Travelers",
            adjuster_name: null,
            loss_date: "2026-07-02",
            amount_cents: 118_200_00,
            status: "new",
            raw_payload: { source: "jobnimbus", job_type: "commercial_fire" },
            imported_at: new Date().toISOString(),
          },
        ],
        customers: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "JN-CUST-401",
            name: "Hernandez Family",
            email: "maria.hernandez@email.com",
            phone: "(210) 555-0142",
            address: "1427 Alamo St",
            city: "San Antonio",
            state: "TX",
            zip: "78204",
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
        ],
        estimates: [],
        documents: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "JN-DOC-112",
            name: "Scope of Work — Hernandez.pdf",
            mime_type: "application/pdf",
            size_bytes: 1_200_000,
            url: "https://demo.atlas.restoration/jn-doc-112",
            claim_number: "JN-8821",
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
        ],
        photos: [],
        communications: [],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(300);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 187 : null } };
    },
  };
};

export const jobNimbusProvider = factory;
