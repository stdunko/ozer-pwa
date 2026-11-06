import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppHeader from "../components/AppHeader";
import RenderChatUser from "../components/RenderChatUser";
import { useAppSelector } from "../store/hooks";

const ChatListScreen = () => {
  const { t } = useTranslation();
  const chats = useAppSelector((state) => state.live.chats);
  const isChatLoading = useAppSelector((state) => state.live.chatsLoading);

  return (
    <div className="screen">
      <AppHeader title={t("chats")} />
      {isChatLoading && chats.length === 0 ? (
        <div className="loader">
          <span className="spinner" />
        </div>
      ) : chats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <MessageCircle size={32} />
          </div>
          <p className="empty">{t("yourChatsEmpty")}</p>
        </div>
      ) : (
        <div className="scroll chat-list">
          {chats.map((item) => (
            <RenderChatUser key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatListScreen;
