import { Link, useRouter } from "@tanstack/react-router";
import { AlertCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting.ts";

export function RouteErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_route_error" });
  }, [error]);

  return (
    <div className="p-6 md:p-8">
      <Card className="panel-atlas border-0 max-w-lg mx-auto">
        <CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="font-display text-lg">This section didn't load</h2>
          <p className="text-sm text-muted-foreground break-words">{error.message}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => {
                router.invalidate();
                reset();
              }}
            >
              Try again
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/app">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RouteNotFoundBoundary() {
  return (
    <div className="p-6 md:p-8">
      <Card className="panel-atlas border-0 max-w-lg mx-auto">
        <CardContent className="p-8 text-center space-y-3">
          <SearchX className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="font-display text-lg">Not found</h2>
          <p className="text-sm text-muted-foreground">
            The record you're looking for doesn't exist or you don't have access.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="secondary" asChild>
              <Link to="/app">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
