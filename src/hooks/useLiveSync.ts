import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getMyOrders } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { resetLive, setChats, setChatsLoading, setOrders } from "../store/liveSlice";
import { setUserPhoto } from "../store/userSlice";
import type { Chat } from "../types/chat";
import type { Order } from "../types/order";
import { getChatTimestampMs } from "../utils/chat";
import { ORDERS_POLL_INTERVAL_MS, reportOrderStatusChanges } from "../utils/orderSync";
import { notifyIfHidden } from "./usePushNotifications";

const mergeChats = (current: Chat[], incoming: Chat[]) => {
  const next = new Map(current.map((chat) => [chat.id, chat]));
  incoming.forEach((chat) => next.set(chat.id, chat));
  return [...next.values()].sort((a, b) => getChatTimestampMs(b) - getChatTimestampMs(a));
};

export const useLiveSync = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { showApiError, showInfo } = useNotifier();
  const token = useAppSelector((state) => state.authorization.token);
  const userId = useAppSelector((state) => state.user.id);
  const orders = useAppSelector((state) => state.live.orders);
  const refreshNonce = useAppSelector((state) => state.live.refreshNonce);
  const ordersRef = useRef(orders);
  const chatBucketsRef = useRef<Chat[][]>([[], []]);
  const refreshNonceRef = useRef(refreshNonce);

  ordersRef.current = orders;

  const loadOrders = useCallback(
    async (silent = false) => {
      if (!token) {
        return;
      }
      const { response, error } = await getMyOrders();
      if (error) {
        if (!silent) {
          showApiError(error, "errorLoadOrders");
          dispatch(setOrders(ordersRef.current));
        }
        return;
      }
      if (!response?.data) {
        if (!silent) {
          dispatch(setOrders(ordersRef.current));
        }
        return;
      }
      const nextOrders = response.data as Order[];
      if (silent) {
        reportOrderStatusChanges(ordersRef.current, nextOrders, ({ categoryName, statusKey }) => {
          const message = t("orderStatusUpdated", { category: categoryName, status: t(statusKey) });
          showInfo(message);
          notifyIfHidden(categoryName || "Ozeril", t(statusKey), "/app/orders");
        });
      }
      dispatch(setOrders(nextOrders));
    },
    [dispatch, showApiError, showInfo, t, token]
  );

  useEffect(() => {
    if (!token) {
      dispatch(resetLive());
      return;
    }

    void loadOrders(false);
    const intervalId = window.setInterval(() => {
      void loadOrders(true);
    }, ORDERS_POLL_INTERVAL_MS);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void loadOrders(true);
      }
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [dispatch, loadOrders, token]);

  useEffect(() => {
    if (!token || !userId) {
      dispatch(setChatsLoading(false));
      return;
    }

    dispatch(setChatsLoading(true));
    chatBucketsRef.current = [[], []];
    const collectionRef = collection(db, "chats");
    const queries = [
      query(collectionRef, where("participantsIds", "array-contains", userId)),
      query(collectionRef, where("participantsIds", "array-contains", String(userId))),
    ];

    const unsubscribers = queries.map((chatQuery, index) =>
      onSnapshot(
        chatQuery,
        (snapshot) => {
          chatBucketsRef.current[index] = snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Chat
          );
          dispatch(setChats(mergeChats(chatBucketsRef.current[0], chatBucketsRef.current[1])));
        },
        (error) => {
          console.error("Firestore chats:", error);
          showApiError(error, "errorLoadChats");
          dispatch(setChatsLoading(false));
        }
      )
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [dispatch, showApiError, token, userId]);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }
    return onSnapshot(doc(db, "userProfiles", String(userId)), (snapshot) => {
      const photo = snapshot.data()?.photo;
      if (typeof photo === "string") {
        dispatch(setUserPhoto(photo));
      }
    });
  }, [dispatch, token, userId]);

  useEffect(() => {
    if (!token || refreshNonce === refreshNonceRef.current) {
      return;
    }
    refreshNonceRef.current = refreshNonce;
    void loadOrders(true);
  }, [loadOrders, refreshNonce, token]);
};
