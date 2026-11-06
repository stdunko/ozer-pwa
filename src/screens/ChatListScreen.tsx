import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAppSelector } from "../store/hooks";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import RenderChatUser from "../components/RenderChatUser";
import type { Chat } from "../types/chat";

const ChatListScreen = () => {
  const { t } = useTranslation();
  const { showApiError } = useNotifier();
  const { id: userId } = useAppSelector((state) => state.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      return;
    }

    setIsChatLoading(true);
    const q = query(
      collection(db, "chats"),
      where("participantsIds", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setChats(querySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Chat));
        setIsChatLoading(false);
      },
      (error) => {
        console.error("Firestore chats:", error);
        showApiError(error, "errorLoadChats");
        setIsChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, showApiError]);

  return (
    <div className="screen">
      <AppHeader title={t("chats")} />
      {isChatLoading && chats.length === 0 ? (
        <div className="loader">
          <span className="spinner" />
        </div>
      ) : chats.length === 0 ? (
        <p className="empty">{t("yourChatsEmpty")}</p>
      ) : (
        <div className="scroll" style={{ paddingTop: 8 }}>
          {chats.map((item) => (
            <RenderChatUser key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatListScreen;
