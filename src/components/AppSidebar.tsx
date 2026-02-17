import { LayoutDashboard, Lightbulb, ClipboardCheck, Archive, FileText, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Generate Ideas", url: "/generate", icon: Lightbulb },
  { title: "Validate Idea", url: "/validate", icon: ClipboardCheck },
  { title: "My Backlog", url: "/backlog", icon: Archive },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Trends", url: "/trends", icon: TrendingUp },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Idea<span className="text-primary">Forge</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Discovery → Validation</p>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 px-6">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-6 py-2.5 text-sm text-sidebar-foreground rounded-lg transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
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
    </Sidebar>
  );
}
