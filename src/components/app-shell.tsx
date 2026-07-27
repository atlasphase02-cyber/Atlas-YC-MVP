import { Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client.ts";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button.tsx";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Users,
  UserCog,
  FolderOpen,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
  Search,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./command-palette.tsx";
import { useRoles } from "@/hooks/use-role.ts";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications.ts";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";

// Lazy: the assistant pulls in the AI SDK + speech APIs (~heavy). Off the
// critical path — mounts only after first paint of the shell.
const AtlasAssistant = lazy(() =>
  import("./atlas-assistant.tsx").then((m) => ({ default: m.AtlasAssistant })),
);

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/claims", label: "Claims", icon: FileText },
  { to: "/app/supplements", label: "Supplements", icon: Sparkles },
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/adjusters", label: "Adjusters", icon: UserCog },
  { to: "/app/documents", label: "Documents", icon: FolderOpen },
  { to: "/app/interview", label: "AI Interview", icon: MessageSquare },
  { to: "/app/calendar", label: "Calendar", icon: Calendar },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

type NavItem = (typeof NAV)[number] & { exact?: boolean };

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unread = useUnreadNotifications();
  const { isAdmin } = useRoles();
  const nav: NavItem[] = isAdmin
    ? [...NAV, { to: "/app/admin", label: "Admin", icon: ShieldCheck }]
    : NAV;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function isActive(item: NavItem) {
    const exact = "exact" in item ? item.exact : false;
    return exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
  }

  function NavList({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav aria-label="Primary" className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as "/app"}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.to === "/app/notifications" && unread > 0 && (
                <span
                  className="ml-auto rounded-full bg-atlas-signal text-atlas-navy text-[10px] font-mono px-1.5 py-0.5"
                  aria-label={`${unread} unread notifications`}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-dvh bg-atmosphere text-foreground">
      {/* Skip link for keyboard/AT users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="flex min-h-dvh">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-atlas-navy/40 backdrop-blur-xl">
          <div className="px-6 py-6">
            <Link to="/app" className="flex items-center gap-2">
              <img src="/atlas-logo.png" alt="Atlas" className="h-8 w-8 object-contain" />
              <span className="font-display text-xl text-gradient-atlas">ATLAS</span>
            </Link>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              AI Operations
            </p>
          </div>
          <NavList />
          <div className="p-3 border-t border-border">
            <div
              className="px-3 py-2 text-xs text-muted-foreground truncate"
              title={email ?? undefined}
            >
              {email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-atlas-navy/30 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            {/* Mobile nav trigger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 shrink-0"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 p-0 bg-atlas-navy/95 backdrop-blur-xl border-border"
              >
                <SheetHeader className="px-6 py-6 text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <img src="/atlas-logo.png" alt="Atlas" className="h-8 w-8 object-contain" />
                    <span className="font-display text-xl text-gradient-atlas">ATLAS</span>
                  </SheetTitle>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    AI Operations
                  </p>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100dvh-96px)]">
                  <NavList onNavigate={() => setMobileNavOpen(false)} />
                  <div className="p-3 border-t border-border">
                    <div className="px-3 py-2 text-xs text-muted-foreground truncate">{email}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg sm:text-xl truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>

            {/* Palette: full pill on ≥sm, icon on mobile */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white/5 text-sm text-muted-foreground hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Open command palette"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Ask or navigate</span>
              <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-10 w-10 shrink-0"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Suspense fallback={null}>
        <AtlasAssistant />
      </Suspense>
    </div>
  );
}
