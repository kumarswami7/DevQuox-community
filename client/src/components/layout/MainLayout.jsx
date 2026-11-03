import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { BottomNav } from "./BottomNav";
import { useAuthStore } from "../../store";
import { PRE_LAUNCH_CONFIG } from "../../utils/preLaunchConfig";

export const MainLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  // If pre-launch is active, strictly redirect any workspace attempt to /pre-launch
  if (PRE_LAUNCH_CONFIG.isPreLaunchActive(user)) {
    return <Navigate to="/pre-launch" replace />;
  }

  const isMessages = location.pathname.startsWith('/messages');

  return (
    <div className={`bg-white mesh-gradient flex flex-col relative ${isMessages ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <div
        className={`flex-1 w-full pt-16 md:pl-64 ${
          isMessages
            ? 'xl:pr-0 h-[calc(100vh-4rem)] overflow-hidden'
            : 'xl:pr-80 min-h-[calc(100vh-4rem)]'
        }`}
      >
        <Sidebar />
        {/* Central Dynamic Content Area */}
        <main
          className={
            isMessages
              ? 'p-0 m-0 w-full h-full overflow-hidden max-w-none'
              : 'p-4 md:p-7 pb-24 lg:pb-10 max-w-7xl w-full mx-auto'
          }
        >
          <Outlet />
        </main>
        {!isMessages && <RightSidebar />}
      </div>
      {!isMessages && <BottomNav />}
    </div>
  );
};

