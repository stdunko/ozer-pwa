import { useEffect, useState } from "react";
import { useViewportLock } from "./hooks/useViewportLock";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import AssistantScreen from "./screens/AssistantScreen";
import CreateOrderScreen from "./screens/CreateOrderScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderScreen from "./screens/OrderScreen";
import OrderDetailScreen from "./screens/OrderDetailScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import AboutScreen from "./screens/AboutScreen";
import InstallBanner from "./components/InstallBanner";
import { appPathFromUrl, NAVIGATE_EVENT, peekPendingPath, rememberPendingPath, takePendingPath } from "./utils/deepLink";

const SwNavigation = () => {
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.authorization.token);

  useEffect(() => {
    const go = (raw?: string) => {
      const path = appPathFromUrl(raw);
      if (!path.startsWith("/app")) {
        return;
      }
      if (!token) {
        rememberPendingPath(path);
        return;
      }
      navigate(path);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && typeof event.data.url === "string") {
        go(event.data.url);
      }
    };
    const onNavigate = (event: Event) => {
      const url = (event as CustomEvent<{ url?: string }>).detail?.url;
      go(url);
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMessage);
    }
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
    };
  }, [navigate, token]);

  return null;
};

const AuthedFallback = ({ home }: { home: string }) => {
  const pending = peekPendingPath();
  useEffect(() => {
    if (pending) {
      takePendingPath();
    }
  }, [pending]);
  return <Navigate to={pending || home} replace />;
};

const GuestRedirect = () => {
  const location = useLocation();
  useEffect(() => {
    rememberPendingPath(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);
  return <Navigate to="/login" replace />;
};

const App = () => {
  useViewportLock();
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
          <Route path="*" element={<GuestRedirect />} />
        </>
      ) : (
        <>
          <Route path="/app" element={<AppLayout />}>
            <Route path="assistant" element={<AssistantScreen />} />
            <Route path="categories" element={<HomeScreen />} />
            <Route path="create-order" element={<CreateOrderScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="orders" element={<OrderScreen />} />
            <Route path="orders/:orderId" element={<OrderDetailScreen />} />
            <Route path="chats" element={<ChatListScreen />} />
            <Route path="chats/:chatId" element={<ChatScreen />} />
            <Route path="about" element={<AboutScreen />} />
          </Route>
          <Route path="*" element={<AuthedFallback home="/app/categories" />} />
        </>
      )}
    </Routes>
    </>
  );
};

export default App;
