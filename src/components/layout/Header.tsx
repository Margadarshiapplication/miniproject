import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Margdarshi";
    if (path === "/discover") return "Discover";
    if (path === "/coach") return "AI Coach";
    if (path === "/trips") return "My Trips";
    if (path === "/profile") return "Profile";
    if (path === "/search") return "Search";
    if (path === "/notifications") return "Notifications";
    if (path.startsWith("/plan")) return "Plan Trip";
    if (path.startsWith("/itinerary")) return "Itinerary";
    if (path.startsWith("/destination")) return "Destination";
    if (path.startsWith("/prepare")) return "Preparation";
    return "Margdarshi";
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md pt-safe">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold font-heading text-foreground">{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => navigate("/search")} className="h-9 w-9">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")} className="h-9 w-9">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
