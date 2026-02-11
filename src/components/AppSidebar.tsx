import { Home, MessageSquare, FileText, Bell, User, LogOut, Menu, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Board", url: "/board", icon: FileText },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Notice", url: "/notice", icon: Bell },
  { title: "My Page", url: "/mypage", icon: User },
];

export function AppSidebar() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56"} collapsible="icon">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!collapsed && <span className="font-display text-lg font-bold text-sidebar-primary tracking-tight">TF</span>}
        <SidebarTrigger className="ml-auto text-sidebar-foreground">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Shield className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="hover:bg-sidebar-accent cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
