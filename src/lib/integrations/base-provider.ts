// ─── Base provider interface — every integration must implement these ─────────
// Real OAuth / API clients plug in here without changing the UI or DB layer.

import type {
  ImportedClaim,
  ImportedCustomer,
  ImportedEstimate,
  ImportedDocument,
  ImportedPhoto,
  ImportedCommunication,
} from "./types";

/** Result envelope for provider operations. */
export interface ProviderResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface SyncResult {
  claims: ImportedClaim[];
  customers: ImportedCustomer[];
  estimates: ImportedEstimate[];
  documents: ImportedDocument[];
  photos: ImportedPhoto[];
  communications: ImportedCommunication[];
}

export interface ProviderMeta {
  provider: string;
  category: string;
  label: string;
  logo_url: string;
  scopes: string[];
  /** Human-readable description for the connect screen. */
  description: string;
}

export interface HealthStatus {
  ok: boolean;
  latency_ms: number | null;
  error?: string;
}

/**
 * Every integration provider must satisfy this interface.
 * Real implementations replace the mock bodies with live API calls.
 */
export interface IntegrationProvider {
  meta: ProviderMeta;

  connect(credentials: Record<string, unknown>): Promise<ProviderResult<Record<string, unknown>>>;
  disconnect(): Promise<ProviderResult>;
  sync(since?: Date): Promise<ProviderResult<SyncResult>>;
  healthCheck(): Promise<ProviderResult<HealthStatus>>;

  /** Optional webhook handler. Called by the sync engine when an inbound
   * webhook arrives for this provider. Return true if processed. */
  handleWebhook?(
    event_type: string,
    payload: Record<string, unknown>,
  ): Promise<ProviderResult<boolean>>;
}

/**
 * Constructor type so the registry can instantiate providers on demand.
 * Accepts a credentials/config bag returned from a prior connect().
 */
export type ProviderFactory = (config: {
  credentials: Record<string, unknown> | null;
  config: Record<string, unknown>;
}) => IntegrationProvider;
