// ─── AccuLynx provider (mock) — CRM / Job Management ──────────────────────────

import type {
  IntegrationProvider,
  ProviderResult,
  ProviderFactory,
  SyncResult,
} from "../base-provider";

const META = {
  provider: "acculynx",
  category: "crm",
  label: "AccuLynx",
  logo_url: "/logos/acculynx.svg",
  scopes: ["jobs", "contacts", "documents", "photos"],
  description: "Sync roofing and restoration jobs from AccuLynx.",
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const factory: ProviderFactory = ({ credentials }) => {
  const connected = credentials != null && Object.keys(credentials).length > 0;

  return {
    meta: META,

    async connect(creds) {
      await delay(700);
      if (!creds.api_key) return { ok: false, error: "API key required" };
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(1000);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "AL-4401",
            claim_number: "AL-4401",
            customer_name: "Patel Residence",
            customer_email: "vikram.patel@email.com",
            customer_phone: "(512) 555-0311",
            property_address: "2201 Congress Ave, Austin, TX 78701",
            carrier_name: "Allstate",
            adjuster_name: "Jennifer Morse",
            loss_date: "2026-05-28",
            amount_cents: 31_400_00,
            status: "supplement_pending",
            raw_payload: { source: "acculynx", job_type: "roof_replacement" },
            imported_at: new Date().toISOString(),
          },
        ],
        customers: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "AL-CUST-89",
            name: "Patel Residence",
            email: "vikram.patel@email.com",
            phone: "(512) 555-0311",
            address: "2201 Congress Ave",
            city: "Austin",
            state: "TX",
            zip: "78701",
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
        ],
        estimates: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "AL-EST-203",
            claim_number: "AL-4401",
            total_cents: 31_400_00,
            line_items: [
              { description: "Tear-off & disposal", qty: 1, unit: "LS", price_cents: 4_200_00 },
              {
                description: "GAF Timberline HDZ shingles",
                qty: 32,
                unit: "SQ",
                price_cents: 18_560_00,
              },
              { description: "Drip edge", qty: 180, unit: "LF", price_cents: 1_440_00 },
            ],
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
        ],
        documents: [],
        photos: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "AL-PHOTO-56",
            caption: "Hail damage — east slope",
            url: "https://demo.atlas.restoration/al-photo-56",
            claim_number: "AL-4401",
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "AL-PHOTO-57",
            caption: "Granule loss — close-up",
            url: "https://demo.atlas.restoration/al-photo-57",
            claim_number: "AL-4401",
            raw_payload: {},
            imported_at: new Date().toISOString(),
          },
        ],
        communications: [],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(250);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 212 : null } };
    },
  };
};

export const accuLynxProvider = factory;
