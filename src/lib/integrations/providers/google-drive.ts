// ─── Google Drive provider (mock) — Cloud Storage ──────────────────────────────

import type { IntegrationProvider, ProviderFactory, SyncResult } from "../base-provider";

const META = {
  provider: "google-drive",
  category: "storage",
  label: "Google Drive",
  logo_url: "/logos/google-drive.svg",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  description: "Sync claim folders, photos, and documents from Google Drive.",
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
      return { ok: true, data: { ...creds, connected_at: new Date().toISOString() } };
    },

    async disconnect() {
      await delay(200);
      return { ok: true };
    },

    async sync() {
      await delay(1100);
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
            external_id: "GDRIVE-FILE-88",
            name: "Hernandez — Certificate of Completion.pdf",
            mime_type: "application/pdf",
            size_bytes: 640_000,
            url: "https://drive.google.com/file/d/abc123",
            claim_number: "JN-8821",
            raw_payload: { folder: "Claims/JN-8821" },
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GDRIVE-FILE-91",
            name: "Reyes Commercial — Fire report.pdf",
            mime_type: "application/pdf",
            size_bytes: 2_100_000,
            url: "https://drive.google.com/file/d/def456",
            claim_number: "JN-8829",
            raw_payload: { folder: "Claims/JN-8829" },
            imported_at: new Date().toISOString(),
          },
        ],
        photos: [
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GDRIVE-PHOTO-12",
            caption: "Pre-loss condition — living room",
            url: "https://drive.google.com/file/d/ghi789",
            claim_number: "JN-8821",
            raw_payload: { folder: "Claims/JN-8821/Photos" },
            imported_at: new Date().toISOString(),
          },
          {
            id: "",
            owner_id: "",
            integration_id: "",
            external_id: "GDRIVE-PHOTO-13",
            caption: "Post-mitigation — kitchen",
            url: "https://drive.google.com/file/d/jkl012",
            claim_number: "JN-8821",
            raw_payload: { folder: "Claims/JN-8821/Photos" },
            imported_at: new Date().toISOString(),
          },
        ],
        communications: [],
      };

      return { ok: true, data };
    },

    async healthCheck() {
      await delay(350);
      return { ok: true, data: { ok: connected, latency_ms: connected ? 145 : null } };
    },
  };
};

export const googleDriveProvider = factory;
