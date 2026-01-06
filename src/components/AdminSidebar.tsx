import { 
  Calendar, 
  Database, 
  Users, 
  Activity,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Archive,
  MessageSquare,
  Shield,
  BookOpen,
  Target
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

const navigation = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Puzzle Center", url: "/admin/puzzles", icon: Calendar },
  { title: "Puzzle Validator", url: "/admin/validator", icon: CheckCircle2 },
  { title: "Puzzle Vault", url: "/admin/vault", icon: Shield },
  { title: "Dictionary", url: "/admin/dictionary", icon: Database },
  { title: "Word Feedback", url: "/admin/feedback", icon: MessageSquare },
  { title: "Analytics", url: "/admin/analytics", icon: Activity },
  { title: "Player Sessions", url: "/admin/sessions", icon: Users },
  { title: "Archive", url: "/admin/archive", icon: Archive },
  { title: "Measured Facts", url: "/admin/measured-facts", icon: BookOpen },
  { title: "Measured Puzzles", url: "/admin/measured-puzzles", icon: Target },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate("/login");
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Logo className="h-6" />
          {!collapsed && <span className="font-semibold">Admin</span>}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}