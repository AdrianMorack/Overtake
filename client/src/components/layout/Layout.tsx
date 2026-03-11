import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
