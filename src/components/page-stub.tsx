import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles } from "lucide-react";

export function PageStub({
  title,
  subtitle,
  askPrompt,
  children,
}: {
  title: string;
  subtitle: string;
  askPrompt: string;
  children?: ReactNode;
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="space-y-6">
        <Card className="panel-atlas border-0">
          <CardContent className="p-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Ask Atlas</p>
              <p className="font-display text-base sm:text-lg truncate">"{askPrompt}"</p>
            </div>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent("atlas:ask", { detail: { prompt: askPrompt } }))}
              aria-label={`Ask Atlas: ${askPrompt}`}
            >
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Ask
            </Button>
          </CardContent>
        </Card>
        {children}
      </div>
    </AppShell>
  );
}
