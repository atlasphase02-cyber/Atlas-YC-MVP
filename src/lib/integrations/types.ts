// ─── Integration Hub — shared types ───────────────────────────────────────────
// Generic integration framework. Provider-specific logic lives in providers/.

/** Top-level integration category shown in the Settings UI. */
export type IntegrationCategory =
  "crm" | "estimating" | "insurance" | "email" | "phone" | "storage" | "accounting";

export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  crm: "CRM / Job Management",
  estimating: "Estimating",
  insurance: "Insurance Carriers",
  email: "Email",
  phone: "Phone",
  storage: "Cloud Storage",
  accounting: "Accounting",
};

export type ConnectionStatus = "connected" | "disconnected" | "pending" | "error" | "expired";

export type SyncStatus = "idle" | "running" | "success" | "partial" | "failed";

export type SyncDirection = "import" | "export" | "bidirectional";

/** A single registered integration in the hub. */
export interface Integration {
  id: string;
  owner_id: string;
  provider: string;
  category: IntegrationCategory;
  label: string;
  logo_url: string | null;
  status: ConnectionStatus;
  credentials: Record<string, unknown> | null;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  created_at: string;
  updated_at: string;
}

/** Log of each sync run for an integration. */
export interface IntegrationSync {
  id: string;
  integration_id: string;
  owner_id: string;
  direction: SyncDirection;
  status: SyncStatus;
  started_at: string;
  finished_at: string | null;
  records_imported: number;
  records_failed: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

/** Registered webhook endpoint for a provider. */
export interface Webhook {
  id: string;
  owner_id: string;
  integration_id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── Unified data model — normalises imported records from any source ─────────

export interface ImportedClaim {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  claim_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  property_address: string | null;
  carrier_name: string | null;
  adjuster_name: string | null;
  loss_date: string | null;
  amount_cents: number | null;
  status: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
}

export interface ImportedCustomer {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
}

export interface ImportedEstimate {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  claim_number: string | null;
  total_cents: number;
  line_items: Record<string, unknown>[];
  raw_payload: Record<string, unknown>;
  imported_at: string;
}

export interface ImportedDocument {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  url: string | null;
  claim_number: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
}

export interface ImportedPhoto {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  caption: string | null;
  url: string | null;
  claim_number: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
}

export interface ImportedCommunication {
  id: string;
  owner_id: string;
  integration_id: string;
  external_id: string;
  direction: "inbound" | "outbound";
  channel: "email" | "sms" | "call" | "chat";
  subject: string | null;
  body: string | null;
  from_address: string | null;
  to_address: string | null;
  sent_at: string | null;
  claim_number: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
}
