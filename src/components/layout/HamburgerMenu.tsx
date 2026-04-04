import { useNavigate } from "react-router-dom";
import { X, Settings, HelpCircle, Shield, LogOut, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Preferences", icon: Sliders, path: "/profile" },
  { label: "Settings", icon: Settings, path: "/profile" },
  { label: "Support", icon: HelpCircle, path: "/support" },
  { label: "Privacy & Terms", icon: Shield, path: "/support" },
];

const HamburgerMenu = ({ open, onClose }: HamburgerMenuProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate("/auth");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-72 bg-background shadow-2xl animate-slide-up flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
          <span className="text-lg font-bold font-heading text-primary">Margdarshi</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => { navigate(path); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>

        <div className="border-t border-border p-4 pb-safe">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;
