import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { db } from "../firebase";
import type { Chat } from "../types/chat";
import { formatChatTime, getInitials } from "../utils/chat";

const RenderChatUser = ({ item }: { item: Chat }) => {
  const { t, i18n } = useTranslation();
  const [lastMessage, setLastMessage] = useState<string | null>(item.lastMessageText || null);
  const anotherUser = item.participants?.find((member) => member.executor_id);
  const name = anotherUser?.name || t("executor");
  const timeLabel = formatChatTime(item, i18n.language);

  useEffect(() => {
    const q = query(collection(db, "chats", item.id, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => docSnap.data());
      const latest =
        messages.length > 0 ? messages[0].text || (messages[0].image && t("image")) : t("noMessages");
      setLastMessage(String(latest));
    });
    return unsubscribe;
  }, [item.id, t]);

  return (
    <Link className="chat-item" to={`/app/chats/${item.id}`} state={{ chat: item }}>
      <div className="avatar avatar-initials" aria-hidden>
        {getInitials(name)}
      </div>
      <div className="chat-item-body">
        <div className="chat-item-top">
          <div className="chat-name">{name}</div>
          {timeLabel ? <div className="chat-time">{timeLabel}</div> : null}
        </div>
        <div className="chat-preview">{lastMessage || t("noMessages")}</div>
      </div>
    </Link>
  );
};

export default RenderChatUser;
