// ─── Xactimate provider (mock) — Estimating ────────────────────────────────────

import type { IntegrationProvider, ProviderFactory, SyncResult } from "../base-provider";

const META = {
  provider: "xactimate",
  category: "estimating",
  label: "Xactimate",
  logo_url: "/logos/xactimate.svg",
  scopes: ["estimates", "price_lists"],
  description: "Import estimates and line-item detail from Xactimate.",
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const factory: ProviderFactory = ({ credentials }) => {
  const connected = credentials != null && Object.keys(credentials).length > 0;

  return {
    meta: META,

    async connect(creds) {
      await delay(500);
      if (!creds.username || !creds.password)
        return { ok: false, error: "Username and password required" };
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(1500);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [],
        customers: [],
        estimates: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "XA-EST-771",
            claim_number: "JN-8821",
            total_cents: 44_210_00,
            line_items: [
              {
                description: "Water extraction — Class 3",
                qty: 1,
                unit: "EA",
                price_cents: 3_800_00,
              },
              {
                description: "Dehumidifier — 28 day rental",
                qty: 4,
                unit: "EA",
                price_cents: 6_400_00,
              },
              { description: "Air mover", qty: 8, unit: "EA", price_cents: 2_800_00 },
              {
                description: "Baseboard removal & reset",
                qty: 140,
                unit: "LF",
                price_cents: 2_100_00,
              },
              {
                description: 'Drywall replacement 1/2"',
                qty: 28,
                unit: "SF",
                price_cents: 4_200_00,
              },
            ],
            raw_payload: { source: "xactimate", price_list: "TX_REST_2026_Q2" },
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "XA-EST-819",
            claim_number: "AL-4401",
            total_cents: 32_870_00,
            line_items: [
              { description: "Tear-off — 2 layers", qty: 32, unit: "SQ", price_cents: 4_800_00 },
              {
                description: "GAF Timberline HDZ — 32 SQ",
                qty: 32,
                unit: "SQ",
                price_cents: 19_200_00,
              },
              { description: "Ridge vent", qty: 48, unit: "LF", price_cents: 1_440_00 },
            ],
            raw_payload: { source: "xactimate", price_list: "TX_REST_2026_Q2" },
            imported_at: new Date().toISOString(),
          },
        ],
        documents: [],
        photos: [],
        communications: [],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(400);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 423 : null } };
    },
  };
};

export const xactimateProvider = factory;
