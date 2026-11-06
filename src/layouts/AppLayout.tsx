import { Outlet, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";

const AppLayout = () => {
  const location = useLocation();
  const hideTabBar =
    location.pathname.includes("/chats/") ||
    location.pathname.includes("/create-order") ||
    location.pathname.includes("/about");

  return (
    <>
      <Outlet />
      {hideTabBar ? null : <TabBar />}
    </>
  );
};

export default AppLayout;
