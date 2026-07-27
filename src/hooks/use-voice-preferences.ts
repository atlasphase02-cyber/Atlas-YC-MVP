import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, currentUserId, type VoicePreferences } from "@/lib/atlas-db.ts";

const DEFAULTS: Omit<VoicePreferences, "user_id" | "updated_at"> = {
  voice_name: null,
  rate: 1.0,
  pitch: 1.0,
  muted: false,
  mode: "tap",
  auto_send_transcripts: true,
};

export function useVoicePreferences() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["voice-preferences"],
    queryFn: async (): Promise<VoicePreferences | null> => {
      const uid = await currentUserId();
      if (!uid) return null;
      const { data, error } = await db
        .from("voice_preferences")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      return (data as VoicePreferences | null) ?? null;
    },
    staleTime: 60_000,
  });

  const m = useMutation({
    mutationFn: async (patch: Partial<Omit<VoicePreferences, "user_id" | "updated_at">>) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const row = { user_id: uid, ...DEFAULTS, ...(q.data ?? {}), ...patch };
      const { error } = await db.from("voice_preferences").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voice-preferences"] }),
  });

  const prefs = q.data ?? ({ ...DEFAULTS, user_id: "", updated_at: "" } as VoicePreferences);
  return { prefs, update: m.mutate, loading: q.isLoading };
}
