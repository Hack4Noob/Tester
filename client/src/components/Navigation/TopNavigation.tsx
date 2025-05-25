import { useState } from "react";
import { Search, Bell, MessageCircle, Moon, Sun, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface TopNavigationProps {
  onMessagesClick: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export function TopNavigation({ onMessagesClick, onThemeToggle, isDarkMode }: TopNavigationProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-surface border-b border-border z-50 h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <h1 className="text-xl font-semibold text-primary hidden md:block">
            VIMBALAMBI NEWS
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 rounded-full focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              3
            </Badge>
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative" onClick={onMessagesClick}>
            <MessageCircle className="h-5 w-5" />
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-green-500 text-white"
            >
              5
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={onThemeToggle}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-10 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
