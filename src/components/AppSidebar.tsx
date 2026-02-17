import { LayoutDashboard, Lightbulb, ClipboardCheck, Archive, FileText, LogOut, BarChart3, Coins } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
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
  { title: "Generate Ideas", url: "/generate", icon: Lightbulb },
  { title: "Validate Idea", url: "/validate", icon: ClipboardCheck },
  { title: "My Ideas", url: "/ideas", icon: Archive },
  { title: "History", url: "/history", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
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
          <img src={orbisLogo} alt="Orbis" className="h-7 w-7" />
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
        <div className="flex items-center gap-2 px-6 py-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{credits} credits</span>
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
