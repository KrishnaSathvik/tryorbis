import { LayoutDashboard, Lightbulb, ClipboardCheck, Archive, FileText, LogOut, BarChart3, Zap, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { GuestUpgradeBanner } from "@/components/GuestUpgradeBanner";
import orbisLogo from "@/assets/orbis-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orbis AI", url: "/chat", icon: Sparkles },
  { title: "Generate Ideas", url: "/generate", icon: Lightbulb },
  { title: "Validate Idea", url: "/validate", icon: ClipboardCheck },
  { title: "My Ideas", url: "/ideas", icon: Archive },
  { title: "History", url: "/history", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { profile, signOut, isGuest } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar backdrop-blur-sm">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <img src={orbisLogo} alt="Orbis" className="h-7 w-7 dark-invert" />
          <h1 className="text-xl font-bold tracking-tight font-nunito text-gradient-primary">
            Orbis
          </h1>
        </div>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 px-6">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-6 py-2.5 text-sm text-muted-foreground rounded-xl transition-all hover:text-foreground hover:bg-accent"
                      activeClassName="bg-accent text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto border-t border-sidebar-border p-3 space-y-2">
        <GuestUpgradeBanner />
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {(profile?.display_name || "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
              {isGuest && <span className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-full font-semibold leading-none">Guest</span>}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              <span>{credits} credits</span>
              {profile?.email && <span className="truncate ml-1">· {profile.email}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-xl transition-all hover:text-foreground hover:bg-accent w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </Sidebar>
  );
}
