// ─── Gmail provider (mock) — Email ─────────────────────────────────────────────

import type { IntegrationProvider, ProviderFactory, SyncResult } from "../base-provider";

const META = {
  provider: "gmail",
  category: "email",
  label: "Gmail",
  logo_url: "/logos/gmail.svg",
  scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  description: "Import claim-related email threads and attachments.",
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const factory: ProviderFactory = ({ credentials }) => {
  const connected = credentials != null && Object.keys(credentials).length > 0;

  return {
    meta: META,

    async connect(creds) {
      await delay(800);
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(900);
      if (!connected) return { ok: false, error: "Not connected" };

      const data: SyncResult = {
        claims: [],
        customers: [],
        estimates: [],
        documents: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GMAIL-ATT-331",
            name: "State Farm denial letter.pdf",
            mime_type: "application/pdf",
            size_bytes: 380_000,
            url: "https://demo.atlas.restoration/gmail-att-331",
            claim_number: "JN-8821",
            raw_payload: { thread_id: "t_a1b2c3" },
            imported_at: new Date().toISOString(),
          },
        ],
        photos: [],
        communications: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GMAIL-MSG-1001",
            direction: "inbound",
            channel: "email",
            subject: "Re: Claim JN-8821 — Supplement needed",
            body: "Hi, we've reviewed the supplement and need additional photos of the water damage in the master bath before we can approve the line items. Please upload to the portal by Friday. — David Kim, State Farm",
            from_address: "dkim@statefarm.com",
            to_address: "adjuster@atlasrestoration.com",
            sent_at: "2026-07-18T14:22:00Z",
            claim_number: "JN-8821",
            raw_payload: { thread_id: "t_a1b2c3", has_attachment: true },
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GMAIL-MSG-1012",
            direction: "outbound",
            channel: "email",
            subject: "Fwd: Claim JN-8821 — photos attached",
            body: "David, attached are the master bath photos you requested — 14 images total covering all four walls and the subfloor after dry-out. Let us know if you need anything else.",
            from_address: "adjuster@atlasrestoration.com",
            to_address: "dkim@statefarm.com",
            sent_at: "2026-07-19T09:45:00Z",
            claim_number: "JN-8821",
            raw_payload: { thread_id: "t_a1b2c3", has_attachment: true },
            imported_at: new Date().toISOString(),
          },
        ],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(300);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 98 : null } };
    },
  };
};

export const gmailProvider = factory;
