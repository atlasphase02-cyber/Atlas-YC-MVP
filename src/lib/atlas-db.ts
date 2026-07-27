// Phase 2/3 row types + a loosely-typed accessor. Casts around the
// generated `Database` type since we mutate schema faster than we regen.
import { supabase } from "@/integrations/supabase/client.ts";

export type ClaimStatus =
  | "new"
  | "inspection_scheduled"
  | "waiting_on_carrier"
  | "supplement_pending"
  | "approved"
  | "closed"
  | "denied";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "new",
  "inspection_scheduled",
  "waiting_on_carrier",
  "supplement_pending",
  "approved",
  "closed",
  "denied",
];

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  new: "New",
  inspection_scheduled: "Inspection scheduled",
  waiting_on_carrier: "Waiting on carrier",
  supplement_pending: "Supplement pending",
  approved: "Approved",
  closed: "Closed",
  denied: "Denied",
};

export type SupplementStatus = "draft" | "submitted" | "approved" | "denied";
export const SUPPLEMENT_STATUSES: SupplementStatus[] = ["draft", "submitted", "approved", "denied"];

export type AppointmentKind = "inspection" | "call" | "meeting" | "deadline" | "task";
export type NotificationTone = "default" | "signal" | "warn" | "error";

export interface Carrier {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Adjuster {
  id: string;
  owner_id: string;
  carrier_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avg_response_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Claim {
  id: string;
  owner_id: string;
  claim_number: string;
  customer_id: string | null;
  carrier_id: string | null;
  adjuster_id: string | null;
  status: ClaimStatus;
  amount_cents: number;
  loss_date: string | null;
  description: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}
export interface Supplement {
  id: string;
  owner_id: string;
  claim_id: string;
  status: SupplementStatus;
  summary: string | null;
  total_cents: number;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_recommendations: string[];
  created_at: string;
  updated_at: string;
}
export interface SupplementItem {
  id: string;
  owner_id: string;
  supplement_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  ai_suggested: boolean;
  ai_confidence: number | null;
  ai_reason: string | null;
  created_at: string;
}
export interface AppDocument {
  id: string;
  owner_id: string;
  claim_id: string | null;
  customer_id?: string | null;
  folder: string;
  name: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[];
  version?: number;
  ocr_status?: string;
  created_at: string;
}
export interface DocumentVersion {
  id: string;
  owner_id: string;
  document_id: string;
  version: number;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}
export interface Photo {
  id: string;
  owner_id: string;
  claim_id: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
}
export interface Note {
  id: string;
  owner_id: string;
  claim_id: string | null;
  body: string;
  created_at: string;
}
export interface ClaimComment {
  id: string;
  owner_id: string;
  claim_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}
export interface ClaimEvent {
  id: string;
  owner_id: string;
  claim_id: string;
  kind: string;
  detail: string | null;
  created_at: string;
}
export interface Appointment {
  id: string;
  owner_id: string;
  claim_id: string | null;
  kind: AppointmentKind;
  title: string;
  who: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  created_at: string;
}
export interface AppNotification {
  id: string;
  owner_id: string;
  title: string;
  body: string | null;
  tone: NotificationTone;
  read_at: string | null;
  link_to?: string | null;
  created_at: string;
}
export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  claim_updates: boolean;
  supplement_updates: boolean;
  appointment_reminders: boolean;
  updated_at: string;
}
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}
export interface Conversation {
  id: string;
  owner_id: string;
  title: string;
  pinned: boolean;
  archived_at: string | null;
  page_context: Record<string, unknown>;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}
export type MessageRole = "user" | "assistant" | "system";
export interface ChatMessage {
  id: string;
  owner_id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  parts: unknown | null;
  created_at: string;
}
export type VoiceMode = "tap" | "ptt" | "hands_free";
export interface VoicePreferences {
  user_id: string;
  voice_name: string | null;
  rate: number;
  pitch: number;
  muted: boolean;
  mode: VoiceMode;
  auto_send_transcripts: boolean;
  updated_at: string;
}
export type InterviewStatus = "active" | "completed" | "abandoned";
export interface InterviewTurn {
  role: "user" | "assistant";
  content: string;
  at: string;
}
export interface InterviewActionItem {
  title: string;
  owner?: string | null;
  due?: string | null;
}
export interface Interview {
  id: string;
  owner_id: string;
  claim_id: string | null;
  customer_id: string | null;
  title: string;
  status: InterviewStatus;
  transcript: InterviewTurn[];
  summary: string | null;
  action_items: InterviewActionItem[];
  insights: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Cast around the not-yet-regenerated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as any;

export function formatMoney(cents: number | null | undefined) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const DOC_BUCKET = "atlas-documents";
export const PHOTO_BUCKET = "atlas-photos";

export async function uploadFile(bucket: string, file: File, folderPath = "") {
  const uid = await currentUserId();
  if (!uid) throw new Error("Not signed in");
  const safe = file.name.replace(/[^\w.-]+/g, "_");
  const key = [uid, folderPath, `${Date.now()}-${safe}`].filter(Boolean).join("/");
  const { error } = await supabase.storage.from(bucket).upload(key, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return { path: key, size: file.size, type: file.type, name: file.name };
}

export async function signedUrl(bucket: string, path: string, expiresIn = 60 * 10) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function logClaimEvent(claimId: string, kind: string, detail?: string) {
  const uid = await currentUserId();
  if (!uid) return;
  await db
    .from("claim_events")
    .insert({ owner_id: uid, claim_id: claimId, kind, detail: detail ?? null });
}
