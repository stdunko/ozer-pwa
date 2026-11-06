import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setToken } from "./store/authSlice";
import { setUser } from "./store/userSlice";
import { resetLive } from "./store/liveSlice";
import { getCurrentUser } from "./services/api";
import { useNotifier } from "./components/AppNotifier";
import { storage } from "./utils/storage";
import { shouldShowOnboarding } from "./utils/onboarding";
import AppLayout from "./layouts/AppLayout";
import OnboardingScreen from "./screens/OnboardingScreen";
import GreetingScreen from "./screens/GreetingScreen";
import EnterNumberScreen from "./screens/EnterNumberScreen";
import EnterOtpScreen from "./screens/EnterOtpScreen";
import HomeScreen from "./screens/HomeScreen";
import CreateOrderScreen from "./screens/CreateOrderScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderScreen from "./screens/OrderScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import AboutScreen from "./screens/AboutScreen";
import InstallBanner from "./components/InstallBanner";

const SwNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && typeof event.data.url === "string") {
        const path = event.data.url.replace(window.location.origin, "") || "/app/orders";
        navigate(path);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  return null;
};

const App = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.authorization.token);
  const { showApiError } = useNotifier();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding());

  useEffect(() => {
    const saved = storage.get("token");
    if (saved) {
      dispatch(setToken(saved));
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      if (!token) {
        return;
      }
      const { response, error } = await getCurrentUser();
      if (error) {
        showApiError(error, "errorGeneric");
        if ((error as { response?: { status?: number } })?.response?.status === 401) {
          storage.remove("token");
          dispatch(setToken(""));
          dispatch(resetLive());
        }
        return;
      }
      if (response?.data) {
        const cachedPhoto = storage.get(`userPhoto:${response.data.id}`);
        dispatch(setUser({
          ...response.data,
          photo: response.data.photo || cachedPhoto || null,
        }));
      }
    })();
  }, [dispatch, token, showApiError]);

  if (showOnboarding) {
    return (
      <>
        <InstallBanner />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  return (
    <>
    <InstallBanner />
    <SwNavigation />
    <Routes>
      {!token ? (
        <>
          <Route path="/login" element={<GreetingScreen />} />
          <Route path="/login/phone" element={<EnterNumberScreen />} />
          <Route path="/login/otp" element={<EnterOtpScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/app" element={<AppLayout />}>
            <Route path="categories" element={<HomeScreen />} />
            <Route path="create-order" element={<CreateOrderScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="orders" element={<OrderScreen />} />
            <Route path="chats" element={<ChatListScreen />} />
            <Route path="chats/:chatId" element={<ChatScreen />} />
            <Route path="about" element={<AboutScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/app/categories" replace />} />
        </>
      )}
    </Routes>
    </>
  );
};

export default App;
