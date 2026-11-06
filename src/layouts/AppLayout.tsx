import { Outlet, matchPath, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import { useLiveSync } from "../hooks/useLiveSync";
import { usePushNotifications } from "../hooks/usePushNotifications";

const hideTabBarOn = (pathname: string) =>
  Boolean(
    matchPath({ path: "/app/chats/:chatId", end: true }, pathname) ||
      matchPath({ path: "/app/create-order", end: true }, pathname) ||
      matchPath({ path: "/app/orders/:orderId", end: true }, pathname) ||
      matchPath({ path: "/app/about", end: true }, pathname)
  );

const AppLayout = () => {
  const location = useLocation();
  useLiveSync();
  usePushNotifications();
  const hideTabBar = hideTabBarOn(location.pathname);

  return (
    <div className="app-layout">
      <div className="app-layout-body">
        <Outlet />
      </div>
      {hideTabBar ? null : <TabBar />}
    </div>
  );
};

export default AppLayout;
