import { Outlet, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import { useLiveSync } from "../hooks/useLiveSync";
import { usePushNotifications } from "../hooks/usePushNotifications";

const AppLayout = () => {
  const location = useLocation();
  useLiveSync();
  usePushNotifications();
  const hideTabBar =
    location.pathname.includes("/chats/") ||
    location.pathname.includes("/create-order") ||
    location.pathname.includes("/about");

  return (
    <div className={`app-layout ${hideTabBar ? "" : "has-tabbar"}`}>
      <div className="app-layout-body">
        <Outlet />
      </div>
      {hideTabBar ? null : <TabBar />}
    </div>
  );
};

export default AppLayout;
