import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Button } from "@/components/ui/button.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/settings")({ component: Page });

function Page() {
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) {
        setFullName(p.full_name ?? "");
        setCompany(p.company_name ?? "");
      }
    });
  }, []);

  async function save() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return; }
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id,
      email,
      full_name: fullName,
      company_name: company,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  return (
    <AppShell title="Settings" subtitle="Profile, voice, preferences">
      <div className="grid gap-4 max-w-2xl">
        <Card className="panel-atlas border-0">
          <CardContent className="p-6 space-y-4">
            <p className="font-display">Profile</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fn">Full name</Label>
                <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="co">Company</Label>
                <Input id="co" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="em">Email</Label>
              <Input id="em" value={email} disabled />
            </div>
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </CardContent>
        </Card>

        <Card className="panel-atlas border-0">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display">Atlas Voice</p>
              <p className="text-sm text-muted-foreground">Enable text-to-speech responses</p>
            </div>
            <Switch checked={voiceOn} onCheckedChange={setVoiceOn} aria-label="Enable Atlas Voice text-to-speech" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
