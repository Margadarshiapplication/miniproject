import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";
import HamburgerMenu from "./HamburgerMenu";

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onMenuToggle={() => setMenuOpen(true)} />
      <main className="flex-1 pb-20 pt-14 animate-fade-in">
        <Outlet />
      </main>
      <BottomTabBar />
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Layout;
