import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bot, Send } from "lucide-react";
import { addOrder, assistantTurn, getCategories } from "../services/api";
import { useAppSelector } from "../store/hooks";
import { useNotifier } from "../components/AppNotifier";
import { appConfig } from "../config";
import type { CategoryType } from "../types/category";
import AppHeader from "../components/AppHeader";
import CategoryIcon from "../components/CategoryIcon";
import MapView from "../components/MapView";
import NameModal from "../components/NameModal";
import PrimaryButton from "../components/PrimaryButton";
import { useCategoryLabel } from "../utils/categoryI18n";

type ChatMsg = { id: string; role: "user" | "assistant"; text: string };

const hasValidCoords = (lat: number | null, lng: number | null) =>
  lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

const AssistantScreen = () => {
  const { t, i18n } = useTranslation();
  const cat = useCategoryLabel();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user);
  const { showApiError, showSuccess, showInfo } = useNotifier();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [suggestedIds, setSuggestedIds] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [needLocation, setNeedLocation] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const skipMapEvent = useRef(true);

  const selected = categories.find((item) => item.id === categoryId) ?? null;
  const suggested = suggestedIds
    .map((id) => categories.find((item) => item.id === id))
    .filter(Boolean) as CategoryType[];
  const pinSet = pinTouched && hasValidCoords(latitude, longitude);
  const showMap = needLocation || pinTouched || Boolean(selected && description && price);
  const canCreate = Boolean(selected && description.trim().length >= 4 && price && pinSet);

  useEffect(() => {
    setMessages([
      { id: "welcome", role: "assistant", text: t("assistantWelcome") },
    ]);
  }, [t]);

  useEffect(() => {
    void (async () => {
      const { response, error } = await getCategories();
      if (error) {
        showApiError(error, "errorLoadCategories");
        return;
      }
      if (response?.data) setCategories(response.data);
    })();
  }, [showApiError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLatitude(appConfig.defaultCoords.latitude);
      setLongitude(appConfig.defaultCoords.longitude);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => {
        setLatitude(appConfig.defaultCoords.latitude);
        setLongitude(appConfig.defaultCoords.longitude);
        showInfo("locationDenied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [showInfo]);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, needLocation]);

  const sendTurn = async (history: ChatMsg[], extras?: { categoryId?: number | null }) => {
    setBusy(true);
    const nextCategoryId = extras?.categoryId ?? categoryId;
    const { response, error } = await assistantTurn({
      messages: history
        .filter((item) => item.id !== "welcome")
        .map((item) => ({ role: item.role, content: item.text })),
      locale: i18n.language,
      ...(typeof nextCategoryId === "number" ? { categoryId: nextCategoryId } : {}),
      ...(description ? { description } : {}),
      ...(price ? { price } : {}),
      hasLocation: pinSet,
    });
    setBusy(false);
    if (error || !response?.data) {
      showApiError(error || new Error("assistant"), "assistantError");
      return;
    }
    const data = response.data as {
      reply?: string;
      categoryId?: number | null;
      suggestedCategoryIds?: number[];
      description?: string | null;
      price?: number | null;
      needLocation?: boolean;
    };
    if (typeof data.categoryId === "number") setCategoryId(data.categoryId);
    if (Array.isArray(data.suggestedCategoryIds)) setSuggestedIds(data.suggestedCategoryIds);
    if (data.description) setDescription(data.description);
    if (typeof data.price === "number" && data.price > 0) setPrice(data.price);
    setNeedLocation(Boolean(data.needLocation));
    if (data.reply) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: data.reply as string },
      ]);
    }
  };

  const onSend = async (raw?: string, extras?: { categoryId?: number | null }) => {
    const content = (raw ?? text).trim();
    if (!content || busy) return;
    const next: ChatMsg = { id: `u-${Date.now()}`, role: "user", text: content };
    const history = [...messages, next];
    setMessages(history);
    setText("");
    await sendTurn(history, extras);
  };

  const onPickCategory = async (item: CategoryType) => {
    setCategoryId(item.id);
    setSuggestedIds([]);
    await onSend(cat(item), { categoryId: item.id });
  };

  const submitOrder = async () => {
    if (!selected || !price || !description.trim() || !hasValidCoords(latitude, longitude)) return;
    setCreating(true);
    const { error } = await addOrder({
      userId: user.id,
      categoryId: selected.id,
      price,
      description: description.trim(),
      latitude: latitude!,
      longitude: longitude!,
    });
    setCreating(false);
    if (error) {
      showApiError(error, "errorCreateOrder");
      return;
    }
    showSuccess("successOrderCreated");
    navigate("/app/orders");
  };

  const onCreate = async () => {
    if (!user.name || !user.email) {
      setNameModalVisible(true);
      return;
    }
    await submitOrder();
  };

  const draftLine = useMemo(() => {
    const parts: string[] = [];
    if (selected) parts.push(cat(selected));
    if (price) parts.push(`${price} ₪`);
    if (pinSet) parts.push(t("assistantPinSet"));
    return parts.join(" · ");
  }, [cat, pinSet, price, selected, t]);

  return (
    <div className="screen">
      <AppHeader title={t("assistantTitle")} />
      <div className="messages" ref={listRef}>
        {messages.map((item) => (
          <div key={item.id} className={`bubble ${item.role === "user" ? "out" : "in"}`}>
            {item.role === "assistant" ? (
              <div className="assistant-bubble-mark" aria-hidden="true">
                <Bot size={14} />
              </div>
            ) : null}
            <div className="bubble-text">{item.text}</div>
          </div>
        ))}
        {busy ? <p className="assistant-typing">{t("assistantTyping")}</p> : null}
        {suggested.length > 0 ? (
          <div className="assistant-chips">
            <div className="assistant-chips-label">{t("assistantSuggest")}</div>
            {suggested.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${categoryId === item.id ? "active" : ""}`}
                onClick={() => void onPickCategory(item)}
              >
                <CategoryIcon iconUrl={item.icon} categoryName={item.name} size={16} />
                {cat(item)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {showMap ? (
        <div className="assistant-map">
          <p className="assistant-map-hint">{t("assistantNeedPin")}</p>
          {latitude != null && longitude != null ? (
            <MapView
              latitude={latitude}
              longitude={longitude}
              centerPin
              onRegionChange={(region) => {
                setLatitude(region.latitude);
                setLongitude(region.longitude);
                if (skipMapEvent.current) {
                  skipMapEvent.current = false;
                  return;
                }
                setPinTouched(true);
              }}
            />
          ) : (
            <div className="loader">
              <span className="spinner" />
            </div>
          )}
          {hasValidCoords(latitude, longitude) && !pinTouched ? (
            <button type="button" className="assistant-pin-btn" onClick={() => setPinTouched(true)}>
              {t("assistantUsePin")}
            </button>
          ) : null}
        </div>
      ) : null}
      {draftLine ? <p className="assistant-draft">{draftLine}</p> : null}
      {canCreate ? (
        <div className="assistant-create">
          <PrimaryButton title={t("assistantCreate")} onPress={onCreate} loading={creating} />
        </div>
      ) : null}
      <div className="input-bar">
        <div className="composer-row">
          <textarea
            className="composer"
            rows={1}
            placeholder={t("assistantPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
          />
          <button type="button" className="send-btn" disabled={!text.trim() || busy} onClick={() => void onSend()}>
            <Send size={20} />
          </button>
        </div>
      </div>
      <NameModal
        isVisible={nameModalVisible}
        onClose={() => setNameModalVisible(false)}
        onSaved={() => {
          setNameModalVisible(false);
          void submitOrder();
        }}
      />
    </div>
  );
};

export default AssistantScreen;
