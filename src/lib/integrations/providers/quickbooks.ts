// ─── QuickBooks provider (mock) — Accounting ───────────────────────────────────

import type { IntegrationProvider, ProviderFactory, SyncResult } from "../base-provider";

const META = {
  provider: "quickbooks",
  category: "accounting",
  label: "QuickBooks",
  logo_url: "/logos/quickbooks.svg",
  scopes: ["com.intuit.quickbooks.accounting"],
  description: "Sync invoices, payments, and job costing from QuickBooks.",
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const factory: ProviderFactory = ({ credentials }) => {
  const connected = credentials != null && Object.keys(credentials).length > 0;

  return {
    meta: META,

    async connect(creds) {
      await delay(900);
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(1300);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [],
        customers: [],
        estimates: [],
        documents: [],
        photos: [],
        communications: [],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(400);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 302 : null } };
    },
  };
};

export const quickbooksProvider = factory;
