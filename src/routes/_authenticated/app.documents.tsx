import { createFileRoute } from "@tanstack/react-router";
import { PageStub } from "@/components/page-stub.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { LoadingList, EmptyState, ErrorState } from "@/components/data-states.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  db,
  currentUserId,
  uploadFile,
  signedUrl,
  deleteFile,
  DOC_BUCKET,
  type AppDocument,
} from "@/lib/atlas-db.ts";
import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";
import { FolderOpen, Upload, Trash2, Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/documents")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents", "list"],
    queryFn: async (): Promise<AppDocument[]> => {
      const { data, error } = await db
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AppDocument[];
    },
  });

  const folders = useMemo(() => {
    const m = new Map<string, number>();
    data?.forEach((d) => m.set(d.folder, (m.get(d.folder) ?? 0) + 1));
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (folderFilter) list = list.filter((d) => d.folder === folderFilter);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    return list;
  }, [data, folderFilter, query]);

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const uid = await currentUserId();
      if (!uid) throw new Error("Not signed in");
      const folder = folderFilter ?? "Inbox";
      for (const f of Array.from(files)) {
        const meta = await uploadFile(DOC_BUCKET, f, `folders/${folder}`);
        const { error } = await db.from("documents").insert({
          owner_id: uid,
          folder,
          name: meta.name,
          storage_path: meta.path,
          mime_type: meta.type,
          size_bytes: meta.size,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (d: AppDocument) => {
      if (d.storage_path) await deleteFile(DOC_BUCKET, d.storage_path).catch(() => {});
      const { error } = await db.from("documents").delete().eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function open(d: AppDocument) {
    if (!d.storage_path) return;
    try {
      const url = await signedUrl(DOC_BUCKET, d.storage_path);
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <PageStub
      title="Documents"
      subtitle={`${data?.length ?? 0} files`}
      askPrompt="Find contracts missing customer signatures"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-full sm:min-w-56">
          <Search
            className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="doc-search" className="sr-only">
            Search files and tags
          </label>
          <Input
            id="doc-search"
            className="pl-8"
            placeholder="Search files & tags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => e.target.files && upload.mutate(e.target.files)}
        />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          <Upload className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
          {upload.isPending ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {isLoading && <LoadingList />}
      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {!isLoading && !error && folders.size > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by folder">
          <Badge
            variant={folderFilter === null ? "default" : "secondary"}
            onClick={() => setFolderFilter(null)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFolderFilter(null);
              }
            }}
          >
            All
          </Badge>
          {Array.from(folders.entries()).map(([f, n]) => (
            <Badge
              key={f}
              variant={folderFilter === f ? "default" : "secondary"}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => setFolderFilter(f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFolderFilter(f);
                }
              }}
            >
              <FolderOpen className="mr-1 h-3 w-3" aria-hidden="true" /> {f} · {n}
            </Badge>
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          title={data?.length ? "No files match" : "No documents yet"}
          hint={data?.length ? "Try a different search or folder." : "Upload files to get started."}
        />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <Card className="panel-atlas border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((d) => (
                <div key={d.id} className="p-3 flex items-center justify-between gap-2 sm:gap-3">
                  <button
                    className="text-left min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                    onClick={() => open(d)}
                    aria-label={`Open ${d.name}`}
                  >
                    <p className="text-sm truncate">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {d.folder} · {d.mime_type ?? "file"} ·{" "}
                      {d.size_bytes ? Math.round(d.size_bytes / 1024) + " KB" : ""}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => open(d)}
                    aria-label={`Download ${d.name}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => del.mutate(d)}
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageStub>
  );
}
