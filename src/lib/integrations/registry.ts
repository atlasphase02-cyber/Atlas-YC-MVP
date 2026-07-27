// ─── Integration Hub — registry (fixed) ──────────────────────────────────────

import type { IntegrationCategory, Integration } from "./types";
import type { IntegrationProvider, ProviderFactory, ProviderMeta } from "./base-provider";

import { jobNimbusProvider } from "./providers/jobnimbus";
import { accuLynxProvider } from "./providers/acculynx";
import { xactimateProvider } from "./providers/xactimate";
import { gmailProvider } from "./providers/gmail";
import { slackProvider } from "./providers/slack";
import { googleDriveProvider } from "./providers/google-drive";
import { quickbooksProvider } from "./providers/quickbooks";

const registry: Record<string, ProviderFactory> = {
  jobnimbus: jobNimbusProvider,
  acculynx: accuLynxProvider,
  xactimate: xactimateProvider,
  gmail: gmailProvider,
  slack: slackProvider,
  "google-drive": googleDriveProvider,
  quickbooks: quickbooksProvider,
};

export function listProviders(): string[] {
  return Object.keys(registry);
}

export function getProviderMeta(provider: string): ProviderMeta | null {
  const factory = registry[provider];
  if (!factory) return null;
  return factory({ credentials: null, config: {} }).meta;
}

export function createProvider(
  integration: Pick<Integration, "provider" | "credentials" | "config">,
): IntegrationProvider | null {
  const factory = registry[integration.provider];
  if (!factory) return null;
  return factory({
    credentials: integration.credentials,
    config: integration.config as Record<string, unknown>,
  });
}

export function getProvidersByCategory(): Record<
  IntegrationCategory,
  { provider: string; meta: ProviderMeta | null }[]
> {
  const grouped: Record<string, { provider: string; meta: ProviderMeta | null }[]> = {};
  for (const provider of listProviders()) {
    const meta = getProviderMeta(provider);
    if (!meta) continue;
    const cat = meta.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ provider, meta });
  }
  return grouped as Record<IntegrationCategory, { provider: string; meta: ProviderMeta | null }[]>;
}
