import { Home, Grid3X3, Calendar, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMessagesClick: () => void;
  onModalidadesClick: () => void;
  onGroupsClick: () => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
  onMessagesClick,
  onModalidadesClick,
  onGroupsClick,
}: BottomNavigationProps) {
  const navItems = [
    {
      id: "home",
      icon: Home,
      label: "Início",
      onClick: () => onTabChange("home"),
    },
    {
      id: "modalidades",
      icon: Grid3X3,
      label: "Modalidades",
      onClick: onModalidadesClick,
    },
    {
      id: "events",
      icon: Calendar,
      label: "Eventos",
      onClick: () => onTabChange("events"),
    },
    {
      id: "groups",
      icon: Users,
      label: "Grupos",
      onClick: onGroupsClick,
    },
    {
      id: "messages",
      icon: MessageCircle,
      label: "Mensagens",
      onClick: onMessagesClick,
      badge: 3,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border md:hidden z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-full rounded-none relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={item.onClick}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-green-500 text-white"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
