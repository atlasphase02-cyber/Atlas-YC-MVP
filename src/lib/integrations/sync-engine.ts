// ─── Sync engine — runs connect / sync / webhook flows against Supabase ────────
// Uses loosely-typed Supabase access because the generated Database type
// doesn't know about integration tables yet (same pattern as atlas-db.ts).

import { supabase } from "@/integrations/supabase/client";
import { createProvider } from "./registry";
import type {
  Integration,
  SyncStatus,
  ConnectionStatus,
  ImportedClaim,
  ImportedCustomer,
  ImportedEstimate,
  ImportedDocument,
  ImportedPhoto,
  ImportedCommunication,
} from "./types";
import type { ProviderResult, SyncResult } from "./base-provider";

/** Loosely-typed Supabase access for tables not yet in the generated types. */

function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any;
}

export async function connectIntegration(
  integration: Pick<Integration, "id" | "provider" | "credentials" | "config">,
  credentials: Record<string, unknown>,
): Promise<ProviderResult<Record<string, unknown>>> {
  const provider = createProvider(integration);
  if (!provider) return { ok: false, error: `Unknown provider: ${integration.provider}` };

  const result = await provider.connect(credentials);
  if (!result.ok) return result;

  const { error } = await db()
    .from("integrations")
    .update({
      credentials: result.data ?? credentials,
      status: "connected" as ConnectionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function disconnectIntegration(
  integration: Pick<Integration, "id" | "provider" | "credentials" | "config">,
): Promise<ProviderResult<void>> {
  const provider = createProvider(integration);
  if (!provider) return { ok: false, error: `Unknown provider: ${integration.provider}` };

  await provider.disconnect();

  const { error } = await db()
    .from("integrations")
    .update({
      credentials: null,
      status: "disconnected" as ConnectionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function syncIntegration(
  integration: Integration,
): Promise<ProviderResult<SyncResult>> {
  const provider = createProvider(integration);
  if (!provider) return { ok: false, error: `Unknown provider: ${integration.provider}` };

  const { data: syncRow, error: insertErr } = await db()
    .from("integration_syncs")
    .insert({
      integration_id: integration.id,
      owner_id: integration.owner_id,
      direction: "import",
      status: "running",
      started_at: new Date().toISOString(),
      finished_at: null,
      records_imported: 0,
      records_failed: 0,
      error_message: null,
      metadata: {},
    })
    .select("id")
    .single();

  if (insertErr || !syncRow) {
    return { ok: false, error: insertErr?.message ?? "Failed to create sync record" };
  }
  const syncId = syncRow.id as string;

  const result = await provider.sync();

  if (!result.ok || !result.data) {
    await db()
      .from("integration_syncs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: result.error ?? "Unknown sync error",
      })
      .eq("id", syncId);
    return result;
  }

  const imported = result.data;
  let total = 0;

  total += await persistBatch(
    "imported_claims",
    imported.claims,
    integration.owner_id,
    integration.id,
  );
  total += await persistBatch(
    "imported_customers",
    imported.customers,
    integration.owner_id,
    integration.id,
  );
  total += await persistBatch(
    "imported_estimates",
    imported.estimates,
    integration.owner_id,
    integration.id,
  );
  total += await persistBatch(
    "imported_documents",
    imported.documents,
    integration.owner_id,
    integration.id,
  );
  total += await persistBatch(
    "imported_photos",
    imported.photos,
    integration.owner_id,
    integration.id,
  );
  total += await persistBatch(
    "imported_communications",
    imported.communications,
    integration.owner_id,
    integration.id,
  );

  await db()
    .from("integration_syncs")
    .update({
      status: "success",
      finished_at: new Date().toISOString(),
      records_imported: total,
      records_failed: 0,
    })
    .eq("id", syncId);

  await db()
    .from("integrations")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: "success",
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  return { ok: true, data: imported };
}

export async function checkHealth(
  integration: Pick<Integration, "provider" | "credentials" | "config">,
) {
  const provider = createProvider(integration);
  if (!provider) return { ok: false, error: `Unknown provider: ${integration.provider}` };
  return provider.healthCheck();
}

async function persistBatch(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
  owner_id: string,
  integration_id: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  // Strip id so the DB auto-generates it; set owner + integration refs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withMeta = rows.map(({ id: _id, owner_id: _oid, integration_id: _iid, ...rest }: any) => ({
    ...rest,
    owner_id,
    integration_id,
  }));
  await db().from(table).upsert(withMeta, {
    onConflict: "integration_id,external_id",
    ignoreDuplicates: false,
  });
  return rows.length;
}
