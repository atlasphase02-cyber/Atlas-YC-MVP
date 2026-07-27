// ─── Slack provider (mock) — Phone / Messaging ────────────────────────────────

import type { IntegrationProvider, ProviderFactory, SyncResult } from "../base-provider";

const META = {
  provider: "slack",
  category: "phone",
  label: "Slack",
  logo_url: "/logos/slack.svg",
  scopes: ["channels:read", "channels:history", "users:read"],
  description: "Import claim-related Slack conversations and file shares.",
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
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(700);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [],
        customers: [],
        estimates: [],
        documents: [],
        photos: [],
        communications: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "SL-MSG-501",
            direction: "inbound",
            channel: "chat",
            subject: "#claims-internal",
            body: "@channel — adjuster just called, wants the Hernandez moisture map by EOD. Who has the thermal cam photos?",
            from_address: "miguel@atlasrestoration.com",
            to_address: "#claims-internal",
            sent_at: "2026-07-19T15:30:00Z",
            claim_number: "JN-8821",
            raw_payload: { channel: "C01ABC123" },
            imported_at: new Date().toISOString(),
          },
        ],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(200);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 65 : null } };
    },
  };
};

export const slackProvider = factory;
