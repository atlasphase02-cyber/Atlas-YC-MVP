// ─── Integration Hub — public API barrel ──────────────────────────────────────
// Everything the UI layer needs is re-exported from here.

export * from "./types";
export { getProviderMeta, getProvidersByCategory, listProviders, createProvider } from "./registry";
export {
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  checkHealth,
} from "./sync-engine";
