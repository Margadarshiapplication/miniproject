import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, MessageCircle, Map, User } from "lucide-react";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/coach", label: "Coach", icon: MessageCircle },
  { path: "/trips", label: "Trips", icon: Map },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
