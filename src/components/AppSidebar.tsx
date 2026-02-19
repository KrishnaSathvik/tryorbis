import { LayoutDashboard, Lightbulb, ClipboardCheck, Archive, FileText, BarChart3, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSheet } from "@/components/ProfileSheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
  useSidebar,
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
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      // Small delay so navigation starts before sidebar animation
      setTimeout(() => setOpenMobile(false), 100);
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar backdrop-blur-sm">
      <div className="px-6 py-5">
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <img src={orbisLogo} alt="Orbis" className="h-7 w-7 dark-invert" />
          <h1 className="text-xl font-bold tracking-tight font-nunito text-gradient-primary">
            Orbis
          </h1>
        </a>
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
                      onClick={handleNavClick}
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
        <ProfileSheet>
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-accent transition-all cursor-pointer text-left">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {(profile?.display_name || "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
            </div>
          </button>
        </ProfileSheet>
      </div>
    </Sidebar>
  );
}
