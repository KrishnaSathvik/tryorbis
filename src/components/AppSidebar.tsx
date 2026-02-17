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
    <Sidebar className="border-r border-sidebar-border bg-white/50 backdrop-blur-sm">
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
      <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
        <GuestUpgradeBanner />
        <div className="px-6 py-2 space-y-0.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{credits} credits</span>
            {isGuest && <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">Guest</span>}
          </div>
          {profile?.email && (
            <p className="text-[11px] text-muted-foreground truncate pl-6">{profile.email}</p>
          )}
          {profile?.display_name && (
            <p className="text-[11px] text-muted-foreground truncate pl-6">{profile.display_name}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-muted-foreground rounded-xl transition-all hover:text-foreground hover:bg-accent w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </Sidebar>
  );
}
