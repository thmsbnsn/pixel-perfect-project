import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Music2,
  Wand2,
  Mic2,
  Layers,
  Library,
  Waves,
  Rocket,
  Cpu,
  Settings,
  Radio,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useJobs } from "@/state/jobs-store";
import { useSystemStatus } from "@/hooks/use-bridge";
import { bridge } from "@/bridge";
import { ComponentStateBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

const nav = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { title: "Songs", to: "/songs", icon: Music2, match: (p: string) => p.startsWith("/songs") },
  {
    title: "Generate",
    to: "/generate",
    icon: Wand2,
    match: (p: string) => p.startsWith("/generate"),
  },
  { title: "Vocals", to: "/vocals", icon: Mic2, match: (p: string) => p.startsWith("/vocals") },
  { title: "Stems", to: "/stems", icon: Layers, match: (p: string) => p.startsWith("/stems") },
  {
    title: "Library",
    to: "/library",
    icon: Library,
    match: (p: string) => p.startsWith("/library"),
  },
  {
    title: "Mix Review",
    to: "/mix-review",
    icon: Waves,
    match: (p: string) => p.startsWith("/mix-review"),
  },
  {
    title: "Releases",
    to: "/releases",
    icon: Rocket,
    match: (p: string) => p.startsWith("/releases"),
  },
  { title: "System", to: "/system", icon: Cpu, match: (p: string) => p.startsWith("/system") },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
    match: (p: string) => p.startsWith("/settings"),
  },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const jobs = useJobs();
  const activeCount = jobs.filter((j) => j.status === "queued" || j.status === "running").length;
  const { data: status } = useSystemStatus();
  const gpu = status?.find((s) => s.id === "gpu");
  const storage = status?.find((s) => s.id === "storage");
  const bridgeConn = bridge.getConnection();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary">
            <Radio className="h-4 w-4" />
          </div>
          {!collapsed ? (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-[0.18em] text-sidebar-foreground">
                VARYNT
              </span>
              <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                Studio
              </span>
            </div>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workstation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = item.match(pathname);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                bridgeConn.connected ? "bg-success" : "bg-destructive",
              )}
              aria-label={bridgeConn.connected ? "Bridge connected" : "Bridge offline"}
            />
            {activeCount > 0 ? (
              <span className="rounded bg-audio/20 px-1.5 text-[10px] font-medium text-audio tabular">
                {activeCount}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 px-2 py-2 text-[11px] text-sidebar-foreground">
            <SidebarStat
              label="Local bridge"
              right={
                <span
                  className={cn(
                    "font-medium",
                    bridgeConn.connected ? "text-success" : "text-destructive",
                  )}
                >
                  {bridgeConn.connected ? "Connected" : "Offline"}
                </span>
              }
            />
            <SidebarStat
              label="RTX 5060 Ti"
              right={
                gpu ? (
                  <ComponentStateBadge state={gpu.state} className="text-[10px]" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <SidebarStat
              label="Active jobs"
              right={<span className="tabular font-medium">{activeCount}</span>}
            />
            <SidebarStat
              label="Workspace"
              right={
                <span className="truncate text-muted-foreground">{storage?.message ?? "—"}</span>
              }
            />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarStat({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{right}</span>
    </div>
  );
}
